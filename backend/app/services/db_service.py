import re
import datetime
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
import oracledb
from ..database import db_manager

class DBService:
    @staticmethod
    def _map_oracle_error(e: Exception) -> HTTPException:
        err_msg = str(e)
        if "ORA-20001" in err_msg or "Overselling blocked" in err_msg:
            # Extract clean message
            match = re.search(r"ORA-20001:\s*(.*?)(?:\n|ORA-|$)", err_msg)
            msg = match.group(1).strip() if match else "Overselling blocked: Requested quantity exceeds available stock."
            return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
        elif "ORA-02292" in err_msg or "integrity constraint" in err_msg.lower():
            return HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete this record because it is referenced by other records (Foreign Key constraint)."
            )
        elif "ORA-00001" in err_msg or "UNIQUE constraint" in err_msg:
            return HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A record with these unique details (e.g. brand name, username or contact number) already exists."
            )
        return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database Error: {err_msg}")

    @classmethod
    def query(cls, sql: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        params = params or {}
        if db_manager.is_oracle_active and db_manager.oracle_pool:
            try:
                with db_manager.oracle_pool.acquire() as connection:
                    with connection.cursor() as cursor:
                        cursor.execute(sql, params)
                        columns = [col[0].lower() for col in cursor.description] if cursor.description else []
                        rows = cursor.fetchall()
                        return [dict(zip(columns, row)) for row in rows]
            except Exception as e:
                raise cls._map_oracle_error(e)
        else:
            # Fallback SQLite Engine
            try:
                conn = db_manager.fallback_conn
                # Convert :param to :param for sqlite named params
                cur = conn.cursor()
                cur.execute(sql, params)
                rows = cur.fetchall()
                if not rows:
                    return []
                columns = [col[0].lower() for col in cur.description]
                return [dict(zip(columns, row)) for row in rows]
            except Exception as e:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @classmethod
    def query_one(cls, sql: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        results = cls.query(sql, params)
        return results[0] if results else None

    @classmethod
    def execute(cls, sql: str, params: Optional[Dict[str, Any]] = None) -> int:
        params = params or {}
        if db_manager.is_oracle_active and db_manager.oracle_pool:
            try:
                with db_manager.oracle_pool.acquire() as connection:
                    with connection.cursor() as cursor:
                        cursor.execute(sql, params)
                        connection.commit()
                        return cursor.rowcount
            except Exception as e:
                raise cls._map_oracle_error(e)
        else:
            try:
                conn = db_manager.fallback_conn
                cur = conn.cursor()
                cur.execute(sql, params)
                conn.commit()
                return cur.rowcount
            except Exception as e:
                err_msg = str(e)
                if "UNIQUE constraint failed" in err_msg:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Unique constraint violation: A record with this value already exists."
                    )
                if "FOREIGN KEY constraint failed" in err_msg:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot delete or insert: Foreign Key constraint restriction."
                    )
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    @classmethod
    def generate_id(cls, entity_type: str) -> str:
        """Call PL/SQL fn_generate_entity_id in Oracle or emulate sequences."""
        prefix_map = {
            "BRAND": ("BR", "SEQ_BRAND_ID", 2),
            "MODEL": ("MD", "SEQ_MODEL_ID", None),
            "COMPONENT": ("CMP", "SEQ_COMPONENT_ID", 2),
            "SUPPLIER": ("SUP", "SEQ_SUPPLIER_ID", 2),
            "BATCH": ("BCH", "SEQ_BATCH_ID", None),
            "SALE": ("SL", "SEQ_SALE_ID", None),
            "USER": ("USR", "SEQ_USER_ID", 2),
            "AUDIT": ("AUD", "SEQ_AUDIT_ID", 3)
        }
        ent = entity_type.upper()
        if ent not in prefix_map:
            raise ValueError(f"Unknown entity type: {entity_type}")

        if db_manager.is_oracle_active and db_manager.oracle_pool:
            try:
                with db_manager.oracle_pool.acquire() as connection:
                    with connection.cursor() as cursor:
                        new_id = cursor.callfunc("fn_generate_entity_id", oracledb.STRING, [ent])
                        return str(new_id)
            except Exception as e:
                raise cls._map_oracle_error(e)
        else:
            # Fallback sequence generation
            prefix, seq_name, pad = prefix_map[ent]
            conn = db_manager.fallback_conn
            cur = conn.cursor()
            cur.execute("SELECT current_val FROM DB_SEQUENCES WHERE seq_name = :s", {"s": seq_name})
            row = cur.fetchone()
            val = (row[0] if row else 1) + 1
            cur.execute("UPDATE DB_SEQUENCES SET current_val = :v WHERE seq_name = :s", {"v": val, "s": seq_name})
            conn.commit()
            if pad:
                return f"{prefix}{str(val).zfill(pad)}"
            return f"{prefix}{val}"

    @classmethod
    def calculate_bom_cost(cls, model_id: str) -> float:
        """Call PL/SQL function fn_calculate_model_bom_cost(p_model_id)."""
        if db_manager.is_oracle_active and db_manager.oracle_pool:
            try:
                with db_manager.oracle_pool.acquire() as connection:
                    with connection.cursor() as cursor:
                        val = cursor.callfunc("fn_calculate_model_bom_cost", oracledb.NUMBER, [model_id])
                        return float(val or 0.0)
            except Exception as e:
                raise cls._map_oracle_error(e)
        else:
            # Replicate exact PL/SQL logic: NVL(SUM(qty_req * unit_cost), 0)
            row = cls.query_one("""
                SELECT COALESCE(SUM(r.qty_req * c.unit_cost), 0.0) AS bom_cost
                FROM REQUIRES r
                JOIN COMPONENT c ON r.component_id = c.component_id
                WHERE r.model_id = :model_id
            """, {"model_id": model_id})
            return float(row["bom_cost"]) if row else 0.0

    @classmethod
    def record_batch_sale_sp(
        cls,
        sale_id: Optional[str],
        batch_id: str,
        quantity: int,
        sale_date: Optional[str],
        recorded_by: str = "system"
    ) -> Dict[str, Any]:
        """
        Call stored procedure sp_record_batch_sale_and_restock_check with OUT parameters.
        Returns: {sale_id, revenue, remaining_stock, reorder_alert_fired, message}
        """
        actual_sale_id = sale_id if (sale_id and sale_id.upper() != "AUTO") else None
        dt_val = sale_date or datetime.date.today().isoformat()

        if db_manager.is_oracle_active and db_manager.oracle_pool:
            try:
                with db_manager.oracle_pool.acquire() as connection:
                    with connection.cursor() as cursor:
                        # Prepare OUT parameter variables
                        o_revenue = cursor.var(oracledb.NUMBER)
                        o_remaining = cursor.var(oracledb.NUMBER)
                        o_alert = cursor.var(oracledb.STRING)
                        o_message = cursor.var(oracledb.STRING)

                        # Oracle DATE parsing if needed
                        py_date = datetime.datetime.strptime(dt_val, "%Y-%m-%d")

                        cursor.callproc("sp_record_batch_sale_and_restock_check", [
                            actual_sale_id,
                            batch_id,
                            quantity,
                            py_date,
                            recorded_by,
                            o_revenue,
                            o_remaining,
                            o_alert,
                            o_message
                        ])
                        connection.commit()

                        # If sale_id was auto, fetch the inserted record ID
                        resolved_sale_id = actual_sale_id
                        if not resolved_sale_id:
                            cursor.execute("""
                                SELECT sale_id FROM (
                                    SELECT sale_id FROM SALE WHERE batch_id = :b ORDER BY sale_id DESC
                                ) WHERE ROWNUM = 1
                            """, {"b": batch_id})
                            r = cursor.fetchone()
                            resolved_sale_id = r[0] if r else "SL_UNKNOWN"

                        return {
                            "sale_id": resolved_sale_id,
                            "batch_id": batch_id,
                            "quantity": quantity,
                            "sale_date": dt_val,
                            "invoice_revenue": float(o_revenue.getvalue() or 0.0),
                            "remaining_stock": int(o_remaining.getvalue() or 0),
                            "reorder_alert_fired": (o_alert.getvalue() == "Y"),
                            "status_message": str(o_message.getvalue() or "")
                        }
            except Exception as e:
                raise cls._map_oracle_error(e)
        else:
            # Fallback Engine simulating PL/SQL procedure & trigger logic
            conn = db_manager.fallback_conn
            cur = conn.cursor()

            # 1. Fetch batch and model
            cur.execute("""
                SELECT mb.production_qty, mb.reorder_level, mm.list_price
                FROM MANUFACTURING_BATCH mb
                JOIN MOBILE_MODEL mm ON mb.model_id = mm.model_id
                WHERE mb.batch_id = :b
            """, {"b": batch_id})
            batch = cur.fetchone()
            if not batch:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Batch {batch_id} not found.")

            prod_qty, reorder_lvl, list_price = batch[0], batch[1], float(batch[2])

            # 2. Existing sales
            cur.execute("SELECT COALESCE(SUM(quantity), 0) FROM SALE WHERE batch_id = :b", {"b": batch_id})
            current_sold = cur.fetchone()[0]
            avail = prod_qty - current_sold

            # 3. Trigger check: Overselling blocked
            if quantity > avail:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Overselling blocked: Requested quantity ({quantity}) exceeds available stock ({avail}) for Batch {batch_id}."
                )

            # 4. Generate Sale ID
            if not actual_sale_id:
                actual_sale_id = cls.generate_id("SALE")

            # 5. Insert Sale
            cur.execute("""
                INSERT INTO SALE (sale_id, batch_id, quantity, sale_date)
                VALUES (:s, :b, :q, :d)
            """, {"s": actual_sale_id, "b": batch_id, "q": quantity, "d": dt_val})

            remaining = avail - quantity
            revenue = quantity * list_price
            alert_fired = remaining <= reorder_lvl
            alert_flag = "Y" if alert_fired else "N"

            msg = (f"Sale {actual_sale_id} recorded successfully. REORDER ALERT: Stock level ({remaining}) is at or below threshold ({reorder_lvl})."
                   if alert_fired else
                   f"Sale {actual_sale_id} recorded successfully. Remaining stock: {remaining} units.")

            # 6. Audit log
            audit_id = cls.generate_id("AUDIT")
            cur.execute("""
                INSERT INTO SALE_AUDIT (audit_id, sale_id, batch_id, quantity, sale_date, recorded_by, reorder_alert_fired, remaining_stock)
                VALUES (:aid, :sid, :bid, :qty, :sdate, :recby, :alert, :rem)
            """, {
                "aid": audit_id, "sid": actual_sale_id, "bid": batch_id, "qty": quantity,
                "sdate": dt_val, "recby": recorded_by, "alert": alert_flag, "rem": remaining
            })
            conn.commit()

            return {
                "sale_id": actual_sale_id,
                "batch_id": batch_id,
                "quantity": quantity,
                "sale_date": dt_val,
                "invoice_revenue": revenue,
                "remaining_stock": remaining,
                "reorder_alert_fired": alert_fired,
                "status_message": msg
            }


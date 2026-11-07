from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from ..models.schemas import BatchOut, BatchDetailOut, BatchCreate, BatchUpdate
from ..services.auth_service import require_authenticated, require_manager_or_admin, require_admin
from ..services.db_service import DBService

router = APIRouter(prefix="/api/batches", tags=["Manufacturing Batches"])

@router.get("", response_model=List[BatchOut])
def list_batches(
    brand_id: Optional[str] = None,
    model_id: Optional[str] = None,
    status_filter: Optional[str] = None,  # "OPTIMAL" or "REORDER"
    current_user = Depends(require_authenticated)
):
    sql = """
        SELECT b.batch_id, b.model_id, m.model_name, br.brand_name,
               TO_CHAR(b.production_date) AS production_date,
               b.production_qty, b.manufacturing_cost, b.reorder_level,
               COALESCE((SELECT SUM(s.quantity) FROM SALE s WHERE s.batch_id = b.batch_id), 0) AS sold_qty,
               (SELECT COUNT(*) FROM SALE s WHERE s.batch_id = b.batch_id) AS sales_count
        FROM MANUFACTURING_BATCH b
        JOIN MOBILE_MODEL m ON b.model_id = m.model_id
        JOIN BRAND br ON m.brand_id = br.brand_id
        WHERE 1=1
    """
    params = {}
    if brand_id:
        sql += " AND m.brand_id = :bid"
        params["bid"] = brand_id
    if model_id:
        sql += " AND b.model_id = :mid"
        params["mid"] = model_id
    sql += " ORDER BY b.production_date DESC, b.batch_id DESC"

    rows = DBService.query(sql, params)
    result = []
    for r in rows:
        prod_qty = int(r["production_qty"])
        sold_qty = int(r["sold_qty"])
        remaining = prod_qty - sold_qty
        reorder_lvl = int(r["reorder_level"])
        stock_status = "REORDER IMMEDIATELY" if remaining <= reorder_lvl else "OPTIMAL STOCK"

        if status_filter:
            if status_filter.upper() == "REORDER" and stock_status != "REORDER IMMEDIATELY":
                continue
            if status_filter.upper() == "OPTIMAL" and stock_status != "OPTIMAL STOCK":
                continue

        mfg_cost = float(r["manufacturing_cost"])
        cost_per_unit = (mfg_cost / prod_qty) if prod_qty > 0 else 0.0
        bom_cost = DBService.calculate_bom_cost(r["model_id"])

        result.append({
            "batch_id": r["batch_id"],
            "model_id": r["model_id"],
            "model_name": r["model_name"],
            "brand_name": r["brand_name"],
            "production_date": str(r["production_date"])[:10],
            "production_qty": prod_qty,
            "manufacturing_cost": mfg_cost,
            "reorder_level": reorder_lvl,
            "sold_qty": sold_qty,
            "remaining_stock": remaining,
            "stock_status": stock_status,
            "cost_per_unit": round(cost_per_unit, 2),
            "bom_cost": round(bom_cost, 2),
            "sales_count": int(r["sales_count"])
        })
    return result

@router.get("/{batch_id}", response_model=BatchDetailOut)
def get_batch(batch_id: str, current_user = Depends(require_authenticated)):
    row = DBService.query_one("""
        SELECT b.batch_id, b.model_id, m.model_name, br.brand_name,
               TO_CHAR(b.production_date) AS production_date,
               b.production_qty, b.manufacturing_cost, b.reorder_level,
               COALESCE((SELECT SUM(s.quantity) FROM SALE s WHERE s.batch_id = b.batch_id), 0) AS sold_qty,
               (SELECT COUNT(*) FROM SALE s WHERE s.batch_id = b.batch_id) AS sales_count,
               m.list_price
        FROM MANUFACTURING_BATCH b
        JOIN MOBILE_MODEL m ON b.model_id = m.model_id
        JOIN BRAND br ON m.brand_id = br.brand_id
        WHERE b.batch_id = :id
    """, {"id": batch_id})
    if not row:
        raise HTTPException(status_code=404, detail="Manufacturing Batch not found")

    prod_qty = int(row["production_qty"])
    sold_qty = int(row["sold_qty"])
    remaining = prod_qty - sold_qty
    reorder_lvl = int(row["reorder_level"])
    stock_status = "REORDER IMMEDIATELY" if remaining <= reorder_lvl else "OPTIMAL STOCK"
    mfg_cost = float(row["manufacturing_cost"])
    cost_per_unit = (mfg_cost / prod_qty) if prod_qty > 0 else 0.0
    bom_cost = DBService.calculate_bom_cost(row["model_id"])

    # Sales history
    sales_rows = DBService.query("""
        SELECT s.sale_id, s.quantity, TO_CHAR(s.sale_date) AS sale_date,
               (s.quantity * :lp) AS revenue
        FROM SALE s
        WHERE s.batch_id = :id
        ORDER BY s.sale_date ASC, s.sale_id ASC
    """, {"id": batch_id, "lp": float(row["list_price"])})

    sales = [
        {
            "sale_id": s["sale_id"],
            "quantity": int(s["quantity"]),
            "sale_date": str(s["sale_date"])[:10],
            "revenue": round(float(s["revenue"]), 2)
        }
        for s in sales_rows
    ]

    return {
        "batch_id": row["batch_id"],
        "model_id": row["model_id"],
        "model_name": row["model_name"],
        "brand_name": row["brand_name"],
        "production_date": str(row["production_date"])[:10],
        "production_qty": prod_qty,
        "manufacturing_cost": mfg_cost,
        "reorder_level": reorder_lvl,
        "sold_qty": sold_qty,
        "remaining_stock": remaining,
        "stock_status": stock_status,
        "cost_per_unit": round(cost_per_unit, 2),
        "bom_cost": round(bom_cost, 2),
        "sales_count": int(row["sales_count"]),
        "sales": sales
    }

@router.post("", response_model=BatchOut)
def create_batch(payload: BatchCreate, current_user = Depends(require_manager_or_admin)):
    batch_id = payload.batch_id or DBService.generate_id("BATCH")
    
    # Model existence check
    model = DBService.query_one("SELECT 1 FROM MOBILE_MODEL WHERE model_id = :mid", {"mid": payload.model_id})
    if not model:
        raise HTTPException(status_code=400, detail=f"Model ID '{payload.model_id}' does not exist.")

    DBService.execute("""
        INSERT INTO MANUFACTURING_BATCH (batch_id, model_id, production_date, production_qty, manufacturing_cost, reorder_level)
        VALUES (:id, :mid, :pdate, :qty, :cost, :reorder)
    """, {
        "id": batch_id,
        "mid": payload.model_id,
        "pdate": payload.production_date,
        "qty": payload.production_qty,
        "cost": payload.manufacturing_cost,
        "reorder": payload.reorder_level
    })
    return get_batch(batch_id)

@router.put("/{batch_id}", response_model=BatchOut)
def update_batch(batch_id: str, payload: BatchUpdate, current_user = Depends(require_manager_or_admin)):
    existing = DBService.query_one("SELECT * FROM MANUFACTURING_BATCH WHERE batch_id = :id", {"id": batch_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Batch not found")

    new_mid = payload.model_id or existing["model_id"]
    new_date = payload.production_date or str(existing["production_date"])[:10]
    new_qty = payload.production_qty if payload.production_qty is not None else existing["production_qty"]
    new_cost = payload.manufacturing_cost if payload.manufacturing_cost is not None else existing["manufacturing_cost"]
    new_reorder = payload.reorder_level if payload.reorder_level is not None else existing["reorder_level"]

    DBService.execute("""
        UPDATE MANUFACTURING_BATCH
        SET model_id = :mid, production_date = :pdate, production_qty = :qty,
            manufacturing_cost = :cost, reorder_level = :reorder
        WHERE batch_id = :id
    """, {
        "id": batch_id,
        "mid": new_mid,
        "pdate": new_date,
        "qty": new_qty,
        "cost": new_cost,
        "reorder": new_reorder
    })
    return get_batch(batch_id)

@router.delete("/{batch_id}")
def delete_batch(batch_id: str, current_user = Depends(require_admin)):
    # Check if sales exist
    sales = DBService.query_one("SELECT COUNT(*) AS cnt FROM SALE WHERE batch_id = :id", {"id": batch_id})
    if sales and sales["cnt"] > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete batch '{batch_id}': It has {sales['cnt']} recorded sale(s). Delete those sales first."
        )
    DBService.execute("DELETE FROM MANUFACTURING_BATCH WHERE batch_id = :id", {"id": batch_id})
    return {"message": f"Manufacturing batch '{batch_id}' deleted successfully."}


import time
import re
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from ..models.schemas import SqlRunRequest, SqlRunResponse, OversellDemoRequest
from ..services.auth_service import require_authenticated
from ..services.db_service import DBService
from ..database import db_manager

router = APIRouter(prefix="/api/db-explorer", tags=["DB Explorer & Viva Tools"])

PLSQL_SOURCES = {
    "fn_calculate_model_bom_cost": {
        "type": "FUNCTION",
        "description": "Calculates the total Bill of Materials (BOM) cost for a given mobile model: SUM(qty_req * unit_cost).",
        "code": """CREATE OR REPLACE FUNCTION fn_calculate_model_bom_cost (
    p_model_id IN VARCHAR2
) RETURN NUMBER
IS
    v_total_bom_cost NUMBER(12, 2) := 0;
    v_model_exists   NUMBER := 0;
BEGIN
    SELECT COUNT(*) INTO v_model_exists FROM MOBILE_MODEL WHERE model_id = p_model_id;
    IF v_model_exists = 0 THEN
        RAISE_APPLICATION_ERROR(-20002, 'Mobile Model ID ' || p_model_id || ' does not exist.');
    END IF;

    SELECT NVL(SUM(r.qty_req * c.unit_cost), 0)
    INTO v_total_bom_cost
    FROM REQUIRES r
    JOIN COMPONENT c ON r.component_id = c.component_id
    WHERE r.model_id = p_model_id;

    RETURN v_total_bom_cost;
END fn_calculate_model_bom_cost;"""
    },
    "sp_record_batch_sale_and_restock_check": {
        "type": "STORED PROCEDURE",
        "description": "Processes batch sale, verifies available stock, computes revenue & remaining units, handles reorder threshold alert, and creates audit log.",
        "code": """CREATE OR REPLACE PROCEDURE sp_record_batch_sale_and_restock_check (
    p_sale_id           IN VARCHAR2,
    p_batch_id          IN VARCHAR2,
    p_quantity          IN NUMBER,
    p_sale_date         IN DATE,
    p_recorded_by       IN VARCHAR2,
    o_revenue           OUT NUMBER,
    o_remaining_stock   OUT NUMBER,
    o_reorder_alert     OUT VARCHAR2,
    o_message           OUT VARCHAR2
)
IS
    v_actual_sale_id    VARCHAR2(10);
    v_model_id          VARCHAR2(10);
    v_list_price        NUMBER(10, 2);
    v_production_qty    NUMBER(8);
    v_reorder_level     NUMBER(8);
    v_current_sold      NUMBER(8) := 0;
    v_available_stock   NUMBER(8) := 0;
    v_audit_id          VARCHAR2(10);
BEGIN
    IF p_quantity <= 0 THEN
        RAISE_APPLICATION_ERROR(-20005, 'Sale quantity must be greater than zero.');
    END IF;

    SELECT mb.model_id, mb.production_qty, mb.reorder_level, mm.list_price
    INTO v_model_id, v_production_qty, v_reorder_level, v_list_price
    FROM MANUFACTURING_BATCH mb
    JOIN MOBILE_MODEL mm ON mb.model_id = mm.model_id
    WHERE mb.batch_id = p_batch_id;

    SELECT NVL(SUM(quantity), 0)
    INTO v_current_sold
    FROM SALE
    WHERE batch_id = p_batch_id;

    v_available_stock := v_production_qty - v_current_sold;

    IF p_quantity > v_available_stock THEN
        RAISE_APPLICATION_ERROR(-20001, 
            'Overselling blocked: Requested quantity (' || p_quantity || 
            ') exceeds available stock (' || v_available_stock || 
            ') for Batch ' || p_batch_id || '.');
    END IF;

    IF p_sale_id IS NULL OR UPPER(TRIM(p_sale_id)) = 'AUTO' THEN
        SELECT 'SL' || TO_CHAR(SEQ_SALE_ID.NEXTVAL) INTO v_actual_sale_id FROM DUAL;
    ELSE
        v_actual_sale_id := p_sale_id;
    END IF;

    INSERT INTO SALE (sale_id, batch_id, quantity, sale_date)
    VALUES (v_actual_sale_id, p_batch_id, p_quantity, NVL(p_sale_date, SYSDATE));

    o_revenue := p_quantity * v_list_price;
    o_remaining_stock := v_available_stock - p_quantity;

    IF o_remaining_stock <= v_reorder_level THEN
        o_reorder_alert := 'Y';
        o_message := 'Sale ' || v_actual_sale_id || ' recorded successfully. REORDER ALERT: Stock level (' || 
                     o_remaining_stock || ') is at or below threshold (' || v_reorder_level || ').';
    ELSE
        o_reorder_alert := 'N';
        o_message := 'Sale ' || v_actual_sale_id || ' recorded successfully. Remaining stock: ' || 
                     o_remaining_stock || ' units.';
    END IF;

    SELECT 'AUD' || LPAD(SEQ_AUDIT_ID.NEXTVAL, 3, '0') INTO v_audit_id FROM DUAL;
    INSERT INTO SALE_AUDIT (audit_id, sale_id, batch_id, quantity, sale_date, recorded_by, reorder_alert_fired, remaining_stock)
    VALUES (v_audit_id, v_actual_sale_id, p_batch_id, p_quantity, NVL(p_sale_date, SYSDATE), NVL(p_recorded_by, 'system'), o_reorder_alert, o_remaining_stock);
END sp_record_batch_sale_and_restock_check;"""
    },
    "trg_validate_and_audit_batch_sale": {
        "type": "COMPOUND TRIGGER",
        "description": "Trigger on SALE solving mutating table error ORA-04091. Blocks overselling (-20001) and issues restock alert.",
        "code": """CREATE OR REPLACE TRIGGER trg_validate_and_audit_batch_sale
FOR INSERT ON SALE
COMPOUND TRIGGER

    BEFORE EACH ROW IS
        v_prod_qty       NUMBER;
        v_reorder_level  NUMBER;
        v_total_sold     NUMBER := 0;
        v_current_avail  NUMBER;
        v_post_stock     NUMBER;
    BEGIN
        SELECT production_qty, reorder_level
        INTO v_prod_qty, v_reorder_level
        FROM MANUFACTURING_BATCH
        WHERE batch_id = :NEW.batch_id;

        SELECT NVL(SUM(quantity), 0)
        INTO v_total_sold
        FROM SALE
        WHERE batch_id = :NEW.batch_id;

        v_current_avail := v_prod_qty - v_total_sold;

        IF :NEW.quantity > v_current_avail THEN
            RAISE_APPLICATION_ERROR(-20001, 
                'Overselling blocked: Requested quantity (' || :NEW.quantity || 
                ') exceeds available stock (' || v_current_avail || 
                ') for Batch ' || :NEW.batch_id || '.');
        END IF;

        v_post_stock := v_current_avail - :NEW.quantity;
        IF v_post_stock <= v_reorder_level THEN
            DBMS_OUTPUT.PUT_LINE('>>> [REORDER ALERT] Batch ' || :NEW.batch_id || 
                ' remaining stock (' || v_post_stock || ') has reached or fallen below reorder level.');
        END IF;
    END BEFORE EACH ROW;

END trg_validate_and_audit_batch_sale;"""
    },
    "fn_generate_entity_id": {
        "type": "FUNCTION",
        "description": "Auto-generates sequential, formatted business keys (BR01, MD101, CMP01, SUP01, BCH501, SL901).",
        "code": """CREATE OR REPLACE FUNCTION fn_generate_entity_id (
    p_entity_type IN VARCHAR2
) RETURN VARCHAR2
IS
    v_new_id VARCHAR2(20);
BEGIN
    CASE UPPER(p_entity_type)
        WHEN 'BRAND' THEN SELECT 'BR' || LPAD(SEQ_BRAND_ID.NEXTVAL, 2, '0') INTO v_new_id FROM DUAL;
        WHEN 'MODEL' THEN SELECT 'MD' || TO_CHAR(SEQ_MODEL_ID.NEXTVAL) INTO v_new_id FROM DUAL;
        WHEN 'COMPONENT' THEN SELECT 'CMP' || LPAD(SEQ_COMPONENT_ID.NEXTVAL, 2, '0') INTO v_new_id FROM DUAL;
        WHEN 'SUPPLIER' THEN SELECT 'SUP' || LPAD(SEQ_SUPPLIER_ID.NEXTVAL, 2, '0') INTO v_new_id FROM DUAL;
        WHEN 'BATCH' THEN SELECT 'BCH' || TO_CHAR(SEQ_BATCH_ID.NEXTVAL) INTO v_new_id FROM DUAL;
        WHEN 'SALE' THEN SELECT 'SL' || TO_CHAR(SEQ_SALE_ID.NEXTVAL) INTO v_new_id FROM DUAL;
        WHEN 'USER' THEN SELECT 'USR' || LPAD(SEQ_USER_ID.NEXTVAL, 2, '0') INTO v_new_id FROM DUAL;
        WHEN 'AUDIT' THEN SELECT 'AUD' || LPAD(SEQ_AUDIT_ID.NEXTVAL, 3, '0') INTO v_new_id FROM DUAL;
    END CASE;
    RETURN v_new_id;
END fn_generate_entity_id;"""
    }
}

@router.get("/plsql-sources")
def get_plsql_sources(current_user = Depends(require_authenticated)):
    return PLSQL_SOURCES

@router.get("/schema-metadata")
def get_schema_metadata(current_user = Depends(require_authenticated)):
    return {
        "database_engine": db_manager.engine_name,
        "tables": [
            {
                "name": "BRAND",
                "purpose": "Stores manufacturer and brand entities.",
                "primary_key": "brand_id",
                "columns": ["brand_id VARCHAR2(10) PK", "brand_name VARCHAR2(100) UNIQUE NOT NULL", "state VARCHAR2(50)", "city VARCHAR2(50)"]
            },
            {
                "name": "MOBILE_MODEL",
                "purpose": "Mobile phone models designed by brands with list price.",
                "primary_key": "model_id",
                "columns": ["model_id VARCHAR2(10) PK", "brand_id VARCHAR2(10) FK->BRAND", "model_name VARCHAR2(100)", "launch_year NUMBER(4)", "list_price NUMBER(10,2) CHECK > 0"]
            },
            {
                "name": "COMPONENT",
                "purpose": "Hardware parts and standard baseline BOM cost.",
                "primary_key": "component_id",
                "columns": ["component_id VARCHAR2(10) PK", "component_name VARCHAR2(100)", "description VARCHAR2(255)", "unit_cost NUMBER(10,2) CHECK > 0"]
            },
            {
                "name": "SUPPLIER",
                "purpose": "Certified supply chain vendors.",
                "primary_key": "supplier_id",
                "columns": ["supplier_id VARCHAR2(10) PK", "supplier_name VARCHAR2(100)", "city VARCHAR2(50)", "state VARCHAR2(50)", "contact_no VARCHAR2(20) UNIQUE"]
            },
            {
                "name": "MANUFACTURING_BATCH",
                "purpose": "Factory production lots with quantity, total manufacturing cost, and reorder point.",
                "primary_key": "batch_id",
                "columns": ["batch_id VARCHAR2(10) PK", "model_id VARCHAR2(10) FK->MOBILE_MODEL", "production_date DATE", "production_qty NUMBER(8)", "manufacturing_cost NUMBER(14,2)", "reorder_level NUMBER(8)"]
            },
            {
                "name": "SALE",
                "purpose": "Finished goods sales against specific production batches.",
                "primary_key": "sale_id",
                "columns": ["sale_id VARCHAR2(10) PK", "batch_id VARCHAR2(10) FK->MANUFACTURING_BATCH", "quantity NUMBER(8)", "sale_date DATE"]
            },
            {
                "name": "REQUIRES",
                "purpose": "Bill of Materials (BOM) M:N relationship between Model and Component.",
                "primary_key": "(model_id, component_id)",
                "columns": ["model_id FK->MOBILE_MODEL", "component_id FK->COMPONENT", "qty_req NUMBER(4) CHECK > 0"]
            },
            {
                "name": "SUPPLIED_BY",
                "purpose": "Sourcing procurement matrix M:N between Component and Supplier.",
                "primary_key": "(component_id, supplier_id)",
                "columns": ["component_id FK->COMPONENT", "supplier_id FK->SUPPLIER", "supply_cost NUMBER(10,2)", "availability VARCHAR2(50)"]
            },
            {
                "name": "APP_USER",
                "purpose": "RBAC user accounts (ADMIN, MANAGER, VIEWER) with bcrypt security.",
                "primary_key": "user_id",
                "columns": ["user_id VARCHAR2(10) PK", "username VARCHAR2(50) UNIQUE", "password_hash VARCHAR2(255)", "role VARCHAR2(20)", "full_name VARCHAR2(100)"]
            },
            {
                "name": "SALE_AUDIT",
                "purpose": "Transactional audit trail for compliance and reorder event logging.",
                "primary_key": "audit_id",
                "columns": ["audit_id VARCHAR2(10) PK", "sale_id VARCHAR2(10)", "batch_id VARCHAR2(10)", "quantity NUMBER(8)", "sale_date DATE", "recorded_by VARCHAR2(50)", "recorded_at TIMESTAMP", "reorder_alert_fired VARCHAR2(1)", "remaining_stock NUMBER(8)"]
            }
        ]
    }

@router.post("/demo-oversell")
def demo_oversell_trigger(payload: OversellDemoRequest, current_user = Depends(require_authenticated)):
    """
    Demonstrates the PL/SQL Trigger / Stored Procedure blocking an overselling attempt.
    Deliberately passes a quantity exceeding available stock to prove ORA-20001 constraint enforcement.
    """
    batch = DBService.query_one("""
        SELECT b.batch_id, b.production_qty, m.model_name,
               COALESCE((SELECT SUM(s.quantity) FROM SALE s WHERE s.batch_id = b.batch_id), 0) AS sold_qty
        FROM MANUFACTURING_BATCH b
        JOIN MOBILE_MODEL m ON b.model_id = m.model_id
        WHERE b.batch_id = :b
    """, {"b": payload.batch_id})

    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    prod = int(batch["production_qty"])
    sold = int(batch["sold_qty"])
    avail = prod - sold
    requested = payload.excess_quantity if payload.excess_quantity > avail else (avail + 100)

    try:
        # Deliberately attempt sale
        DBService.record_batch_sale_sp(
            sale_id="SL_DEMO",
            batch_id=payload.batch_id,
            quantity=requested,
            sale_date=None,
            recorded_by=current_user.get("username", "demo_examiner")
        )
        return {"status": "UNEXPECTED_SUCCESS", "message": "Sale was unexpectedly permitted."}
    except HTTPException as e:
        return {
            "status": "BLOCKED_BY_PLSQL_TRIGGER",
            "batch_id": payload.batch_id,
            "model_name": batch["model_name"],
            "production_qty": prod,
            "already_sold": sold,
            "available_stock": avail,
            "attempted_quantity": requested,
            "oracle_error_code": "ORA-20001",
            "caught_exception_message": e.detail,
            "viva_explanation": "The PL/SQL compound trigger 'trg_validate_and_audit_batch_sale' checked the available inventory before row insertion and raised RAISE_APPLICATION_ERROR(-20001), successfully preventing database corruption and overselling."
        }

@router.post("/run-select", response_model=SqlRunResponse)
def run_select_query(payload: SqlRunRequest, current_user = Depends(require_authenticated)):
    """
    Safe read-only SQL query runner. Strictly limited to SELECT statements.
    """
    clean_sql = payload.sql.strip().rstrip(";")
    
    # Validation
    if not clean_sql.upper().startswith("SELECT") and not clean_sql.upper().startswith("WITH"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security Restriction: Only read-only SELECT / WITH queries are permitted in the DB Explorer."
        )

    disallowed_keywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "EXEC", "CREATE", "GRANT", "REVOKE"]
    # Check tokens
    tokens = re.findall(r"\b[A-Za-z]+\b", clean_sql.upper())
    for kw in disallowed_keywords:
        if kw in tokens:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security Restriction: Keyword '{kw}' is not permitted in read-only runner."
            )

    start = time.perf_counter()
    rows = DBService.query(clean_sql)
    elapsed = (time.perf_counter() - start) * 1000.0

    cols = list(rows[0].keys()) if rows else []
    return SqlRunResponse(
        columns=cols,
        rows=rows[:100],  # Limit to 100 rows for display safety
        row_count=len(rows),
        execution_time_ms=round(elapsed, 2)
    )

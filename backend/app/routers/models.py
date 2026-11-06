from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from ..models.schemas import ModelOut, ModelDetailOut, ModelCreate, ModelUpdate, ModelBOMItem
from ..services.auth_service import require_authenticated, require_manager_or_admin, require_admin
from ..services.db_service import DBService

router = APIRouter(prefix="/api/models", tags=["Mobile Models"])

@router.get("", response_model=List[ModelOut])
def list_models(
    brand_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user = Depends(require_authenticated)
):
    sql = """
        SELECT m.model_id, m.brand_id, b.brand_name, m.model_name, m.launch_year, m.list_price
        FROM MOBILE_MODEL m
        JOIN BRAND b ON m.brand_id = b.brand_id
        WHERE 1=1
    """
    params = {}
    if brand_id:
        sql += " AND m.brand_id = :bid"
        params["bid"] = brand_id
    if search:
        sql += " AND (LOWER(m.model_name) LIKE :s OR LOWER(b.brand_name) LIKE :s)"
        params["s"] = f"%{search.lower()}%"
    sql += " ORDER BY m.model_id"

    rows = DBService.query(sql, params)
    result = []
    for r in rows:
        bom_cost = DBService.calculate_bom_cost(r["model_id"])
        list_price = float(r["list_price"])
        margin = list_price - bom_cost
        margin_pct = (margin / list_price * 100) if list_price > 0 else 0.0
        result.append({
            **r,
            "bom_cost": round(bom_cost, 2),
            "margin": round(margin, 2),
            "margin_percent": round(margin_pct, 2)
        })
    return result

@router.get("/{model_id}", response_model=ModelDetailOut)
def get_model(model_id: str, current_user = Depends(require_authenticated)):
    row = DBService.query_one("""
        SELECT m.model_id, m.brand_id, b.brand_name, m.model_name, m.launch_year, m.list_price
        FROM MOBILE_MODEL m
        JOIN BRAND b ON m.brand_id = b.brand_id
        WHERE m.model_id = :id
    """, {"id": model_id})
    if not row:
        raise HTTPException(status_code=404, detail="Mobile Model not found")

    bom_cost = DBService.calculate_bom_cost(model_id)
    list_price = float(row["list_price"])
    margin = list_price - bom_cost
    margin_pct = (margin / list_price * 100) if list_price > 0 else 0.0

    # Fetch BOM items
    bom_rows = DBService.query("""
        SELECT r.component_id, c.component_name, c.description, c.unit_cost, r.qty_req,
               (r.qty_req * c.unit_cost) AS line_cost
        FROM REQUIRES r
        JOIN COMPONENT c ON r.component_id = c.component_id
        WHERE r.model_id = :id
        ORDER BY c.component_id
    """, {"id": model_id})

    return {
        **row,
        "bom_cost": round(bom_cost, 2),
        "margin": round(margin, 2),
        "margin_percent": round(margin_pct, 2),
        "components": [
            {
                "component_id": b["component_id"],
                "component_name": b["component_name"],
                "description": b.get("description"),
                "unit_cost": float(b["unit_cost"]),
                "qty_req": int(b["qty_req"]),
                "line_cost": round(float(b["line_cost"]), 2)
            }
            for b in bom_rows
        ]
    }

@router.post("", response_model=ModelOut)
def create_model(payload: ModelCreate, current_user = Depends(require_manager_or_admin)):
    model_id = payload.model_id or DBService.generate_id("MODEL")
    DBService.execute("""
        INSERT INTO MOBILE_MODEL (model_id, brand_id, model_name, launch_year, list_price)
        VALUES (:id, :bid, :name, :yr, :price)
    """, {
        "id": model_id,
        "bid": payload.brand_id,
        "name": payload.model_name.strip(),
        "yr": payload.launch_year,
        "price": payload.list_price
    })
    return get_model(model_id)

@router.put("/{model_id}", response_model=ModelOut)
def update_model(model_id: str, payload: ModelUpdate, current_user = Depends(require_manager_or_admin)):
    existing = DBService.query_one("SELECT * FROM MOBILE_MODEL WHERE model_id = :id", {"id": model_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Model not found")

    new_bid = payload.brand_id or existing["brand_id"]
    new_name = payload.model_name.strip() if payload.model_name else existing["model_name"]
    new_yr = payload.launch_year if payload.launch_year is not None else existing["launch_year"]
    new_price = payload.list_price if payload.list_price is not None else existing["list_price"]

    DBService.execute("""
        UPDATE MOBILE_MODEL
        SET brand_id = :bid, model_name = :name, launch_year = :yr, list_price = :price
        WHERE model_id = :id
    """, {"id": model_id, "bid": new_bid, "name": new_name, "yr": new_yr, "price": new_price})
    return get_model(model_id)

@router.delete("/{model_id}")
def delete_model(model_id: str, current_user = Depends(require_admin)):
    # Check if batches exist
    batches = DBService.query_one("SELECT COUNT(*) AS cnt FROM MANUFACTURING_BATCH WHERE model_id = :id", {"id": model_id})
    if batches and batches["cnt"] > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete model '{model_id}': It has {batches['cnt']} manufacturing batch(es). Delete those batches first."
        )
    DBService.execute("DELETE FROM REQUIRES WHERE model_id = :id", {"id": model_id})
    DBService.execute("DELETE FROM MOBILE_MODEL WHERE model_id = :id", {"id": model_id})
    return {"message": f"Model '{model_id}' deleted successfully."}

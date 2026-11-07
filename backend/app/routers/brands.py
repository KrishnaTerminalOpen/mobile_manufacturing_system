from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from ..models.schemas import BrandOut, BrandCreate, BrandUpdate
from ..services.auth_service import require_authenticated, require_manager_or_admin, require_admin
from ..services.db_service import DBService

router = APIRouter(prefix="/api/brands", tags=["Brands"])

@router.get("", response_model=List[BrandOut])
def list_brands(
    search: Optional[str] = None,
    current_user = Depends(require_authenticated)
):
    sql = """
        SELECT b.brand_id, b.brand_name, b.state, b.city,
               COUNT(m.model_id) AS model_count
        FROM BRAND b
        LEFT JOIN MOBILE_MODEL m ON b.brand_id = m.brand_id
    """
    params = {}
    if search:
        sql += " WHERE LOWER(b.brand_name) LIKE :s OR LOWER(b.city) LIKE :s OR LOWER(b.state) LIKE :s"
        params["s"] = f"%{search.lower()}%"
    sql += " GROUP BY b.brand_id, b.brand_name, b.state, b.city ORDER BY b.brand_id"
    return DBService.query(sql, params)

@router.get("/{brand_id}", response_model=BrandOut)
def get_brand(brand_id: str, current_user = Depends(require_authenticated)):
    row = DBService.query_one("""
        SELECT b.brand_id, b.brand_name, b.state, b.city,
               COUNT(m.model_id) AS model_count
        FROM BRAND b
        LEFT JOIN MOBILE_MODEL m ON b.brand_id = m.brand_id
        WHERE b.brand_id = :id
        GROUP BY b.brand_id, b.brand_name, b.state, b.city
    """, {"id": brand_id})
    if not row:
        raise HTTPException(status_code=404, detail="Brand not found")
    return row

@router.post("", response_model=BrandOut)
def create_brand(payload: BrandCreate, current_user = Depends(require_manager_or_admin)):
    brand_id = payload.brand_id or DBService.generate_id("BRAND")
    DBService.execute("""
        INSERT INTO BRAND (brand_id, brand_name, state, city)
        VALUES (:id, :name, :state, :city)
    """, {
        "id": brand_id,
        "name": payload.brand_name.strip(),
        "state": payload.state.strip(),
        "city": payload.city.strip()
    })
    return get_brand(brand_id)

@router.put("/{brand_id}", response_model=BrandOut)
def update_brand(brand_id: str, payload: BrandUpdate, current_user = Depends(require_manager_or_admin)):
    existing = get_brand(brand_id)
    new_name = payload.brand_name.strip() if payload.brand_name else existing["brand_name"]
    new_state = payload.state.strip() if payload.state else existing["state"]
    new_city = payload.city.strip() if payload.city else existing["city"]

    DBService.execute("""
        UPDATE BRAND
        SET brand_name = :name, state = :state, city = :city
        WHERE brand_id = :id
    """, {"id": brand_id, "name": new_name, "state": new_state, "city": new_city})
    return get_brand(brand_id)

@router.delete("/{brand_id}")
def delete_brand(brand_id: str, current_user = Depends(require_admin)):
    # Check if models exist
    models = DBService.query_one("SELECT COUNT(*) AS cnt FROM MOBILE_MODEL WHERE brand_id = :id", {"id": brand_id})
    if models and models["cnt"] > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete brand '{brand_id}': It is referenced by {models['cnt']} mobile model(s). Delete or reassign those models first."
        )
    DBService.execute("DELETE FROM BRAND WHERE brand_id = :id", {"id": brand_id})
    return {"message": f"Brand '{brand_id}' deleted successfully."}


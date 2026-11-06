from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..models.schemas import RequiresCreate, RequiresUpdate, RequiresOut
from ..services.auth_service import require_authenticated, require_manager_or_admin
from ..services.db_service import DBService

router = APIRouter(prefix="/api/requires", tags=["Model BOM (REQUIRES)"])

@router.get("/model/{model_id}", response_model=List[RequiresOut])
def get_model_bom(model_id: str, current_user = Depends(require_authenticated)):
    rows = DBService.query("""
        SELECT r.model_id, r.component_id, c.component_name, c.unit_cost, r.qty_req,
               (r.qty_req * c.unit_cost) AS total_cost
        FROM REQUIRES r
        JOIN COMPONENT c ON r.component_id = c.component_id
        WHERE r.model_id = :mid
        ORDER BY r.component_id
    """, {"mid": model_id})
    return [
        {
            "model_id": r["model_id"],
            "component_id": r["component_id"],
            "component_name": r["component_name"],
            "unit_cost": float(r["unit_cost"]),
            "qty_req": int(r["qty_req"]),
            "total_cost": round(float(r["total_cost"]), 2)
        }
        for r in rows
    ]

@router.post("", response_model=RequiresOut)
def add_component_to_bom(payload: RequiresCreate, current_user = Depends(require_manager_or_admin)):
    # Check if component already in BOM
    existing = DBService.query_one("""
        SELECT * FROM REQUIRES WHERE model_id = :mid AND component_id = :cid
    """, {"mid": payload.model_id, "cid": payload.component_id})
    if existing:
        # Update quantity
        DBService.execute("""
            UPDATE REQUIRES SET qty_req = qty_req + :q WHERE model_id = :mid AND component_id = :cid
        """, {"mid": payload.model_id, "cid": payload.component_id, "q": payload.qty_req})
    else:
        DBService.execute("""
            INSERT INTO REQUIRES (model_id, component_id, qty_req)
            VALUES (:mid, :cid, :q)
        """, {"mid": payload.model_id, "cid": payload.component_id, "q": payload.qty_req})

    row = DBService.query_one("""
        SELECT r.model_id, r.component_id, c.component_name, c.unit_cost, r.qty_req,
               (r.qty_req * c.unit_cost) AS total_cost
        FROM REQUIRES r
        JOIN COMPONENT c ON r.component_id = c.component_id
        WHERE r.model_id = :mid AND r.component_id = :cid
    """, {"mid": payload.model_id, "cid": payload.component_id})
    return {
        "model_id": row["model_id"],
        "component_id": row["component_id"],
        "component_name": row["component_name"],
        "unit_cost": float(row["unit_cost"]),
        "qty_req": int(row["qty_req"]),
        "total_cost": round(float(row["total_cost"]), 2)
    }

@router.put("/model/{model_id}/component/{component_id}", response_model=RequiresOut)
def update_bom_item_quantity(model_id: str, component_id: str, payload: RequiresUpdate, current_user = Depends(require_manager_or_admin)):
    DBService.execute("""
        UPDATE REQUIRES SET qty_req = :q WHERE model_id = :mid AND component_id = :cid
    """, {"mid": model_id, "cid": component_id, "q": payload.qty_req})

    row = DBService.query_one("""
        SELECT r.model_id, r.component_id, c.component_name, c.unit_cost, r.qty_req,
               (r.qty_req * c.unit_cost) AS total_cost
        FROM REQUIRES r
        JOIN COMPONENT c ON r.component_id = c.component_id
        WHERE r.model_id = :mid AND r.component_id = :cid
    """, {"mid": model_id, "cid": component_id})
    if not row:
        raise HTTPException(status_code=404, detail="BOM item not found")
    return {
        "model_id": row["model_id"],
        "component_id": row["component_id"],
        "component_name": row["component_name"],
        "unit_cost": float(row["unit_cost"]),
        "qty_req": int(row["qty_req"]),
        "total_cost": round(float(row["total_cost"]), 2)
    }

@router.delete("/model/{model_id}/component/{component_id}")
def remove_component_from_bom(model_id: str, component_id: str, current_user = Depends(require_manager_or_admin)):
    DBService.execute("""
        DELETE FROM REQUIRES WHERE model_id = :mid AND component_id = :cid
    """, {"mid": model_id, "cid": component_id})
    return {"message": f"Component '{component_id}' removed from Model '{model_id}' BOM."}

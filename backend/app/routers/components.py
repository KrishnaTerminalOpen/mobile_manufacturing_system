from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from ..models.schemas import ComponentOut, ComponentDetailOut, ComponentCreate, ComponentUpdate
from ..services.auth_service import require_authenticated, require_manager_or_admin, require_admin
from ..services.db_service import DBService

router = APIRouter(prefix="/api/components", tags=["Components"])

@router.get("", response_model=List[ComponentOut])
def list_components(
    search: Optional[str] = None,
    current_user = Depends(require_authenticated)
):
    sql = """
        SELECT c.component_id, c.component_name, c.description, c.unit_cost,
               (SELECT COUNT(DISTINCT r.model_id) FROM REQUIRES r WHERE r.component_id = c.component_id) AS used_in_models_count,
               (SELECT COUNT(DISTINCT s.supplier_id) FROM SUPPLIED_BY s WHERE s.component_id = c.component_id) AS supplier_count,
               (SELECT MIN(s.supply_cost) FROM SUPPLIED_BY s WHERE s.component_id = c.component_id) AS lowest_quote
        FROM COMPONENT c
        WHERE 1=1
    """
    params = {}
    if search:
        sql += " AND (LOWER(c.component_name) LIKE :s OR LOWER(c.description) LIKE :s)"
        params["s"] = f"%{search.lower()}%"
    sql += " ORDER BY c.component_id"

    rows = DBService.query(sql, params)
    result = []
    for r in rows:
        comp_id = r["component_id"]
        # Find best supplier name if any quote exists
        best_supp = None
        if r["lowest_quote"] is not None:
            supp_row = DBService.query_one("""
                SELECT sup.supplier_name
                FROM SUPPLIED_BY sb
                JOIN SUPPLIER sup ON sb.supplier_id = sup.supplier_id
                WHERE sb.component_id = :cid AND sb.supply_cost = :cost
            """, {"cid": comp_id, "cost": r["lowest_quote"]})
            if supp_row:
                best_supp = supp_row["supplier_name"]

        result.append({
            "component_id": r["component_id"],
            "component_name": r["component_name"],
            "description": r.get("description"),
            "unit_cost": float(r["unit_cost"]),
            "used_in_models_count": int(r["used_in_models_count"] or 0),
            "supplier_count": int(r["supplier_count"] or 0),
            "lowest_quote": float(r["lowest_quote"]) if r["lowest_quote"] is not None else None,
            "best_supplier_name": best_supp
        })
    return result

@router.get("/{component_id}", response_model=ComponentDetailOut)
def get_component(component_id: str, current_user = Depends(require_authenticated)):
    row = DBService.query_one("""
        SELECT c.component_id, c.component_name, c.description, c.unit_cost,
               (SELECT COUNT(DISTINCT r.model_id) FROM REQUIRES r WHERE r.component_id = c.component_id) AS used_in_models_count,
               (SELECT COUNT(DISTINCT s.supplier_id) FROM SUPPLIED_BY s WHERE s.component_id = c.component_id) AS supplier_count,
               (SELECT MIN(s.supply_cost) FROM SUPPLIED_BY s WHERE s.component_id = c.component_id) AS lowest_quote
        FROM COMPONENT c
        WHERE c.component_id = :id
    """, {"id": component_id})
    if not row:
        raise HTTPException(status_code=404, detail="Component not found")

    std_cost = float(row["unit_cost"])

    # Fetch supplier quotes ranked by cost ascending
    quotes_rows = DBService.query("""
        SELECT sb.supplier_id, sup.supplier_name, sup.city, sup.state,
               sb.supply_cost, sb.availability
        FROM SUPPLIED_BY sb
        JOIN SUPPLIER sup ON sb.supplier_id = sup.supplier_id
        WHERE sb.component_id = :id
        ORDER BY sb.supply_cost ASC
    """, {"id": component_id})

    quotes = [
        {
            "supplier_id": q["supplier_id"],
            "supplier_name": q["supplier_name"],
            "city": q["city"],
            "state": q["state"],
            "supply_cost": float(q["supply_cost"]),
            "availability": q["availability"],
            "saving_vs_std": round(std_cost - float(q["supply_cost"]), 2)
        }
        for q in quotes_rows
    ]

    best_supp = quotes[0]["supplier_name"] if quotes else None

    return {
        "component_id": row["component_id"],
        "component_name": row["component_name"],
        "description": row.get("description"),
        "unit_cost": std_cost,
        "used_in_models_count": int(row["used_in_models_count"] or 0),
        "supplier_count": int(row["supplier_count"] or 0),
        "lowest_quote": float(row["lowest_quote"]) if row["lowest_quote"] is not None else None,
        "best_supplier_name": best_supp,
        "quotes": quotes
    }

@router.post("", response_model=ComponentOut)
def create_component(payload: ComponentCreate, current_user = Depends(require_manager_or_admin)):
    comp_id = payload.component_id or DBService.generate_id("COMPONENT")
    DBService.execute("""
        INSERT INTO COMPONENT (component_id, component_name, description, unit_cost)
        VALUES (:id, :name, :desc, :cost)
    """, {
        "id": comp_id,
        "name": payload.component_name.strip(),
        "desc": payload.description.strip() if payload.description else None,
        "cost": payload.unit_cost
    })
    return get_component(comp_id)

@router.put("/{component_id}", response_model=ComponentOut)
def update_component(component_id: str, payload: ComponentUpdate, current_user = Depends(require_manager_or_admin)):
    existing = DBService.query_one("SELECT * FROM COMPONENT WHERE component_id = :id", {"id": component_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Component not found")

    new_name = payload.component_name.strip() if payload.component_name else existing["component_name"]
    new_desc = payload.description.strip() if payload.description is not None else existing.get("description")
    new_cost = payload.unit_cost if payload.unit_cost is not None else existing["unit_cost"]

    DBService.execute("""
        UPDATE COMPONENT
        SET component_name = :name, description = :desc, unit_cost = :cost
        WHERE component_id = :id
    """, {"id": component_id, "name": new_name, "desc": new_desc, "cost": new_cost})
    return get_component(component_id)

@router.delete("/{component_id}")
def delete_component(component_id: str, current_user = Depends(require_admin)):
    # Check if used in any model BOM
    requires = DBService.query_one("SELECT COUNT(*) AS cnt FROM REQUIRES WHERE component_id = :id", {"id": component_id})
    if requires and requires["cnt"] > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete component '{component_id}': It is required by {requires['cnt']} model(s). Remove it from those BOMs first."
        )
    DBService.execute("DELETE FROM SUPPLIED_BY WHERE component_id = :id", {"id": component_id})
    DBService.execute("DELETE FROM COMPONENT WHERE component_id = :id", {"id": component_id})
    return {"message": f"Component '{component_id}' deleted successfully."}


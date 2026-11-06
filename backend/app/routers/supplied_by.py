from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..models.schemas import SuppliedByCreate, SuppliedByUpdate, SuppliedByOut
from ..services.auth_service import require_authenticated, require_manager_or_admin
from ..services.db_service import DBService

router = APIRouter(prefix="/api/supplied-by", tags=["Supplied By"])

@router.get("", response_model=List[SuppliedByOut])
def list_supplied_by(current_user = Depends(require_authenticated)):
    rows = DBService.query("""
        SELECT sb.component_id, c.component_name, sb.supplier_id, s.supplier_name,
               sb.supply_cost, sb.availability
        FROM SUPPLIED_BY sb
        JOIN COMPONENT c ON sb.component_id = c.component_id
        JOIN SUPPLIER s ON sb.supplier_id = s.supplier_id
        ORDER BY sb.component_id, sb.supply_cost ASC
    """)
    return [
        {
            "component_id": r["component_id"],
            "component_name": r["component_name"],
            "supplier_id": r["supplier_id"],
            "supplier_name": r["supplier_name"],
            "supply_cost": float(r["supply_cost"]),
            "availability": r["availability"]
        }
        for r in rows
    ]

@router.post("", response_model=SuppliedByOut)
def create_or_update_quote(payload: SuppliedByCreate, current_user = Depends(require_manager_or_admin)):
    existing = DBService.query_one("""
        SELECT 1 FROM SUPPLIED_BY WHERE component_id = :cid AND supplier_id = :sid
    """, {"cid": payload.component_id, "sid": payload.supplier_id})

    if existing:
        DBService.execute("""
            UPDATE SUPPLIED_BY
            SET supply_cost = :cost, availability = :avail
            WHERE component_id = :cid AND supplier_id = :sid
        """, {"cid": payload.component_id, "sid": payload.supplier_id, "cost": payload.supply_cost, "avail": payload.availability.strip()})
    else:
        DBService.execute("""
            INSERT INTO SUPPLIED_BY (component_id, supplier_id, supply_cost, availability)
            VALUES (:cid, :sid, :cost, :avail)
        """, {"cid": payload.component_id, "sid": payload.supplier_id, "cost": payload.supply_cost, "avail": payload.availability.strip()})

    row = DBService.query_one("""
        SELECT sb.component_id, c.component_name, sb.supplier_id, s.supplier_name,
               sb.supply_cost, sb.availability
        FROM SUPPLIED_BY sb
        JOIN COMPONENT c ON sb.component_id = c.component_id
        JOIN SUPPLIER s ON sb.supplier_id = s.supplier_id
        WHERE sb.component_id = :cid AND sb.supplier_id = :sid
    """, {"cid": payload.component_id, "sid": payload.supplier_id})
    return {
        "component_id": row["component_id"],
        "component_name": row["component_name"],
        "supplier_id": row["supplier_id"],
        "supplier_name": row["supplier_name"],
        "supply_cost": float(row["supply_cost"]),
        "availability": row["availability"]
    }

@router.delete("/component/{component_id}/supplier/{supplier_id}")
def delete_quote(component_id: str, supplier_id: str, current_user = Depends(require_manager_or_admin)):
    DBService.execute("""
        DELETE FROM SUPPLIED_BY WHERE component_id = :cid AND supplier_id = :sid
    """, {"cid": component_id, "sid": supplier_id})
    return {"message": f"Quote for component '{component_id}' from supplier '{supplier_id}' deleted."}

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from ..models.schemas import SupplierOut, SupplierCreate, SupplierUpdate
from ..services.auth_service import require_authenticated, require_manager_or_admin, require_admin
from ..services.db_service import DBService

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])

@router.get("", response_model=List[SupplierOut])
def list_suppliers(
    search: Optional[str] = None,
    current_user = Depends(require_authenticated)
):
    sql = """
        SELECT s.supplier_id, s.supplier_name, s.city, s.state, s.contact_no,
               COUNT(sb.component_id) AS components_supplied_count
        FROM SUPPLIER s
        LEFT JOIN SUPPLIED_BY sb ON s.supplier_id = sb.supplier_id
        WHERE 1=1
    """
    params = {}
    if search:
        sql += " AND (LOWER(s.supplier_name) LIKE :s OR LOWER(s.city) LIKE :s OR LOWER(s.state) LIKE :s OR s.contact_no LIKE :s)"
        params["s"] = f"%{search.lower()}%"
    sql += " GROUP BY s.supplier_id, s.supplier_name, s.city, s.state, s.contact_no ORDER BY s.supplier_id"

    rows = DBService.query(sql, params)
    return [
        {
            **r,
            "components_supplied_count": int(r["components_supplied_count"] or 0)
        }
        for r in rows
    ]

@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(supplier_id: str, current_user = Depends(require_authenticated)):
    row = DBService.query_one("""
        SELECT s.supplier_id, s.supplier_name, s.city, s.state, s.contact_no,
               COUNT(sb.component_id) AS components_supplied_count
        FROM SUPPLIER s
        LEFT JOIN SUPPLIED_BY sb ON s.supplier_id = sb.supplier_id
        WHERE s.supplier_id = :id
        GROUP BY s.supplier_id, s.supplier_name, s.city, s.state, s.contact_no
    """, {"id": supplier_id})
    if not row:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {
        **row,
        "components_supplied_count": int(row["components_supplied_count"] or 0)
    }

@router.post("", response_model=SupplierOut)
def create_supplier(payload: SupplierCreate, current_user = Depends(require_manager_or_admin)):
    # Check contact uniqueness
    dup = DBService.query_one("SELECT 1 FROM SUPPLIER WHERE contact_no = :c", {"c": payload.contact_no.strip()})
    if dup:
        raise HTTPException(status_code=400, detail=f"A supplier with contact number '{payload.contact_no}' already exists.")

    supplier_id = payload.supplier_id or DBService.generate_id("SUPPLIER")
    DBService.execute("""
        INSERT INTO SUPPLIER (supplier_id, supplier_name, city, state, contact_no)
        VALUES (:id, :name, :city, :state, :contact)
    """, {
        "id": supplier_id,
        "name": payload.supplier_name.strip(),
        "city": payload.city.strip(),
        "state": payload.state.strip(),
        "contact": payload.contact_no.strip()
    })
    return get_supplier(supplier_id)

@router.put("/{supplier_id}", response_model=SupplierOut)
def update_supplier(supplier_id: str, payload: SupplierUpdate, current_user = Depends(require_manager_or_admin)):
    existing = DBService.query_one("SELECT * FROM SUPPLIER WHERE supplier_id = :id", {"id": supplier_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Supplier not found")

    if payload.contact_no and payload.contact_no.strip() != existing["contact_no"]:
        dup = DBService.query_one("SELECT 1 FROM SUPPLIER WHERE contact_no = :c AND supplier_id != :id", {
            "c": payload.contact_no.strip(),
            "id": supplier_id
        })
        if dup:
            raise HTTPException(status_code=400, detail=f"Contact number '{payload.contact_no}' is already used by another supplier.")

    new_name = payload.supplier_name.strip() if payload.supplier_name else existing["supplier_name"]
    new_city = payload.city.strip() if payload.city else existing["city"]
    new_state = payload.state.strip() if payload.state else existing["state"]
    new_contact = payload.contact_no.strip() if payload.contact_no else existing["contact_no"]

    DBService.execute("""
        UPDATE SUPPLIER
        SET supplier_name = :name, city = :city, state = :state, contact_no = :contact
        WHERE supplier_id = :id
    """, {"id": supplier_id, "name": new_name, "city": new_city, "state": new_state, "contact": new_contact})
    return get_supplier(supplier_id)

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: str, current_user = Depends(require_admin)):
    DBService.execute("DELETE FROM SUPPLIED_BY WHERE supplier_id = :id", {"id": supplier_id})
    DBService.execute("DELETE FROM SUPPLIER WHERE supplier_id = :id", {"id": supplier_id})
    return {"message": f"Supplier '{supplier_id}' deleted successfully."}


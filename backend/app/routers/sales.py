from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from ..models.schemas import SaleCreate, SaleResultOut, SaleOut
from ..services.auth_service import require_authenticated, require_manager_or_admin, require_admin
from ..services.db_service import DBService

router = APIRouter(prefix="/api/sales", tags=["Sales"])

@router.post("", response_model=SaleResultOut)
def record_sale(payload: SaleCreate, current_user = Depends(require_manager_or_admin)):
    """
    Records a sale by executing the stored procedure sp_record_batch_sale_and_restock_check.
    Validates inventory, raises friendly error on oversell, triggers reorder alert,
    and returns financial and remaining stock figures.
    """
    res = DBService.record_batch_sale_sp(
        sale_id=payload.sale_id,
        batch_id=payload.batch_id,
        quantity=payload.quantity,
        sale_date=payload.sale_date,
        recorded_by=current_user.get("username", "system")
    )
    return res

@router.get("", response_model=List[SaleOut])
def list_sales(
    batch_id: Optional[str] = None,
    model_id: Optional[str] = None,
    brand_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user = Depends(require_authenticated)
):
    sql = """
        SELECT s.sale_id, s.batch_id, m.model_name, br.brand_name,
               s.quantity, TO_CHAR(s.sale_date) AS sale_date,
               m.list_price AS unit_price,
               (s.quantity * m.list_price) AS total_revenue
        FROM SALE s
        JOIN MANUFACTURING_BATCH b ON s.batch_id = b.batch_id
        JOIN MOBILE_MODEL m ON b.model_id = m.model_id
        JOIN BRAND br ON m.brand_id = br.brand_id
        WHERE 1=1
    """
    params = {}
    if batch_id:
        sql += " AND s.batch_id = :bid"
        params["bid"] = batch_id
    if model_id:
        sql += " AND b.model_id = :mid"
        params["mid"] = model_id
    if brand_id:
        sql += " AND m.brand_id = :brid"
        params["brid"] = brand_id
    if start_date:
        sql += " AND s.sale_date >= :sdate"
        params["sdate"] = start_date
    if end_date:
        sql += " AND s.sale_date <= :edate"
        params["edate"] = end_date

    sql += " ORDER BY s.sale_date DESC, s.sale_id DESC"
    rows = DBService.query(sql, params)
    return [
        {
            "sale_id": r["sale_id"],
            "batch_id": r["batch_id"],
            "model_name": r["model_name"],
            "brand_name": r["brand_name"],
            "quantity": int(r["quantity"]),
            "sale_date": str(r["sale_date"])[:10],
            "unit_price": float(r["unit_price"]),
            "total_revenue": round(float(r["total_revenue"]), 2)
        }
        for r in rows
    ]

@router.delete("/{sale_id}")
def delete_sale(sale_id: str, current_user = Depends(require_admin)):
    DBService.execute("DELETE FROM SALE WHERE sale_id = :id", {"id": sale_id})
    return {"message": f"Sale '{sale_id}' deleted successfully."}


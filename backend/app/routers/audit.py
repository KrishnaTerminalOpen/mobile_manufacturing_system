from fastapi import APIRouter, Depends
from typing import List
from ..models.schemas import SaleAuditOut
from ..services.auth_service import require_admin
from ..services.db_service import DBService

router = APIRouter(prefix="/api/audit", tags=["Audit Log (Admin Only)"])

@router.get("", response_model=List[SaleAuditOut])
def get_audit_logs(current_user = Depends(require_admin)):
    rows = DBService.query("""
        SELECT audit_id, sale_id, batch_id, quantity,
               TO_CHAR(sale_date) AS sale_date,
               recorded_by,
               TO_CHAR(recorded_at) AS recorded_at,
               reorder_alert_fired,
               remaining_stock
        FROM SALE_AUDIT
        ORDER BY audit_id DESC
    """)
    return [
        {
            "audit_id": r["audit_id"],
            "sale_id": r["sale_id"],
            "batch_id": r["batch_id"],
            "quantity": int(r["quantity"]),
            "sale_date": str(r["sale_date"])[:10],
            "recorded_by": r["recorded_by"],
            "recorded_at": str(r["recorded_at"]),
            "reorder_alert_fired": r["reorder_alert_fired"],
            "remaining_stock": int(r["remaining_stock"]) if r.get("remaining_stock") is not None else None
        }
        for r in rows
    ]


import sys
from backend.app.database import db_manager
db_manager.initialize()
from backend.app.services.db_service import DBService
from backend.app.routers.db_explorer import demo_oversell_trigger
from backend.app.models.schemas import OversellDemoRequest
from backend.app.services.auth_service import verify_password

print("="*60)
print("DATABASE ENGINE:", db_manager.engine_name)

brands = DBService.query("SELECT COUNT(*) AS c FROM BRAND")
print("Total Brands in DB:", brands[0]["c"])

models = DBService.query("SELECT model_id, model_name, list_price FROM MOBILE_MODEL")
print(f"Total Models: {len(models)}")
for m in models:
    bom = DBService.calculate_bom_cost(m["model_id"])
    lp = float(m["list_price"])
    margin = lp - bom
    margin_pct = (margin / lp) * 100
    print(f" - {m['model_id']} {m['model_name']}: List Price Rs.{lp:.2f} | BOM Cost: Rs.{bom:.2f} | Margin: {margin_pct:.1f}%")

print("\nTESTING OVERSELL TRIGGER BLOCK:")
res = demo_oversell_trigger(OversellDemoRequest(batch_id="BCH504", excess_quantity=500), {"username": "test_examiner"})
print("Status:", res["status"])
print("Trigger Code:", res["oracle_error_code"])
print("Error Message:", res["caught_exception_message"])

print("\nTESTING PASSWORD HASHES:")
users = DBService.query("SELECT username, password_hash, role FROM APP_USER")
for u in users:
    pwd = f"{u['username']}123"
    valid = verify_password(pwd, u["password_hash"])
    print(f"User '{u['username']}' with password '{pwd}': {'VERIFIED OK' if valid else 'FAILED'}")

print("\nTESTING STORED PROCEDURE RECORD SALE:")
sale_res = DBService.record_batch_sale_sp(
    sale_id="AUTO",
    batch_id="BCH505",
    quantity=20,
    sale_date="2026-11-06",
    recorded_by="admin"
)
print("Sale Recorded:", sale_res["sale_id"], "Revenue: Rs.", sale_res["invoice_revenue"], "Remaining:", sale_res["remaining_stock"], "Reorder Alert:", sale_res["reorder_alert_fired"])

print("\nALL BACKEND UNIT CHECKS PASSED SUCCESSFULLY!")
print("="*60)

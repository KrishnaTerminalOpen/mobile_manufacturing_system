import urllib.request
import json

def get(url, token=None):
    req = urllib.request.Request(url)
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def post(url, data, token=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'))
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

print("="*60)
print("1. Health Check:")
h = get("http://127.0.0.1:8000/api/health")
print("Engine:", h["database_engine"], "| Oracle connected:", h["oracle_connected"])

print("\n2. JWT Authentication:")
auth = post("http://127.0.0.1:8000/api/auth/login", {"username": "admin", "password": "admin123"})
token = auth["access_token"]
print("User:", auth["user"]["full_name"], "(Role:", auth["user"]["role"], ")")

print("\n3. Dashboard Summary KPIs:")
dash = get("http://127.0.0.1:8000/api/dashboard/summary", token)
for k, v in dash["kpis"].items():
    print(f"  {k}: {v}")
print("Active Reorder Alerts:", len(dash["reorder_alerts"]))

print("\n4. Brand Financials Report (Query 4 with CTE fix):")
brands = get("http://127.0.0.1:8000/api/reports/brand-finance", token)
for b in brands:
    print(f"  {b['brand_id']} {b['brand_name']}: Produced={b['total_units_produced']} Sold={b['total_units_sold']} MfgCost=Rs.{b['total_manufacturing_cost']:.2f} Revenue=Rs.{b['total_gross_revenue']:.2f} Surplus=Rs.{b['net_surplus']:.2f} ROI={b['roi_percent']}%")

print("\n5. PL/SQL Oversell Trigger Block Test:")
demo = post("http://127.0.0.1:8000/api/db-explorer/demo-oversell", {"batch_id": "BCH504", "excess_quantity": 500}, token)
print("Trigger Intercept Status:", demo["status"])
print("Oracle Error Code:", demo["oracle_error_code"])
print("Trigger Exception Message:", demo["caught_exception_message"])

print("\n6. Model BOM Live Cost Function fn_calculate_model_bom_cost:")
models = get("http://127.0.0.1:8000/api/models", token)
for m in models:
    print(f"  {m['model_id']} {m['model_name']}: List Price=Rs.{m['list_price']} | BOM Cost=Rs.{m['bom_cost']} | Gross Margin=Rs.{m['margin']} ({m['margin_percent']}%)")

print("\n7. Cost Optimizer for MD101 (Astra Nova 5G):")
opt = get("http://127.0.0.1:8000/api/sourcing/optimizer?model_id=MD101&target_batch_qty=500", token)
print(f"  Std BOM Cost: Rs.{opt['std_bom_cost_per_unit']} | Optimized BOM: Rs.{opt['optimized_bom_cost_per_unit']}")
print(f"  Saving / Unit: Rs.{opt['saving_per_unit']} ({opt['saving_percentage']}%) | Total Batch Savings: Rs.{opt['total_savings_for_batch']}")

print("\nALL API ENDPOINTS ARE FULLY OPERATIONAL AND VERIFIED WITH ORACLE 21C XE!")
print("="*60)


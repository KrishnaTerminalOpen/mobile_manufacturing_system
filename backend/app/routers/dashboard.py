from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from ..models.schemas import DashboardSummaryResponse, KPICards, ReorderAlertItem
from ..services.auth_service import require_authenticated
from ..services.db_service import DBService
from ..database import db_manager

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(current_user = Depends(require_authenticated)):
    # 1. Total brands & models
    brand_cnt = DBService.query_one("SELECT COUNT(*) AS cnt FROM BRAND")["cnt"]
    model_cnt = DBService.query_one("SELECT COUNT(*) AS cnt FROM MOBILE_MODEL")["cnt"]

    # 2. Batches & Production
    batch_stats = DBService.query_one("""
        SELECT COUNT(*) AS batch_cnt,
               COALESCE(SUM(production_qty), 0) AS total_produced,
               COALESCE(SUM(manufacturing_cost), 0) AS total_mfg_cost
        FROM MANUFACTURING_BATCH
    """)
    batch_cnt = int(batch_stats["batch_cnt"])
    total_produced = int(batch_stats["total_produced"])
    total_mfg_cost = float(batch_stats["total_mfg_cost"])

    # 3. Sales & Revenue
    sales_stats = DBService.query_one("""
        SELECT COALESCE(SUM(s.quantity), 0) AS total_sold,
               COALESCE(SUM(s.quantity * m.list_price), 0) AS gross_revenue
        FROM SALE s
        JOIN MANUFACTURING_BATCH b ON s.batch_id = b.batch_id
        JOIN MOBILE_MODEL m ON b.model_id = m.model_id
    """)
    total_sold = int(sales_stats["total_sold"])
    gross_rev = float(sales_stats["gross_revenue"])
    net_surplus = gross_rev - total_mfg_cost

    # 4. Batch stock status & low-stock check
    batches = DBService.query("""
        SELECT b.batch_id, b.model_id, m.model_name, br.brand_name,
               b.production_qty, b.reorder_level,
               COALESCE((SELECT SUM(s.quantity) FROM SALE s WHERE s.batch_id = b.batch_id), 0) AS sold_qty
        FROM MANUFACTURING_BATCH b
        JOIN MOBILE_MODEL m ON b.model_id = m.model_id
        JOIN BRAND br ON m.brand_id = br.brand_id
        ORDER BY b.batch_id
    """)

    batch_stock_status = []
    reorder_alerts = []
    low_stock_count = 0

    for b in batches:
        prod = int(b["production_qty"])
        sold = int(b["sold_qty"])
        rem = prod - sold
        reorder_lvl = int(b["reorder_level"])
        is_low = (rem <= reorder_lvl)
        if is_low:
            low_stock_count += 1
            reorder_alerts.append(ReorderAlertItem(
                batch_id=b["batch_id"],
                model_id=b["model_id"],
                model_name=b["model_name"],
                brand_name=b["brand_name"],
                remaining_stock=rem,
                reorder_level=reorder_lvl,
                production_qty=prod
            ))

        batch_stock_status.append({
            "batch_id": b["batch_id"],
            "model_name": b["model_name"],
            "sold_qty": sold,
            "remaining_stock": rem,
            "reorder_level": reorder_lvl,
            "is_low_stock": is_low
        })

    # 5. Revenue by brand
    brand_rev_rows = DBService.query("""
        SELECT br.brand_name,
               COALESCE(SUM(s.quantity * mm.list_price), 0) AS revenue,
               COALESCE(SUM(s.quantity), 0) AS units_sold
        FROM BRAND br
        LEFT JOIN MOBILE_MODEL mm ON br.brand_id = mm.brand_id
        LEFT JOIN MANUFACTURING_BATCH mb ON mm.model_id = mb.model_id
        LEFT JOIN SALE s ON mb.batch_id = s.batch_id
        GROUP BY br.brand_name
        ORDER BY revenue DESC
    """)
    revenue_by_brand = [
        {
            "brand_name": r["brand_name"],
            "revenue": round(float(r["revenue"]), 2),
            "units_sold": int(r["units_sold"])
        }
        for r in brand_rev_rows
    ]

    # 6. Sales trend per month
    sales_trend_rows = DBService.query("""
        SELECT SUBSTR(TO_CHAR(s.sale_date), 1, 7) AS month,
               COALESCE(SUM(s.quantity), 0) AS units_sold,
               COALESCE(SUM(s.quantity * mm.list_price), 0) AS revenue
        FROM SALE s
        JOIN MANUFACTURING_BATCH mb ON s.batch_id = mb.batch_id
        JOIN MOBILE_MODEL mm ON mb.model_id = mm.model_id
        GROUP BY SUBSTR(TO_CHAR(s.sale_date), 1, 7)
        ORDER BY month ASC
    """)
    sales_trend = [
        {
            "month": str(r["month"]),
            "units_sold": int(r["units_sold"]),
            "revenue": round(float(r["revenue"]), 2)
        }
        for r in sales_trend_rows
    ]

    # 7. BOM vs List price per model
    models = DBService.query("SELECT model_id, model_name, list_price FROM MOBILE_MODEL ORDER BY model_id")
    bom_vs_price = []
    for m in models:
        bom = DBService.calculate_bom_cost(m["model_id"])
        lp = float(m["list_price"])
        bom_vs_price.append({
            "model_name": m["model_name"],
            "bom_cost": round(bom, 2),
            "list_price": lp,
            "gross_margin": round(lp - bom, 2)
        })

    kpis = KPICards(
        total_brands=int(brand_cnt),
        total_models=int(model_cnt),
        active_batches=batch_cnt,
        total_units_produced=total_produced,
        total_units_sold=total_sold,
        gross_revenue=round(gross_rev, 2),
        net_surplus=round(net_surplus, 2),
        low_stock_batches_count=low_stock_count
    )

    return DashboardSummaryResponse(
        kpis=kpis,
        revenue_by_brand=revenue_by_brand,
        sales_trend_monthly=sales_trend,
        batch_stock_status=batch_stock_status,
        bom_vs_price=bom_vs_price,
        reorder_alerts=reorder_alerts,
        database_engine=db_manager.engine_name
    )

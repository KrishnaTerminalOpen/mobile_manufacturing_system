from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..models.schemas import (
    InventoryReportRow,
    BOMMarginReportRow,
    SupplierLowestQuoteRow,
    BrandFinancialRow
)
from ..services.auth_service import require_authenticated
from ..services.db_service import DBService

router = APIRouter(prefix="/api/reports", tags=["Business & Analytical Reports"])

@router.get("/inventory", response_model=List[InventoryReportRow])
def get_inventory_report(current_user = Depends(require_authenticated)):
    """
    Query 1: Inventory Stock Status & Valuation
    Computes produced units, sold units, remaining stock, reorder status,
    and current asset valuation of unsold finished stock.
    """
    sql = """
        SELECT 
            b.batch_id,
            br.brand_name,
            m.model_name,
            TO_CHAR(b.production_date) AS production_date,
            b.production_qty,
            COALESCE((SELECT SUM(s.quantity) FROM SALE s WHERE s.batch_id = b.batch_id), 0) AS sold_qty,
            b.manufacturing_cost,
            b.reorder_level
        FROM MANUFACTURING_BATCH b
        JOIN MOBILE_MODEL m ON b.model_id = m.model_id
        JOIN BRAND br ON m.brand_id = br.brand_id
        ORDER BY b.batch_id
    """
    rows = DBService.query(sql)
    results = []
    for r in rows:
        prod_qty = int(r["production_qty"])
        sold_qty = int(r["sold_qty"])
        remaining = prod_qty - sold_qty
        reorder_lvl = int(r["reorder_level"])
        status = "REORDER IMMEDIATELY" if remaining <= reorder_lvl else "OPTIMAL STOCK"
        mfg_cost = float(r["manufacturing_cost"])
        unit_cost = (mfg_cost / prod_qty) if prod_qty > 0 else 0.0
        valuation = remaining * unit_cost

        results.append(InventoryReportRow(
            batch_id=r["batch_id"],
            brand_name=r["brand_name"],
            model_name=r["model_name"],
            production_date=str(r["production_date"])[:10],
            production_qty=prod_qty,
            sold_qty=sold_qty,
            remaining_stock=remaining,
            reorder_level=reorder_lvl,
            stock_status=status,
            manufacturing_cost=mfg_cost,
            inventory_valuation=round(valuation, 2)
        ))
    return results

@router.get("/bom-margin", response_model=List[BOMMarginReportRow])
def get_bom_margin_report(current_user = Depends(require_authenticated)):
    """
    Query 2: Model Gross Margin Report
    Compares selling list price against total Bill of Materials (BOM) cost calculated via PL/SQL.
    """
    sql = """
        SELECT m.model_id, br.brand_name, m.model_name, m.launch_year, m.list_price
        FROM MOBILE_MODEL m
        JOIN BRAND br ON m.brand_id = br.brand_id
        ORDER BY m.model_id
    """
    rows = DBService.query(sql)
    results = []
    for r in rows:
        bom_cost = DBService.calculate_bom_cost(r["model_id"])
        list_price = float(r["list_price"])
        margin = list_price - bom_cost
        margin_pct = (margin / list_price * 100) if list_price > 0 else 0.0

        results.append(BOMMarginReportRow(
            model_id=r["model_id"],
            brand_name=r["brand_name"],
            model_name=r["model_name"],
            launch_year=int(r["launch_year"]),
            list_price=list_price,
            bom_cost=round(bom_cost, 2),
            gross_margin=round(margin, 2),
            margin_percent=round(margin_pct, 2)
        ))
    return results

@router.get("/supplier-quotes", response_model=List[SupplierLowestQuoteRow])
def get_supplier_quotes_report(current_user = Depends(require_authenticated)):
    """
    Query 3: Sourcing Efficiency & Lowest Quote Analysis
    Identifies the best available market price per component against internal standard baseline cost.
    """
    comps = DBService.query("""
        SELECT component_id, component_name, unit_cost
        FROM COMPONENT
        ORDER BY component_id
    """)
    results = []
    for c in comps:
        cid = c["component_id"]
        std_cost = float(c["unit_cost"])

        best = DBService.query_one("""
            SELECT sb.supply_cost, sb.availability, s.supplier_name
            FROM SUPPLIED_BY sb
            JOIN SUPPLIER s ON sb.supplier_id = s.supplier_id
            WHERE sb.component_id = :cid
            ORDER BY sb.supply_cost ASC
        """, {"cid": cid})

        cnt_row = DBService.query_one("""
            SELECT COUNT(*) AS cnt FROM SUPPLIED_BY WHERE component_id = :cid
        """, {"cid": cid})

        quotes_cnt = int(cnt_row["cnt"]) if cnt_row else 0
        lowest = float(best["supply_cost"]) if best else std_cost
        saving = std_cost - lowest
        supp_name = best["supplier_name"] if best else "No external quotes"
        avail = best["availability"] if best else "N/A"

        results.append(SupplierLowestQuoteRow(
            component_id=cid,
            component_name=c["component_name"],
            std_unit_cost=std_cost,
            lowest_quote=lowest,
            saving_per_unit=round(saving, 2),
            cheapest_supplier=supp_name,
            availability=avail,
            total_quotes_count=quotes_cnt
        ))
    return results

@router.get("/brand-finance", response_model=List[BrandFinancialRow])
def get_brand_financial_report(current_user = Depends(require_authenticated)):
    """
    Query 4: Brand Financial Performance (Corrected CTE Query)
    Fixes the bug where SUM(DISTINCT manufacturing_cost) erroneously collapsed identical batch costs.
    Uses CTE / subquery aggregation to compute accurate production costs, revenues, and net surplus.
    """
    sql = """
        WITH batch_summary AS (
            SELECT 
                b.batch_id,
                b.model_id,
                b.manufacturing_cost,
                b.production_qty,
                COALESCE(SUM(s.quantity), 0) AS units_sold
            FROM MANUFACTURING_BATCH b
            LEFT JOIN SALE s ON b.batch_id = s.batch_id
            GROUP BY b.batch_id, b.model_id, b.manufacturing_cost, b.production_qty
        )
        SELECT 
            br.brand_id,
            br.brand_name,
            COUNT(DISTINCT mm.model_id) AS total_models,
            COUNT(DISTINCT bs.batch_id) AS total_batches,
            COALESCE(SUM(bs.production_qty), 0) AS total_units_produced,
            COALESCE(SUM(bs.units_sold), 0) AS total_units_sold,
            COALESCE(SUM(bs.manufacturing_cost), 0) AS total_manufacturing_cost,
            COALESCE(SUM(bs.units_sold * mm.list_price), 0) AS total_gross_revenue,
            (COALESCE(SUM(bs.units_sold * mm.list_price), 0) - COALESCE(SUM(bs.manufacturing_cost), 0)) AS net_surplus
        FROM BRAND br
        LEFT JOIN MOBILE_MODEL mm ON br.brand_id = mm.brand_id
        LEFT JOIN batch_summary bs ON mm.model_id = bs.model_id
        GROUP BY br.brand_id, br.brand_name
        ORDER BY br.brand_id
    """
    rows = DBService.query(sql)
    results = []
    for r in rows:
        mfg_cost = float(r["total_manufacturing_cost"])
        revenue = float(r["total_gross_revenue"])
        surplus = float(r["net_surplus"])
        roi = ((surplus / mfg_cost) * 100) if mfg_cost > 0 else 0.0

        results.append(BrandFinancialRow(
            brand_id=r["brand_id"],
            brand_name=r["brand_name"],
            total_models=int(r["total_models"]),
            total_batches=int(r["total_batches"]),
            total_units_produced=int(r["total_units_produced"]),
            total_units_sold=int(r["total_units_sold"]),
            total_manufacturing_cost=round(mfg_cost, 2),
            total_gross_revenue=round(revenue, 2),
            net_surplus=round(surplus, 2),
            roi_percent=round(roi, 2)
        ))
    return results


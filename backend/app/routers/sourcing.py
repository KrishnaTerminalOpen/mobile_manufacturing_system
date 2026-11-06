from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from ..models.schemas import CostOptimizerResponse, CostOptimizerItem
from ..services.auth_service import require_authenticated
from ..services.db_service import DBService

router = APIRouter(prefix="/api/sourcing", tags=["Sourcing & Cost Optimizer"])

@router.get("/matrix")
def get_sourcing_matrix(current_user = Depends(require_authenticated)):
    """
    Returns 2D grid matrix:
    - suppliers: list of suppliers (columns)
    - components: list of components (rows)
    - matrix: { component_id: { supplier_id: { supply_cost, availability, is_lowest, saving } } }
    """
    suppliers = DBService.query("SELECT supplier_id, supplier_name, city, state FROM SUPPLIER ORDER BY supplier_id")
    components = DBService.query("SELECT component_id, component_name, unit_cost FROM COMPONENT ORDER BY component_id")
    quotes = DBService.query("SELECT component_id, supplier_id, supply_cost, availability FROM SUPPLIED_BY")

    # Group quotes by component
    comp_quotes: Dict[str, Dict[str, Any]] = {}
    for q in quotes:
        cid = q["component_id"]
        sid = q["supplier_id"]
        if cid not in comp_quotes:
            comp_quotes[cid] = {}
        comp_quotes[cid][sid] = {
            "supply_cost": float(q["supply_cost"]),
            "availability": q["availability"]
        }

    matrix_rows = []
    for c in components:
        cid = c["component_id"]
        std_cost = float(c["unit_cost"])
        q_map = comp_quotes.get(cid, {})

        # Find min cost for this component
        min_cost = None
        if q_map:
            min_cost = min(info["supply_cost"] for info in q_map.values())

        quotes_dict = {}
        for s in suppliers:
            sid = s["supplier_id"]
            if sid in q_map:
                scost = q_map[sid]["supply_cost"]
                quotes_dict[sid] = {
                    "supply_cost": scost,
                    "availability": q_map[sid]["availability"],
                    "is_lowest": (scost == min_cost),
                    "saving_vs_std": round(std_cost - scost, 2)
                }
            else:
                quotes_dict[sid] = None

        matrix_rows.append({
            "component_id": cid,
            "component_name": c["component_name"],
            "unit_cost": std_cost,
            "lowest_quote": min_cost,
            "max_saving": round(std_cost - min_cost, 2) if min_cost is not None else 0.0,
            "quotes": quotes_dict
        })

    return {
        "suppliers": suppliers,
        "rows": matrix_rows
    }

@router.get("/optimizer", response_model=CostOptimizerResponse)
def get_cost_optimizer(
    model_id: str,
    target_batch_qty: int = Query(500, gt=0),
    current_user = Depends(require_authenticated)
):
    """
    Computes standard BOM cost vs optimized BOM cost (picking cheapest supplier for each required component).
    Returns per-unit savings and total production run savings for the target quantity.
    """
    model = DBService.query_one("SELECT model_id, model_name FROM MOBILE_MODEL WHERE model_id = :id", {"id": model_id})
    if not model:
        raise HTTPException(status_code=404, detail="Mobile Model not found")

    bom_items = DBService.query("""
        SELECT r.component_id, c.component_name, c.unit_cost, r.qty_req
        FROM REQUIRES r
        JOIN COMPONENT c ON r.component_id = c.component_id
        WHERE r.model_id = :id
        ORDER BY r.component_id
    """, {"id": model_id})

    total_std_bom = 0.0
    total_opt_bom = 0.0
    breakdown: List[CostOptimizerItem] = []

    for item in bom_items:
        cid = item["component_id"]
        qty = int(item["qty_req"])
        std_cost = float(item["unit_cost"])
        std_total = qty * std_cost

        # Find best supplier quote
        best_quote = DBService.query_one("""
            SELECT sb.supplier_id, s.supplier_name, sb.supply_cost, sb.availability
            FROM SUPPLIED_BY sb
            JOIN SUPPLIER s ON sb.supplier_id = s.supplier_id
            WHERE sb.component_id = :cid
            ORDER BY sb.supply_cost ASC
        """, {"cid": cid})

        if best_quote:
            opt_unit_cost = float(best_quote["supply_cost"])
            best_supp_id = best_quote["supplier_id"]
            best_supp_name = best_quote["supplier_name"]
            avail = best_quote["availability"]
        else:
            opt_unit_cost = std_cost
            best_supp_id = None
            best_supp_name = "Standard Sourcing"
            avail = "N/A"

        opt_total = qty * opt_unit_cost
        saving = std_total - opt_total

        total_std_bom += std_total
        total_opt_bom += opt_total

        breakdown.append(CostOptimizerItem(
            component_id=cid,
            component_name=item["component_name"],
            qty_req=qty,
            std_unit_cost=std_cost,
            std_total_cost=round(std_total, 2),
            best_supplier_id=best_supp_id,
            best_supplier_name=best_supp_name,
            best_supply_cost=opt_unit_cost,
            optimized_total_cost=round(opt_total, 2),
            unit_savings=round(saving, 2),
            availability=avail
        ))

    unit_saving = total_std_bom - total_opt_bom
    saving_pct = (unit_saving / total_std_bom * 100) if total_std_bom > 0 else 0.0
    total_batch_savings = unit_saving * target_batch_qty

    return CostOptimizerResponse(
        model_id=model["model_id"],
        model_name=model["model_name"],
        target_batch_qty=target_batch_qty,
        std_bom_cost_per_unit=round(total_std_bom, 2),
        optimized_bom_cost_per_unit=round(total_opt_bom, 2),
        saving_per_unit=round(unit_saving, 2),
        saving_percentage=round(saving_pct, 2),
        total_savings_for_batch=round(total_batch_savings, 2),
        breakdown=breakdown
    )

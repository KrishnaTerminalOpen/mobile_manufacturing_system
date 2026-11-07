from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# ------------------------------------------------------------------------------
# Auth Schemas
# ------------------------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserOut(BaseModel):
    user_id: str
    username: str
    role: str
    full_name: str
    created_at: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = Field(..., pattern="^(ADMIN|MANAGER|VIEWER)$")
    full_name: str

# ------------------------------------------------------------------------------
# Brand Schemas
# ------------------------------------------------------------------------------
class BrandBase(BaseModel):
    brand_name: str
    state: str
    city: str

class BrandCreate(BrandBase):
    brand_id: Optional[str] = None

class BrandUpdate(BaseModel):
    brand_name: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None

class BrandOut(BrandBase):
    brand_id: str
    model_count: Optional[int] = 0

# ------------------------------------------------------------------------------
# Mobile Model Schemas
# ------------------------------------------------------------------------------
class ModelBase(BaseModel):
    brand_id: str
    model_name: str
    launch_year: int = Field(..., ge=2000, le=2100)
    list_price: float = Field(..., gt=0)

class ModelCreate(ModelBase):
    model_id: Optional[str] = None

class ModelUpdate(BaseModel):
    brand_id: Optional[str] = None
    model_name: Optional[str] = None
    launch_year: Optional[int] = Field(None, ge=2000, le=2100)
    list_price: Optional[float] = Field(None, gt=0)

class ModelOut(ModelBase):
    model_id: str
    brand_name: Optional[str] = None
    bom_cost: Optional[float] = 0.0
    margin: Optional[float] = 0.0
    margin_percent: Optional[float] = 0.0

class ModelBOMItem(BaseModel):
    component_id: str
    component_name: str
    description: Optional[str] = None
    unit_cost: float
    qty_req: int
    line_cost: float

class ModelDetailOut(ModelOut):
    components: List[ModelBOMItem] = []

# ------------------------------------------------------------------------------
# Component Schemas
# ------------------------------------------------------------------------------
class ComponentBase(BaseModel):
    component_name: str
    description: Optional[str] = None
    unit_cost: float = Field(..., gt=0)

class ComponentCreate(ComponentBase):
    component_id: Optional[str] = None

class ComponentUpdate(BaseModel):
    component_name: Optional[str] = None
    description: Optional[str] = None
    unit_cost: Optional[float] = Field(None, gt=0)

class ComponentOut(ComponentBase):
    component_id: str
    used_in_models_count: Optional[int] = 0
    supplier_count: Optional[int] = 0
    lowest_quote: Optional[float] = None
    best_supplier_name: Optional[str] = None

class ComponentQuoteItem(BaseModel):
    supplier_id: str
    supplier_name: str
    city: str
    state: str
    supply_cost: float
    availability: str
    saving_vs_std: float

class ComponentDetailOut(ComponentOut):
    quotes: List[ComponentQuoteItem] = []

# ------------------------------------------------------------------------------
# Supplier Schemas
# ------------------------------------------------------------------------------
class SupplierBase(BaseModel):
    supplier_name: str
    city: str
    state: str
    contact_no: str

class SupplierCreate(SupplierBase):
    supplier_id: Optional[str] = None

class SupplierUpdate(BaseModel):
    supplier_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    contact_no: Optional[str] = None

class SupplierOut(SupplierBase):
    supplier_id: str
    components_supplied_count: Optional[int] = 0

# ------------------------------------------------------------------------------
# Requires (BOM Link) Schemas
# ------------------------------------------------------------------------------
class RequiresCreate(BaseModel):
    model_id: str
    component_id: str
    qty_req: int = Field(..., gt=0)

class RequiresUpdate(BaseModel):
    qty_req: int = Field(..., gt=0)

class RequiresOut(BaseModel):
    model_id: str
    component_id: str
    component_name: str
    unit_cost: float
    qty_req: int
    total_cost: float

# ------------------------------------------------------------------------------
# Supplied By Schemas
# ------------------------------------------------------------------------------
class SuppliedByCreate(BaseModel):
    component_id: str
    supplier_id: str
    supply_cost: float = Field(..., gt=0)
    availability: str

class SuppliedByUpdate(BaseModel):
    supply_cost: Optional[float] = Field(None, gt=0)
    availability: Optional[str] = None

class SuppliedByOut(BaseModel):
    component_id: str
    component_name: str
    supplier_id: str
    supplier_name: str
    supply_cost: float
    availability: str

# ------------------------------------------------------------------------------
# Manufacturing Batch Schemas
# ------------------------------------------------------------------------------
class BatchBase(BaseModel):
    model_id: str
    production_date: str
    production_qty: int = Field(..., gt=0)
    manufacturing_cost: float = Field(..., gt=0)
    reorder_level: int = Field(..., ge=0)

class BatchCreate(BatchBase):
    batch_id: Optional[str] = None

class BatchUpdate(BaseModel):
    model_id: Optional[str] = None
    production_date: Optional[str] = None
    production_qty: Optional[int] = Field(None, gt=0)
    manufacturing_cost: Optional[float] = Field(None, gt=0)
    reorder_level: Optional[int] = Field(None, ge=0)

class BatchOut(BatchBase):
    batch_id: str
    model_name: Optional[str] = None
    brand_name: Optional[str] = None
    sold_qty: int = 0
    remaining_stock: int = 0
    stock_status: str  # OPTIMAL STOCK or REORDER IMMEDIATELY
    cost_per_unit: float = 0.0
    bom_cost: float = 0.0
    sales_count: int = 0

class BatchSaleItem(BaseModel):
    sale_id: str
    quantity: int
    sale_date: str
    revenue: float

class BatchDetailOut(BatchOut):
    sales: List[BatchSaleItem] = []

# ------------------------------------------------------------------------------
# Sale Schemas
# ------------------------------------------------------------------------------
class SaleCreate(BaseModel):
    sale_id: Optional[str] = "AUTO"
    batch_id: str
    quantity: int = Field(..., gt=0)
    sale_date: Optional[str] = None

class SaleResultOut(BaseModel):
    sale_id: str
    batch_id: str
    quantity: int
    sale_date: str
    invoice_revenue: float
    remaining_stock: int
    reorder_alert_fired: bool
    status_message: str

class SaleOut(BaseModel):
    sale_id: str
    batch_id: str
    model_name: str
    brand_name: str
    quantity: int
    sale_date: str
    unit_price: float
    total_revenue: float

# ------------------------------------------------------------------------------
# Audit Schemas
# ------------------------------------------------------------------------------
class SaleAuditOut(BaseModel):
    audit_id: str
    sale_id: str
    batch_id: str
    quantity: int
    sale_date: str
    recorded_by: str
    recorded_at: str
    reorder_alert_fired: str
    remaining_stock: Optional[int] = None

# ------------------------------------------------------------------------------
# Reports Schemas
# ------------------------------------------------------------------------------
class InventoryReportRow(BaseModel):
    batch_id: str
    brand_name: str
    model_name: str
    production_date: str
    production_qty: int
    sold_qty: int
    remaining_stock: int
    reorder_level: int
    stock_status: str
    manufacturing_cost: float
    inventory_valuation: float

class BOMMarginReportRow(BaseModel):
    model_id: str
    brand_name: str
    model_name: str
    launch_year: int
    list_price: float
    bom_cost: float
    gross_margin: float
    margin_percent: float

class SupplierLowestQuoteRow(BaseModel):
    component_id: str
    component_name: str
    std_unit_cost: float
    lowest_quote: float
    saving_per_unit: float
    cheapest_supplier: str
    availability: str
    total_quotes_count: int

class BrandFinancialRow(BaseModel):
    brand_id: str
    brand_name: str
    total_models: int
    total_batches: int
    total_units_produced: int
    total_units_sold: int
    total_manufacturing_cost: float
    total_gross_revenue: float
    net_surplus: float
    roi_percent: float

# ------------------------------------------------------------------------------
# Cost Optimizer Schemas
# ------------------------------------------------------------------------------
class CostOptimizerItem(BaseModel):
    component_id: str
    component_name: str
    qty_req: int
    std_unit_cost: float
    std_total_cost: float
    best_supplier_id: Optional[str] = None
    best_supplier_name: Optional[str] = None
    best_supply_cost: float
    optimized_total_cost: float
    unit_savings: float
    availability: str

class CostOptimizerResponse(BaseModel):
    model_id: str
    model_name: str
    target_batch_qty: int
    std_bom_cost_per_unit: float
    optimized_bom_cost_per_unit: float
    saving_per_unit: float
    saving_percentage: float
    total_savings_for_batch: float
    breakdown: List[CostOptimizerItem]

# ------------------------------------------------------------------------------
# Dashboard Schemas
# ------------------------------------------------------------------------------
class KPICards(BaseModel):
    total_brands: int
    total_models: int
    active_batches: int
    total_units_produced: int
    total_units_sold: int
    gross_revenue: float
    net_surplus: float
    low_stock_batches_count: int

class BrandRevenueChartItem(BaseModel):
    brand_name: str
    revenue: float
    units_sold: int

class MonthlySalesChartItem(BaseModel):
    month: str
    units_sold: int
    revenue: float

class BatchStockChartItem(BaseModel):
    batch_id: str
    model_name: str
    sold_qty: int
    remaining_stock: int
    reorder_level: int
    is_low_stock: bool

class ModelMarginChartItem(BaseModel):
    model_name: str
    bom_cost: float
    list_price: float
    gross_margin: float

class ReorderAlertItem(BaseModel):
    batch_id: str
    model_id: str
    model_name: str
    brand_name: str
    remaining_stock: int
    reorder_level: int
    production_qty: int

class DashboardSummaryResponse(BaseModel):
    kpis: KPICards
    revenue_by_brand: List[BrandRevenueChartItem]
    sales_trend_monthly: List[MonthlySalesChartItem]
    batch_stock_status: List[BatchStockChartItem]
    bom_vs_price: List[ModelMarginChartItem]
    reorder_alerts: List[ReorderAlertItem]
    database_engine: str

# ------------------------------------------------------------------------------
# DB Explorer Schemas
# ------------------------------------------------------------------------------
class SqlRunRequest(BaseModel):
    sql: str

class SqlRunResponse(BaseModel):
    columns: List[str]
    rows: List[Dict[str, Any]]
    row_count: int
    execution_time_ms: float

class OversellDemoRequest(BaseModel):
    batch_id: str = "BCH504"
    excess_quantity: int = 500


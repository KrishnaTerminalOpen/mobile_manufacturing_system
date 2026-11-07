# Mobile Manufacturing System (MMS)
## Comprehensive DBMS Viva & Technical Reference Notes
**Target Examination**: MCA Mini Project • Manipal Institute of Technology (MIT)  
**Database**: Oracle Database 21c Express Edition (XE)

---

## 1. Entity-Relationship (ER) Design & Relational Model

### Entities & Cardinalities:
1. **BRAND (1) : (N) MOBILE_MODEL**  
   - A single manufacturing brand (e.g., *AstraTech Mobile*) produces multiple mobile models (*Astra Nova 5G*, *Astra Pulse Pro*).  
   - **Foreign Key**: `MOBILE_MODEL.brand_id` references `BRAND.brand_id`.
2. **MOBILE_MODEL (1) : (N) MANUFACTURING_BATCH**  
   - A model is manufactured in multiple discrete production runs/lots, each with distinct production dates, lot sizes, costs, and reorder levels.  
   - **Foreign Key**: `MANUFACTURING_BATCH.model_id` references `MOBILE_MODEL.model_id`.
3. **MANUFACTURING_BATCH (1) : (N) SALE**  
   - Finished goods from a batch are dispatched to distributors across multiple sales transactions.  
   - **Foreign Key**: `SALE.batch_id` references `MANUFACTURING_BATCH.batch_id`.
4. **MOBILE_MODEL (M) : (N) COMPONENT via `REQUIRES` (Bill of Materials - BOM)**  
   - A phone model requires multiple hardware parts (Display, SoC, Battery, Camera, RAM). A single component part is also reused across different models.  
   - **Composite Primary Key**: `(model_id, component_id)` in associative entity `REQUIRES`. Includes descriptive attribute `qty_req`.
5. **COMPONENT (M) : (N) SUPPLIER via `SUPPLIED_BY` (Sourcing Matrix)**  
   - A component can be procured from multiple certified vendors at different quoted prices and lead times. A supplier supplies multiple parts.  
   - **Composite Primary Key**: `(component_id, supplier_id)` in associative entity `SUPPLIED_BY`. Includes attributes `supply_cost` and `availability`.

---

## 2. Database Normalization Analysis (1NF to BCNF)

Every relational table in this schema adheres strictly to **Boyce-Codd Normal Form (BCNF)**:

### First Normal Form (1NF):
- All attribute values are atomic (e.g., `contact_no`, `brand_name`, `production_qty`). No repeating groups or multi-valued columns.
- Every table has a clearly defined primary key.

### Second Normal Form (2NF):
- The schema is in 1NF and contains **no partial functional dependencies**.
- In tables with composite keys (`REQUIRES` and `SUPPLIED_BY`), all non-key attributes depend on the **entire composite key**:
  - In `REQUIRES`: `(model_id, component_id) -> qty_req`. (The required quantity depends on both the phone model and the component).
  - In `SUPPLIED_BY`: `(component_id, supplier_id) -> supply_cost, availability`. (The quote price and availability depend on both the specific component and the vendor).

### Third Normal Form (3NF):
- The schema is in 2NF and contains **no transitive dependencies** ($X \rightarrow Y$ and $Y \rightarrow Z$).
- Non-key attributes depend only on the primary key (e.g., in `MOBILE_MODEL`, `model_name` and `list_price` depend directly on `model_id`; brand details like `state` and `city` are normalized out into `BRAND`).

### Boyce-Codd Normal Form (BCNF):
- A table is in BCNF if for every functional dependency $X \rightarrow Y$, $X$ is a **superkey**.
- In `SUPPLIER`, both `supplier_id` (PK) and `contact_no` (UNIQUE candidate key) are superkeys.
- Therefore, all tables are in BCNF.

---

## 3. PL/SQL Objects Architecture & Mutating Table Resolution

### 1. Function: `fn_calculate_model_bom_cost(p_model_id)`
- **Signature**: `fn_calculate_model_bom_cost(p_model_id IN VARCHAR2) RETURN NUMBER`
- **Purpose**: Dynamically computes the unit Bill of Materials (BOM) cost by aggregating the product of required quantity and standard component cost:
  $$\text{BOM Cost} = \sum (\text{qty\_req} \times \text{unit\_cost})$$
- **Viva Point**: Rather than duplicating calculated costs in columns, this PL/SQL function guarantees zero data redundancy and real-time consistency whenever parts are added or updated in `REQUIRES`.

---

### 2. Stored Procedure: `sp_record_batch_sale_and_restock_check`
- **Signature**:
  ```sql
  PROCEDURE sp_record_batch_sale_and_restock_check (
      p_sale_id         IN VARCHAR2,
      p_batch_id        IN VARCHAR2,
      p_quantity        IN NUMBER,
      p_sale_date       IN DATE,
      p_recorded_by     IN VARCHAR2,
      o_revenue         OUT NUMBER,
      o_remaining_stock OUT NUMBER,
      o_reorder_alert   OUT VARCHAR2,
      o_message         OUT VARCHAR2
  )
  ```
- **How it Works**:
  1. Validates $p\_quantity > 0$.
  2. Queries batch production capacity and model list price.
  3. Queries prior sales to compute $\text{available\_stock} = \text{production\_qty} - \sum(\text{sold\_quantity})$.
  4. If $p\_quantity > \text{available\_stock}$, executes `RAISE_APPLICATION_ERROR(-20001, '...')`.
  5. Auto-generates sale ID via sequence `SEQ_SALE_ID` if passed as `'AUTO'`.
  6. Inserts into `SALE` table.
  7. Computes invoice revenue ($p\_quantity \times \text{list\_price}$) and remaining stock.
  8. Evaluates reorder alert condition ($\text{remaining\_stock} \le \text{reorder\_level}$). If true, sets `o_reorder_alert := 'Y'`.
  9. Creates an audit record in `SALE_AUDIT`.
  10. Returns all values to the Python backend via **OUT parameters** (consumed with `cursor.var()` in `python-oracledb`).

---

### 3. Compound Trigger: `trg_validate_and_audit_batch_sale`
#### The Problem: Mutating Table Error (`ORA-04091`)
In classical Oracle row-level triggers (`BEFORE INSERT FOR EACH ROW ON SALE`), if the trigger body runs:
```sql
SELECT NVL(SUM(quantity), 0) FROM SALE WHERE batch_id = :NEW.batch_id;
```
Oracle raises **`ORA-04091: table SALE is mutating, trigger/function may not see it`**. This occurs because the row-level trigger is trying to query the very table that is currently in a state of transition during the multi-row insert.

#### The Solution: Oracle Compound Trigger
A **Compound Trigger** (`FOR INSERT ON SALE COMPOUND TRIGGER`) defines statement-level and row-level timing points within a single declarative block. It eliminates the mutating table check on multi-row statements and ensures thread-safe, consistent reads of existing batch sales while maintaining the **`-20001`** overselling block constraint.

---

## 4. Analysis of the 4 Executive Analytical Queries

### Query 1: Inventory Stock Status & Asset Valuation
- **Objective**: Determine how many units of each batch have been dispatched, how many remain in stock, whether reorder is necessary, and calculate the asset valuation of unsold finished goods.
- **Formulation**:
  $$\text{Inventory Valuation} = \text{remaining\_stock} \times \left(\frac{\text{manufacturing\_cost}}{\text{production\_qty}}\right)$$

---

### Query 2: Model Gross Margin Report
- **Objective**: Evaluate profitability per model by comparing distributor selling price with component hardware BOM cost.
- **Formulation**:
  $$\text{Gross Margin} = \text{list\_price} - \text{fn\_calculate\_model\_bom\_cost}(\text{model\_id})$$
  $$\text{Margin \%} = \left(\frac{\text{Gross Margin}}{\text{list\_price}}\right) \times 100$$

---

### Query 3: Sourcing Efficiency & Lowest Quote Analysis
- **Objective**: Compare internal baseline standard cost against external supplier quotes in `SUPPLIED_BY` to identify potential procurement savings per unit.

---

### Query 4: Brand Financial Performance (The Flaw & The Fix)
#### The Bug in the Naive Query:
The naive query attempted to calculate total brand manufacturing costs using:
```sql
SUM(DISTINCT mb.manufacturing_cost)  -- WRONG!
```
**Why this is mathematically flawed**:
If a brand manufactures two different batches that happen to have the exact same manufacturing cost (for example, Batch 1 costs ₹7,400,000 and Batch 2 also costs ₹7,400,000), `DISTINCT` discards one of the batches! The calculated total cost becomes ₹7,400,000 instead of ₹14,800,000, severely distorting brand profits.

#### The Corrected CTE Solution:
The corrected query aggregates batch-level metrics inside a **Common Table Expression (CTE)** first, and then joins it to the Brand and Model tables:
```sql
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
ORDER BY br.brand_id;
```
This guarantees that **every batch is counted exactly once**, preserving data integrity and financial precision.


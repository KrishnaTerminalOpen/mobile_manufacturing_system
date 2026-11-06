-- ============================================================================
-- MOBILE MANUFACTURING SYSTEM - SEED DATA
-- Target Database: Oracle Database 21c XE
-- College DBMS Mini Project - MCA, Manipal Institute of Technology
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. BRANDS
-- ----------------------------------------------------------------------------
INSERT INTO BRAND (brand_id, brand_name, state, city) 
VALUES ('BR01', 'AstraTech Mobile', 'Karnataka', 'Bengaluru');

INSERT INTO BRAND (brand_id, brand_name, state, city) 
VALUES ('BR02', 'IndusPhone Corp', 'Maharashtra', 'Pune');

INSERT INTO BRAND (brand_id, brand_name, state, city) 
VALUES ('BR03', 'VegaComm Devices', 'Tamil Nadu', 'Chennai');

INSERT INTO BRAND (brand_id, brand_name, state, city) 
VALUES ('BR04', 'ZenithWave Tech', 'Telangana', 'Hyderabad');

-- ----------------------------------------------------------------------------
-- 2. MOBILE MODELS
-- ----------------------------------------------------------------------------
INSERT INTO MOBILE_MODEL (model_id, brand_id, model_name, launch_year, list_price)
VALUES ('MD101', 'BR01', 'Astra Nova 5G', 2025, 28999.00);

INSERT INTO MOBILE_MODEL (model_id, brand_id, model_name, launch_year, list_price)
VALUES ('MD102', 'BR01', 'Astra Pulse Pro', 2026, 42999.00);

INSERT INTO MOBILE_MODEL (model_id, brand_id, model_name, launch_year, list_price)
VALUES ('MD103', 'BR02', 'Indus K10 Lite', 2025, 16499.00);

INSERT INTO MOBILE_MODEL (model_id, brand_id, model_name, launch_year, list_price)
VALUES ('MD104', 'BR03', 'Vega Max Ultra', 2026, 54999.00);

INSERT INTO MOBILE_MODEL (model_id, brand_id, model_name, launch_year, list_price)
VALUES ('MD105', 'BR04', 'Zenith Air Fold', 2026, 68999.00);

-- ----------------------------------------------------------------------------
-- 3. COMPONENTS
-- ----------------------------------------------------------------------------
INSERT INTO COMPONENT (component_id, component_name, description, unit_cost)
VALUES ('CMP01', 'AMOLED Display 6.7"', '6.7-inch 120Hz FHD+ Flexible AMOLED Panel', 4200.00);

INSERT INTO COMPONENT (component_id, component_name, description, unit_cost)
VALUES ('CMP02', 'OctaCore 4nm SoC', 'Next-gen 4nm 5G Flagship Octa-Core Processor', 6800.00);

INSERT INTO COMPONENT (component_id, component_name, description, unit_cost)
VALUES ('CMP03', 'Li-Po Battery 5000mAh', '5000mAh High Energy Density Cell with 67W fast charge support', 1450.00);

INSERT INTO COMPONENT (component_id, component_name, description, unit_cost)
VALUES ('CMP04', '50MP OIS Camera Sensor', '1/1.56" Custom Primary Camera Sensor with Optical Image Stabilization', 2350.00);

INSERT INTO COMPONENT (component_id, component_name, description, unit_cost)
VALUES ('CMP05', 'LPDDR5X 12GB RAM IC', '12GB High-speed 8533Mbps Low Power DDR5X Module', 2100.00);

-- ----------------------------------------------------------------------------
-- 4. SUPPLIERS
-- ----------------------------------------------------------------------------
INSERT INTO SUPPLIER (supplier_id, supplier_name, city, state, contact_no)
VALUES ('SUP01', 'Bharat Semicon Pvt Ltd', 'Bengaluru', 'Karnataka', '9845011223');

INSERT INTO SUPPLIER (supplier_id, supplier_name, city, state, contact_no)
VALUES ('SUP02', 'Deccan OptoDisplays', 'Hyderabad', 'Telangana', '9849033445');

INSERT INTO SUPPLIER (supplier_id, supplier_name, city, state, contact_no)
VALUES ('SUP03', 'Western PowerCells Ltd', 'Pune', 'Maharashtra', '9822055667');

INSERT INTO SUPPLIER (supplier_id, supplier_name, city, state, contact_no)
VALUES ('SUP04', 'Coromandel MicroTech', 'Chennai', 'Tamil Nadu', '9840077889');

-- ----------------------------------------------------------------------------
-- 5. REQUIRES (Model Bill of Materials - M:N)
-- ----------------------------------------------------------------------------
-- MD101: CMP01 (1), CMP02 (1), CMP03 (1), CMP04 (2)
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD101', 'CMP01', 1);
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD101', 'CMP02', 1);
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD101', 'CMP03', 1);
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD101', 'CMP04', 2);

-- MD102: CMP01 (1), CMP02 (1), CMP04 (3), CMP05 (2)
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD102', 'CMP01', 1);
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD102', 'CMP02', 1);
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD102', 'CMP04', 3);
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD102', 'CMP05', 2);

-- MD103: CMP01 (1), CMP03 (1)
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD103', 'CMP01', 1);
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD103', 'CMP03', 1);

-- MD104: CMP01 (1), CMP02 (1), CMP04 (3), CMP05 (2)
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD104', 'CMP01', 1);
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD104', 'CMP02', 1);
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD104', 'CMP04', 3);
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD104', 'CMP05', 2);

-- MD105: CMP01 (2), CMP02 (1), CMP03 (2), CMP05 (2)
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD105', 'CMP01', 2);
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD105', 'CMP02', 1);
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD105', 'CMP03', 2);
INSERT INTO REQUIRES (model_id, component_id, qty_req) VALUES ('MD105', 'CMP05', 2);

-- ----------------------------------------------------------------------------
-- 6. SUPPLIED_BY (Component Sourcing Matrix - M:N)
-- ----------------------------------------------------------------------------
INSERT INTO SUPPLIED_BY (component_id, supplier_id, supply_cost, availability)
VALUES ('CMP01', 'SUP02', 4050.00, 'In Stock');

INSERT INTO SUPPLIED_BY (component_id, supplier_id, supply_cost, availability)
VALUES ('CMP01', 'SUP04', 4180.00, 'In Stock');

INSERT INTO SUPPLIED_BY (component_id, supplier_id, supply_cost, availability)
VALUES ('CMP02', 'SUP01', 6650.00, 'In Stock');

INSERT INTO SUPPLIED_BY (component_id, supplier_id, supply_cost, availability)
VALUES ('CMP02', 'SUP04', 6790.00, 'Lead Time 7d');

INSERT INTO SUPPLIED_BY (component_id, supplier_id, supply_cost, availability)
VALUES ('CMP03', 'SUP03', 1390.00, 'In Stock');

INSERT INTO SUPPLIED_BY (component_id, supplier_id, supply_cost, availability)
VALUES ('CMP04', 'SUP02', 2280.00, 'In Stock');

-- INSERT INTO COMPONENT_SUPPLIERS:
INSERT INTO SUPPLIED_BY (component_id, supplier_id, supply_cost, availability)
VALUES ('CMP04', 'SUP01', 2340.00, 'In Stock');

INSERT INTO SUPPLIED_BY (component_id, supplier_id, supply_cost, availability)
VALUES ('CMP05', 'SUP01', 2020.00, 'In Stock');

INSERT INTO SUPPLIED_BY (component_id, supplier_id, supply_cost, availability)
VALUES ('CMP05', 'SUP04', 2090.00, 'In Stock');

-- ----------------------------------------------------------------------------
-- 7. MANUFACTURING BATCHES
-- ----------------------------------------------------------------------------
INSERT INTO MANUFACTURING_BATCH (batch_id, model_id, production_date, production_qty, manufacturing_cost, reorder_level)
VALUES ('BCH501', 'MD101', TO_DATE('2026-07-10', 'YYYY-MM-DD'), 500, 7400000.00, 100);

INSERT INTO MANUFACTURING_BATCH (batch_id, model_id, production_date, production_qty, manufacturing_cost, reorder_level)
VALUES ('BCH502', 'MD102', TO_DATE('2026-08-05', 'YYYY-MM-DD'), 300, 6900000.00, 75);

INSERT INTO MANUFACTURING_BATCH (batch_id, model_id, production_date, production_qty, manufacturing_cost, reorder_level)
VALUES ('BCH503', 'MD103', TO_DATE('2026-08-18', 'YYYY-MM-DD'), 800, 7600000.00, 150);

INSERT INTO MANUFACTURING_BATCH (batch_id, model_id, production_date, production_qty, manufacturing_cost, reorder_level)
VALUES ('BCH504', 'MD104', TO_DATE('2026-09-02', 'YYYY-MM-DD'), 250, 7250000.00, 60);

INSERT INTO MANUFACTURING_BATCH (batch_id, model_id, production_date, production_qty, manufacturing_cost, reorder_level)
VALUES ('BCH505', 'MD105', TO_DATE('2026-09-20', 'YYYY-MM-DD'), 180, 6480000.00, 50);

-- ----------------------------------------------------------------------------
-- 8. SALES
-- Note: Inserts will be validated by trg_validate_and_audit_batch_sale
-- ----------------------------------------------------------------------------
INSERT INTO SALE (sale_id, batch_id, quantity, sale_date)
VALUES ('SL901', 'BCH501', 260, TO_DATE('2026-07-25', 'YYYY-MM-DD'));

INSERT INTO SALE (sale_id, batch_id, quantity, sale_date)
VALUES ('SL902', 'BCH501', 165, TO_DATE('2026-08-14', 'YYYY-MM-DD'));

INSERT INTO SALE (sale_id, batch_id, quantity, sale_date)
VALUES ('SL903', 'BCH502', 240, TO_DATE('2026-08-29', 'YYYY-MM-DD'));

INSERT INTO SALE (sale_id, batch_id, quantity, sale_date)
VALUES ('SL904', 'BCH503', 520, TO_DATE('2026-09-10', 'YYYY-MM-DD'));

INSERT INTO SALE (sale_id, batch_id, quantity, sale_date)
VALUES ('SL905', 'BCH504', 205, TO_DATE('2026-09-28', 'YYYY-MM-DD'));

INSERT INTO SALE (sale_id, batch_id, quantity, sale_date)
VALUES ('SL906', 'BCH505', 110, TO_DATE('2026-10-12', 'YYYY-MM-DD'));

-- ----------------------------------------------------------------------------
-- 9. INITIAL SEED FOR SALE_AUDIT
-- ----------------------------------------------------------------------------
INSERT INTO SALE_AUDIT (audit_id, sale_id, batch_id, quantity, sale_date, recorded_by, recorded_at, reorder_alert_fired, remaining_stock)
VALUES ('AUD001', 'SL901', 'BCH501', 260, TO_DATE('2026-07-25', 'YYYY-MM-DD'), 'admin', CURRENT_TIMESTAMP, 'N', 240);

INSERT INTO SALE_AUDIT (audit_id, sale_id, batch_id, quantity, sale_date, recorded_by, recorded_at, reorder_alert_fired, remaining_stock)
VALUES ('AUD002', 'SL902', 'BCH501', 165, TO_DATE('2026-08-14', 'YYYY-MM-DD'), 'manager', CURRENT_TIMESTAMP, 'Y', 75);

INSERT INTO SALE_AUDIT (audit_id, sale_id, batch_id, quantity, sale_date, recorded_by, recorded_at, reorder_alert_fired, remaining_stock)
VALUES ('AUD003', 'SL903', 'BCH502', 240, TO_DATE('2026-08-29', 'YYYY-MM-DD'), 'admin', CURRENT_TIMESTAMP, 'Y', 60);

INSERT INTO SALE_AUDIT (audit_id, sale_id, batch_id, quantity, sale_date, recorded_by, recorded_at, reorder_alert_fired, remaining_stock)
VALUES ('AUD004', 'SL904', 'BCH503', 520, TO_DATE('2026-09-10', 'YYYY-MM-DD'), 'manager', CURRENT_TIMESTAMP, 'N', 280);

INSERT INTO SALE_AUDIT (audit_id, sale_id, batch_id, quantity, sale_date, recorded_by, recorded_at, reorder_alert_fired, remaining_stock)
VALUES ('AUD005', 'SL905', 'BCH504', 205, TO_DATE('2026-09-28', 'YYYY-MM-DD'), 'admin', CURRENT_TIMESTAMP, 'Y', 45);

INSERT INTO SALE_AUDIT (audit_id, sale_id, batch_id, quantity, sale_date, recorded_by, recorded_at, reorder_alert_fired, remaining_stock)
VALUES ('AUD006', 'SL906', 'BCH505', 110, TO_DATE('2026-10-12', 'YYYY-MM-DD'), 'manager', CURRENT_TIMESTAMP, 'N', 70);

-- ----------------------------------------------------------------------------
-- 10. APP USERS (Roles: ADMIN, MANAGER, VIEWER)
-- Passwords:
--   admin    -> admin123
--   manager  -> manager123
--   viewer   -> viewer123
-- ----------------------------------------------------------------------------
INSERT INTO APP_USER (user_id, username, password_hash, role, full_name, created_at)
VALUES ('USR01', 'admin', '$2b$12$cGBQTb2.Kw.pdkKORPO3t.4XRi/n/F2viHIwcbvbrBI5XGptwNV6e', 'ADMIN', 'Dr. Arun Kumar (Admin)', SYSDATE);

INSERT INTO APP_USER (user_id, username, password_hash, role, full_name, created_at)
VALUES ('USR02', 'manager', '$2b$12$YrWFyNDjOLiX2GWMj/tJ3em9/Oz4kFILTJ71fPbyJSW.sQG1thRLC', 'MANAGER', 'Priya Sharma (Production Mgr)', SYSDATE);

INSERT INTO APP_USER (user_id, username, password_hash, role, full_name, created_at)
VALUES ('USR03', 'viewer', '$2b$12$arEd2CdzEYylnk3vSBs7UeEwjnMjl5hwWzbuvJ25hhihIFvg4y3X6', 'VIEWER', 'Rohan Verma (Auditor / Guest)', SYSDATE);

COMMIT;

-- ============================================================================
-- MOBILE MANUFACTURING SYSTEM - DATABASE SCHEMA
-- Target Database: Oracle Database 21c XE
-- College DBMS Mini Project - MCA, Manipal Institute of Technology
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DROP EXISTING TABLES AND OBJECTS SAFELY (Reverse Dependency Order)
-- ----------------------------------------------------------------------------
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE SALE_AUDIT CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE SALE CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE SUPPLIED_BY CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE REQUIRES CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE MANUFACTURING_BATCH CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE SUPPLIER CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE COMPONENT CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE MOBILE_MODEL CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE BRAND CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE APP_USER CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/

-- ----------------------------------------------------------------------------
-- 2. SEQUENCES FOR AUTOMATED KEY GENERATION
-- ----------------------------------------------------------------------------
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_BRAND_ID'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
CREATE SEQUENCE SEQ_BRAND_ID START WITH 5 INCREMENT BY 1 NOCACHE;

BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_MODEL_ID'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
CREATE SEQUENCE SEQ_MODEL_ID START WITH 106 INCREMENT BY 1 NOCACHE;

BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_COMPONENT_ID'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
CREATE SEQUENCE SEQ_COMPONENT_ID START WITH 6 INCREMENT BY 1 NOCACHE;

BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_SUPPLIER_ID'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
CREATE SEQUENCE SEQ_SUPPLIER_ID START WITH 5 INCREMENT BY 1 NOCACHE;

BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_BATCH_ID'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
CREATE SEQUENCE SEQ_BATCH_ID START WITH 506 INCREMENT BY 1 NOCACHE;

BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_SALE_ID'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
CREATE SEQUENCE SEQ_SALE_ID START WITH 907 INCREMENT BY 1 NOCACHE;

BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_USER_ID'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
CREATE SEQUENCE SEQ_USER_ID START WITH 4 INCREMENT BY 1 NOCACHE;

BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_AUDIT_ID'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
CREATE SEQUENCE SEQ_AUDIT_ID START WITH 7 INCREMENT BY 1 NOCACHE;

-- ----------------------------------------------------------------------------
-- 3. CORE APPLICATION TABLES
-- ----------------------------------------------------------------------------

-- BRAND: Mobile device brands / manufacturers
CREATE TABLE BRAND (
    brand_id        VARCHAR2(10)    NOT NULL,
    brand_name      VARCHAR2(100)   NOT NULL,
    state           VARCHAR2(50)    NOT NULL,
    city            VARCHAR2(50)    NOT NULL,
    CONSTRAINT pk_brand PRIMARY KEY (brand_id),
    CONSTRAINT uq_brand_name UNIQUE (brand_name)
);

-- MOBILE_MODEL: Phone models produced by brands
CREATE TABLE MOBILE_MODEL (
    model_id        VARCHAR2(10)    NOT NULL,
    brand_id        VARCHAR2(10)    NOT NULL,
    model_name      VARCHAR2(100)   NOT NULL,
    launch_year     NUMBER(4)       NOT NULL,
    list_price      NUMBER(10, 2)   NOT NULL,
    CONSTRAINT pk_mobile_model PRIMARY KEY (model_id),
    CONSTRAINT fk_model_brand FOREIGN KEY (brand_id) 
        REFERENCES BRAND(brand_id) ON DELETE CASCADE,
    CONSTRAINT chk_model_price CHECK (list_price > 0),
    CONSTRAINT chk_model_year CHECK (launch_year >= 2000 AND launch_year <= 2100)
);

-- COMPONENT: Bill of Materials (BOM) components
CREATE TABLE COMPONENT (
    component_id    VARCHAR2(10)    NOT NULL,
    component_name  VARCHAR2(100)   NOT NULL,
    description     VARCHAR2(255),
    unit_cost       NUMBER(10, 2)   NOT NULL,
    CONSTRAINT pk_component PRIMARY KEY (component_id),
    CONSTRAINT chk_component_cost CHECK (unit_cost > 0)
);

-- SUPPLIER: External component suppliers
CREATE TABLE SUPPLIER (
    supplier_id     VARCHAR2(10)    NOT NULL,
    supplier_name   VARCHAR2(100)   NOT NULL,
    city            VARCHAR2(50)    NOT NULL,
    state           VARCHAR2(50)    NOT NULL,
    contact_no      VARCHAR2(20)    NOT NULL,
    CONSTRAINT pk_supplier PRIMARY KEY (supplier_id),
    CONSTRAINT uq_supplier_contact UNIQUE (contact_no)
);

-- MANUFACTURING_BATCH: Production runs for models
CREATE TABLE MANUFACTURING_BATCH (
    batch_id            VARCHAR2(10)    NOT NULL,
    model_id            VARCHAR2(10)    NOT NULL,
    production_date     DATE            NOT NULL,
    production_qty      NUMBER(8)       NOT NULL,
    manufacturing_cost  NUMBER(14, 2)   NOT NULL,
    reorder_level       NUMBER(8)       NOT NULL,
    CONSTRAINT pk_mfg_batch PRIMARY KEY (batch_id),
    CONSTRAINT fk_batch_model FOREIGN KEY (model_id) 
        REFERENCES MOBILE_MODEL(model_id) ON DELETE CASCADE,
    CONSTRAINT chk_batch_qty CHECK (production_qty > 0),
    CONSTRAINT chk_batch_cost CHECK (manufacturing_cost > 0),
    CONSTRAINT chk_batch_reorder CHECK (reorder_level >= 0)
);

-- SALE: Batch sales to distributors / retailers
CREATE TABLE SALE (
    sale_id         VARCHAR2(10)    NOT NULL,
    batch_id        VARCHAR2(10)    NOT NULL,
    quantity        NUMBER(8)       NOT NULL,
    sale_date       DATE            NOT NULL,
    CONSTRAINT pk_sale PRIMARY KEY (sale_id),
    CONSTRAINT fk_sale_batch FOREIGN KEY (batch_id) 
        REFERENCES MANUFACTURING_BATCH(batch_id) ON DELETE CASCADE,
    CONSTRAINT chk_sale_quantity CHECK (quantity > 0)
);

-- REQUIRES: Model BOM definition (M:N relationship between Model and Component)
CREATE TABLE REQUIRES (
    model_id        VARCHAR2(10)    NOT NULL,
    component_id    VARCHAR2(10)    NOT NULL,
    qty_req         NUMBER(4)       NOT NULL,
    CONSTRAINT pk_requires PRIMARY KEY (model_id, component_id),
    CONSTRAINT fk_requires_model FOREIGN KEY (model_id) 
        REFERENCES MOBILE_MODEL(model_id) ON DELETE CASCADE,
    CONSTRAINT fk_requires_component FOREIGN KEY (component_id) 
        REFERENCES COMPONENT(component_id) ON DELETE CASCADE,
    CONSTRAINT chk_qty_req CHECK (qty_req > 0)
);

-- SUPPLIED_BY: Component sourcing matrix (M:N between Component and Supplier)
CREATE TABLE SUPPLIED_BY (
    component_id    VARCHAR2(10)    NOT NULL,
    supplier_id     VARCHAR2(10)    NOT NULL,
    supply_cost     NUMBER(10, 2)   NOT NULL,
    availability    VARCHAR2(50)    NOT NULL,
    CONSTRAINT pk_supplied_by PRIMARY KEY (component_id, supplier_id),
    CONSTRAINT fk_supplied_component FOREIGN KEY (component_id) 
        REFERENCES COMPONENT(component_id) ON DELETE CASCADE,
    CONSTRAINT fk_supplied_supplier FOREIGN KEY (supplier_id) 
        REFERENCES SUPPLIER(supplier_id) ON DELETE CASCADE,
    CONSTRAINT chk_supply_cost CHECK (supply_cost > 0)
);

-- APP_USER: User accounts for role-based authentication
CREATE TABLE APP_USER (
    user_id         VARCHAR2(10)    NOT NULL,
    username        VARCHAR2(50)    NOT NULL,
    password_hash   VARCHAR2(255)   NOT NULL,
    role            VARCHAR2(20)    NOT NULL,
    full_name       VARCHAR2(100)   NOT NULL,
    created_at      DATE            DEFAULT SYSDATE,
    CONSTRAINT pk_app_user PRIMARY KEY (user_id),
    CONSTRAINT uq_app_username UNIQUE (username),
    CONSTRAINT chk_user_role CHECK (role IN ('ADMIN', 'MANAGER', 'VIEWER'))
);

-- SALE_AUDIT: Comprehensive audit trail for batch sales & reorder triggers
CREATE TABLE SALE_AUDIT (
    audit_id            VARCHAR2(10)    NOT NULL,
    sale_id             VARCHAR2(10)    NOT NULL,
    batch_id            VARCHAR2(10)    NOT NULL,
    quantity            NUMBER(8)       NOT NULL,
    sale_date           DATE            NOT NULL,
    recorded_by         VARCHAR2(50)    NOT NULL,
    recorded_at         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reorder_alert_fired VARCHAR2(1)     DEFAULT 'N',
    remaining_stock     NUMBER(8),
    CONSTRAINT pk_sale_audit PRIMARY KEY (audit_id),
    CONSTRAINT chk_reorder_fired CHECK (reorder_alert_fired IN ('Y', 'N'))
);

-- ----------------------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX idx_model_brand ON MOBILE_MODEL(brand_id);
CREATE INDEX idx_batch_model ON MANUFACTURING_BATCH(model_id);
CREATE INDEX idx_sale_batch ON SALE(batch_id);
CREATE INDEX idx_requires_comp ON REQUIRES(component_id);
CREATE INDEX idx_supplied_supp ON SUPPLIED_BY(supplier_id);
CREATE INDEX idx_audit_sale ON SALE_AUDIT(sale_id);
CREATE INDEX idx_audit_batch ON SALE_AUDIT(batch_id);

import logging
import sqlite3
import oracledb
from typing import Any, Optional, Dict, List
from .config import settings

logger = logging.getLogger("mms_database")
logging.basicConfig(level=logging.INFO)

class DatabaseManager:
    def __init__(self):
        self.oracle_pool: Optional[oracledb.ConnectionPool] = None
        self.is_oracle_active: bool = False
        self.engine_name: str = "Oracle Database 21c XE (Pending Init)"
        self.fallback_conn: Optional[sqlite3.Connection] = None

    def initialize(self):
        """Attempt connecting to Oracle 21c XE; fallback to shadow engine if offline."""
        try:
            logger.info("Connecting to Oracle Database 21c XE via python-oracledb (thin mode)...")
            logger.info(f"Target DSN: {settings.DB_DSN}, User: {settings.DB_USER}")
            
            # oracledb runs in thin mode by default in v2+
            self.oracle_pool = oracledb.create_pool(
                user=settings.DB_USER,
                password=settings.DB_PASSWORD,
                dsn=settings.DB_DSN,
                min=settings.DB_POOL_MIN,
                max=settings.DB_POOL_MAX,
                increment=settings.DB_POOL_INCREMENT,
                timeout=5
            )
            self.is_oracle_active = True
            self.engine_name = "Oracle Database 21c XE (Live Connection Pool)"
            logger.info("Successfully connected to Oracle Database 21c XE.")
        except Exception as e:
            logger.warning(f"Could not connect to Oracle XE ({e}).")
            if settings.USE_FALLBACK_IF_ORACLE_OFFLINE:
                logger.info("Initializing high-fidelity Oracle Shadow Engine for demonstration and testing...")
                self._init_shadow_engine()
                self.is_oracle_active = False
                self.engine_name = "Oracle Shadow Engine (Demo Mode - Simulating PL/SQL & Triggers)"
            else:
                raise e

    def _init_shadow_engine(self):
        """Initialize an in-memory database pre-seeded with the exact project data and constraints."""
        conn = sqlite3.connect(":memory:", check_same_thread=False)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # Schema creation
        cur.executescript("""
        CREATE TABLE BRAND (
            brand_id VARCHAR(10) PRIMARY KEY,
            brand_name VARCHAR(100) UNIQUE NOT NULL,
            state VARCHAR(50) NOT NULL,
            city VARCHAR(50) NOT NULL
        );

        CREATE TABLE MOBILE_MODEL (
            model_id VARCHAR(10) PRIMARY KEY,
            brand_id VARCHAR(10) NOT NULL REFERENCES BRAND(brand_id) ON DELETE CASCADE,
            model_name VARCHAR(100) NOT NULL,
            launch_year INTEGER NOT NULL,
            list_price DECIMAL(10,2) NOT NULL CHECK(list_price > 0)
        );

        CREATE TABLE COMPONENT (
            component_id VARCHAR(10) PRIMARY KEY,
            component_name VARCHAR(100) NOT NULL,
            description VARCHAR(255),
            unit_cost DECIMAL(10,2) NOT NULL CHECK(unit_cost > 0)
        );

        CREATE TABLE SUPPLIER (
            supplier_id VARCHAR(10) PRIMARY KEY,
            supplier_name VARCHAR(100) NOT NULL,
            city VARCHAR(50) NOT NULL,
            state VARCHAR(50) NOT NULL,
            contact_no VARCHAR(20) UNIQUE NOT NULL
        );

        CREATE TABLE MANUFACTURING_BATCH (
            batch_id VARCHAR(10) PRIMARY KEY,
            model_id VARCHAR(10) NOT NULL REFERENCES MOBILE_MODEL(model_id) ON DELETE CASCADE,
            production_date DATE NOT NULL,
            production_qty INTEGER NOT NULL CHECK(production_qty > 0),
            manufacturing_cost DECIMAL(14,2) NOT NULL CHECK(manufacturing_cost > 0),
            reorder_level INTEGER NOT NULL CHECK(reorder_level >= 0)
        );

        CREATE TABLE SALE (
            sale_id VARCHAR(10) PRIMARY KEY,
            batch_id VARCHAR(10) NOT NULL REFERENCES MANUFACTURING_BATCH(batch_id) ON DELETE CASCADE,
            quantity INTEGER NOT NULL CHECK(quantity > 0),
            sale_date DATE NOT NULL
        );

        CREATE TABLE REQUIRES (
            model_id VARCHAR(10) NOT NULL REFERENCES MOBILE_MODEL(model_id) ON DELETE CASCADE,
            component_id VARCHAR(10) NOT NULL REFERENCES COMPONENT(component_id) ON DELETE CASCADE,
            qty_req INTEGER NOT NULL CHECK(qty_req > 0),
            PRIMARY KEY (model_id, component_id)
        );

        CREATE TABLE SUPPLIED_BY (
            component_id VARCHAR(10) NOT NULL REFERENCES COMPONENT(component_id) ON DELETE CASCADE,
            supplier_id VARCHAR(10) NOT NULL REFERENCES SUPPLIER(supplier_id) ON DELETE CASCADE,
            supply_cost DECIMAL(10,2) NOT NULL CHECK(supply_cost > 0),
            availability VARCHAR(50) NOT NULL,
            PRIMARY KEY (component_id, supplier_id)
        );

        CREATE TABLE APP_USER (
            user_id VARCHAR(10) PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL CHECK(role IN ('ADMIN', 'MANAGER', 'VIEWER')),
            full_name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE SALE_AUDIT (
            audit_id VARCHAR(10) PRIMARY KEY,
            sale_id VARCHAR(10) NOT NULL,
            batch_id VARCHAR(10) NOT NULL,
            quantity INTEGER NOT NULL,
            sale_date DATE NOT NULL,
            recorded_by VARCHAR(50) NOT NULL,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            reorder_alert_fired VARCHAR(1) DEFAULT 'N',
            remaining_stock INTEGER
        );

        -- Sequences state table for shadow generator
        CREATE TABLE DB_SEQUENCES (
            seq_name VARCHAR(50) PRIMARY KEY,
            current_val INTEGER NOT NULL
        );
        INSERT INTO DB_SEQUENCES VALUES ('SEQ_BRAND_ID', 4);
        INSERT INTO DB_SEQUENCES VALUES ('SEQ_MODEL_ID', 105);
        INSERT INTO DB_SEQUENCES VALUES ('SEQ_COMPONENT_ID', 5);
        INSERT INTO DB_SEQUENCES VALUES ('SEQ_SUPPLIER_ID', 4);
        INSERT INTO DB_SEQUENCES VALUES ('SEQ_BATCH_ID', 505);
        INSERT INTO DB_SEQUENCES VALUES ('SEQ_SALE_ID', 906);
        INSERT INTO DB_SEQUENCES VALUES ('SEQ_USER_ID', 3);
        INSERT INTO DB_SEQUENCES VALUES ('SEQ_AUDIT_ID', 6);
        """)

        # Insert exact seed data
        cur.executescript("""
        INSERT INTO BRAND VALUES ('BR01', 'AstraTech Mobile', 'Karnataka', 'Bengaluru');
        INSERT INTO BRAND VALUES ('BR02', 'IndusPhone Corp', 'Maharashtra', 'Pune');
        INSERT INTO BRAND VALUES ('BR03', 'VegaComm Devices', 'Tamil Nadu', 'Chennai');
        INSERT INTO BRAND VALUES ('BR04', 'ZenithWave Tech', 'Telangana', 'Hyderabad');

        INSERT INTO MOBILE_MODEL VALUES ('MD101', 'BR01', 'Astra Nova 5G', 2025, 28999.00);
        INSERT INTO MOBILE_MODEL VALUES ('MD102', 'BR01', 'Astra Pulse Pro', 2026, 42999.00);
        INSERT INTO MOBILE_MODEL VALUES ('MD103', 'BR02', 'Indus K10 Lite', 2025, 16499.00);
        INSERT INTO MOBILE_MODEL VALUES ('MD104', 'BR03', 'Vega Max Ultra', 2026, 54999.00);
        INSERT INTO MOBILE_MODEL VALUES ('MD105', 'BR04', 'Zenith Air Fold', 2026, 68999.00);

        INSERT INTO COMPONENT VALUES ('CMP01', 'AMOLED Display 6.7"', '6.7-inch 120Hz FHD+ Flexible AMOLED Panel', 4200.00);
        INSERT INTO COMPONENT VALUES ('CMP02', 'OctaCore 4nm SoC', 'Next-gen 4nm 5G Flagship Octa-Core Processor', 6800.00);
        INSERT INTO COMPONENT VALUES ('CMP03', 'Li-Po Battery 5000mAh', '5000mAh High Energy Density Cell with 67W fast charge support', 1450.00);
        INSERT INTO COMPONENT VALUES ('CMP04', '50MP OIS Camera Sensor', '1/1.56" Custom Primary Camera Sensor with Optical Image Stabilization', 2350.00);
        INSERT INTO COMPONENT VALUES ('CMP05', 'LPDDR5X 12GB RAM IC', '12GB High-speed 8533Mbps Low Power DDR5X Module', 2100.00);

        INSERT INTO SUPPLIER VALUES ('SUP01', 'Bharat Semicon Pvt Ltd', 'Bengaluru', 'Karnataka', '9845011223');
        INSERT INTO SUPPLIER VALUES ('SUP02', 'Deccan OptoDisplays', 'Hyderabad', 'Telangana', '9849033445');
        INSERT INTO SUPPLIER VALUES ('SUP03', 'Western PowerCells Ltd', 'Pune', 'Maharashtra', '9822055667');
        INSERT INTO SUPPLIER VALUES ('SUP04', 'Coromandel MicroTech', 'Chennai', 'Tamil Nadu', '9840077889');

        INSERT INTO REQUIRES VALUES ('MD101', 'CMP01', 1);
        INSERT INTO REQUIRES VALUES ('MD101', 'CMP02', 1);
        INSERT INTO REQUIRES VALUES ('MD101', 'CMP03', 1);
        INSERT INTO REQUIRES VALUES ('MD101', 'CMP04', 2);

        INSERT INTO REQUIRES VALUES ('MD102', 'CMP01', 1);
        INSERT INTO REQUIRES VALUES ('MD102', 'CMP02', 1);
        INSERT INTO REQUIRES VALUES ('MD102', 'CMP04', 3);
        INSERT INTO REQUIRES VALUES ('MD102', 'CMP05', 2);

        INSERT INTO REQUIRES VALUES ('MD103', 'CMP01', 1);
        INSERT INTO REQUIRES VALUES ('MD103', 'CMP03', 1);

        INSERT INTO REQUIRES VALUES ('MD104', 'CMP01', 1);
        INSERT INTO REQUIRES VALUES ('MD104', 'CMP02', 1);
        INSERT INTO REQUIRES VALUES ('MD104', 'CMP04', 3);
        INSERT INTO REQUIRES VALUES ('MD104', 'CMP05', 2);

        INSERT INTO REQUIRES VALUES ('MD105', 'CMP01', 2);
        INSERT INTO REQUIRES VALUES ('MD105', 'CMP02', 1);
        INSERT INTO REQUIRES VALUES ('MD105', 'CMP03', 2);
        INSERT INTO REQUIRES VALUES ('MD105', 'CMP05', 2);

        INSERT INTO SUPPLIED_BY VALUES ('CMP01', 'SUP02', 4050.00, 'In Stock');
        INSERT INTO SUPPLIED_BY VALUES ('CMP01', 'SUP04', 4180.00, 'In Stock');
        INSERT INTO SUPPLIED_BY VALUES ('CMP02', 'SUP01', 6650.00, 'In Stock');
        INSERT INTO SUPPLIED_BY VALUES ('CMP02', 'SUP04', 6790.00, 'Lead Time 7d');
        INSERT INTO SUPPLIED_BY VALUES ('CMP03', 'SUP03', 1390.00, 'In Stock');
        INSERT INTO SUPPLIED_BY VALUES ('CMP04', 'SUP02', 2280.00, 'In Stock');
        INSERT INTO SUPPLIED_BY VALUES ('CMP04', 'SUP01', 2340.00, 'In Stock');
        INSERT INTO SUPPLIED_BY VALUES ('CMP05', 'SUP01', 2020.00, 'In Stock');
        INSERT INTO SUPPLIED_BY VALUES ('CMP05', 'SUP04', 2090.00, 'In Stock');

        INSERT INTO MANUFACTURING_BATCH VALUES ('BCH501', 'MD101', '2026-07-10', 500, 7400000.00, 100);
        INSERT INTO MANUFACTURING_BATCH VALUES ('BCH502', 'MD102', '2026-08-05', 300, 6900000.00, 75);
        INSERT INTO MANUFACTURING_BATCH VALUES ('BCH503', 'MD103', '2026-08-18', 800, 7600000.00, 150);
        INSERT INTO MANUFACTURING_BATCH VALUES ('BCH504', 'MD104', '2026-09-02', 250, 7250000.00, 60);
        INSERT INTO MANUFACTURING_BATCH VALUES ('BCH505', 'MD105', '2026-09-20', 180, 6480000.00, 50);

        INSERT INTO SALE VALUES ('SL901', 'BCH501', 260, '2026-07-25');
        INSERT INTO SALE VALUES ('SL902', 'BCH501', 165, '2026-08-14');
        INSERT INTO SALE VALUES ('SL903', 'BCH502', 240, '2026-08-29');
        INSERT INTO SALE VALUES ('SL904', 'BCH503', 520, '2026-09-10');
        INSERT INTO SALE VALUES ('SL905', 'BCH504', 205, '2026-09-28');
        INSERT INTO SALE VALUES ('SL906', 'BCH505', 110, '2026-10-12');

        INSERT INTO SALE_AUDIT VALUES ('AUD001', 'SL901', 'BCH501', 260, '2026-07-25', 'admin', '2026-07-25 10:00:00', 'N', 240);
        INSERT INTO SALE_AUDIT VALUES ('AUD002', 'SL902', 'BCH501', 165, '2026-08-14', 'manager', '2026-08-14 11:30:00', 'Y', 75);
        INSERT INTO SALE_AUDIT VALUES ('AUD003', 'SL903', 'BCH502', 240, '2026-08-29', 'admin', '2026-08-29 15:45:00', 'Y', 60);
        INSERT INTO SALE_AUDIT VALUES ('AUD004', 'SL904', 'BCH503', 520, '2026-09-10', 'manager', '2026-09-10 09:15:00', 'N', 280);
        INSERT INTO SALE_AUDIT VALUES ('AUD005', 'SL905', 'BCH504', 205, '2026-09-28', 'admin', '2026-09-28 14:20:00', 'Y', 45);
        INSERT INTO SALE_AUDIT VALUES ('AUD006', 'SL906', 'BCH505', 110, '2026-10-12', 'manager', '2026-10-12 16:50:00', 'N', 70);

        INSERT INTO APP_USER VALUES ('USR01', 'admin', '$2b$12$cGBQTb2.Kw.pdkKORPO3t.4XRi/n/F2viHIwcbvbrBI5XGptwNV6e', 'ADMIN', 'Dr. Arun Kumar (Admin)', '2026-01-01');
        INSERT INTO APP_USER VALUES ('USR02', 'manager', '$2b$12$YrWFyNDjOLiX2GWMj/tJ3em9/Oz4kFILTJ71fPbyJSW.sQG1thRLC', 'MANAGER', 'Priya Sharma (Production Mgr)', '2026-01-01');
        INSERT INTO APP_USER VALUES ('USR03', 'viewer', '$2b$12$arEd2CdzEYylnk3vSBs7UeEwjnMjl5hwWzbuvJ25hhihIFvg4y3X6', 'VIEWER', 'Rohan Verma (Auditor / Guest)', '2026-01-01');
        """)
        conn.commit()
        self.fallback_conn = conn
        logger.info("Oracle Shadow Engine initialized and populated.")

    def close(self):
        if self.oracle_pool:
            self.oracle_pool.close()
        if self.fallback_conn:
            self.fallback_conn.close()

db_manager = DatabaseManager()

-- ============================================================================
-- MOBILE MANUFACTURING SYSTEM - PL/SQL OBJECTS
-- Target Database: Oracle Database 21c XE
-- College DBMS Mini Project - MCA, Manipal Institute of Technology
-- ============================================================================

SET SERVEROUTPUT ON SIZE UNLIMITED;

-- ----------------------------------------------------------------------------
-- 1. FUNCTION: fn_calculate_model_bom_cost
-- Calculates the total Bill of Materials (BOM) cost for a given mobile model.
-- Cost = SUM(qty_required * standard_unit_cost)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_calculate_model_bom_cost (
    p_model_id IN VARCHAR2
) RETURN NUMBER
IS
    v_total_bom_cost NUMBER(12, 2) := 0;
    v_model_exists   NUMBER := 0;
BEGIN
    -- Verify model exists
    SELECT COUNT(*) INTO v_model_exists
    FROM MOBILE_MODEL
    WHERE model_id = p_model_id;

    IF v_model_exists = 0 THEN
        RAISE_APPLICATION_ERROR(-20002, 'Mobile Model ID ' || p_model_id || ' does not exist.');
    END IF;

    -- Aggregate total cost of all required components
    SELECT NVL(SUM(r.qty_req * c.unit_cost), 0)
    INTO v_total_bom_cost
    FROM REQUIRES r
    JOIN COMPONENT c ON r.component_id = c.component_id
    WHERE r.model_id = p_model_id;

    RETURN v_total_bom_cost;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error in fn_calculate_model_bom_cost: ' || SQLERRM);
        RAISE;
END fn_calculate_model_bom_cost;
/

-- ----------------------------------------------------------------------------
-- 2. HELPER FUNCTION: fn_generate_entity_id
-- Generates formatted IDs (e.g. BR05, MD106, CMP06, SUP05, BCH506, SL907)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_generate_entity_id (
    p_entity_type IN VARCHAR2
) RETURN VARCHAR2
IS
    v_new_id VARCHAR2(20);
BEGIN
    CASE UPPER(p_entity_type)
        WHEN 'BRAND' THEN
            SELECT 'BR' || LPAD(SEQ_BRAND_ID.NEXTVAL, 2, '0') INTO v_new_id FROM DUAL;
        WHEN 'MODEL' THEN
            SELECT 'MD' || TO_CHAR(SEQ_MODEL_ID.NEXTVAL) INTO v_new_id FROM DUAL;
        WHEN 'COMPONENT' THEN
            SELECT 'CMP' || LPAD(SEQ_COMPONENT_ID.NEXTVAL, 2, '0') INTO v_new_id FROM DUAL;
        WHEN 'SUPPLIER' THEN
            SELECT 'SUP' || LPAD(SEQ_SUPPLIER_ID.NEXTVAL, 2, '0') INTO v_new_id FROM DUAL;
        WHEN 'BATCH' THEN
            SELECT 'BCH' || TO_CHAR(SEQ_BATCH_ID.NEXTVAL) INTO v_new_id FROM DUAL;
        WHEN 'SALE' THEN
            SELECT 'SL' || TO_CHAR(SEQ_SALE_ID.NEXTVAL) INTO v_new_id FROM DUAL;
        WHEN 'USER' THEN
            SELECT 'USR' || LPAD(SEQ_USER_ID.NEXTVAL, 2, '0') INTO v_new_id FROM DUAL;
        WHEN 'AUDIT' THEN
            SELECT 'AUD' || LPAD(SEQ_AUDIT_ID.NEXTVAL, 3, '0') INTO v_new_id FROM DUAL;
        ELSE
            RAISE_APPLICATION_ERROR(-20003, 'Invalid entity type for ID generation: ' || p_entity_type);
    END CASE;
    RETURN v_new_id;
END fn_generate_entity_id;
/

-- ----------------------------------------------------------------------------
-- 3. COMPOUND TRIGGER: trg_validate_and_audit_batch_sale
-- Solves mutating table error (ORA-04091) on SALE by using an Oracle compound trigger.
-- Blocks overselling with RAISE_APPLICATION_ERROR(-20001, ...)
-- Displays/logs a reorder alert whenever remaining stock falls <= reorder level.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_validate_and_audit_batch_sale
FOR INSERT ON SALE
COMPOUND TRIGGER

    BEFORE EACH ROW IS
        v_prod_qty       NUMBER;
        v_reorder_level  NUMBER;
        v_total_sold     NUMBER := 0;
        v_current_avail  NUMBER;
        v_post_stock     NUMBER;
    BEGIN
        -- 1. Fetch batch capacity and reorder threshold
        SELECT production_qty, reorder_level
        INTO v_prod_qty, v_reorder_level
        FROM MANUFACTURING_BATCH
        WHERE batch_id = :NEW.batch_id;

        -- 2. Query existing sales for this batch.
        -- In a COMPOUND TRIGGER, querying the triggering table is permitted!
        SELECT NVL(SUM(quantity), 0)
        INTO v_total_sold
        FROM SALE
        WHERE batch_id = :NEW.batch_id;

        v_current_avail := v_prod_qty - v_total_sold;

        -- 3. Block overselling constraint check
        IF :NEW.quantity > v_current_avail THEN
            RAISE_APPLICATION_ERROR(-20001, 
                'Overselling blocked: Requested quantity (' || :NEW.quantity || 
                ') exceeds available stock (' || v_current_avail || 
                ') for Batch ' || :NEW.batch_id || '.');
        END IF;

        -- 4. Check reorder alert condition
        v_post_stock := v_current_avail - :NEW.quantity;
        IF v_post_stock <= v_reorder_level THEN
            DBMS_OUTPUT.PUT_LINE('>>> [REORDER ALERT] Batch ' || :NEW.batch_id || 
                ' remaining stock (' || v_post_stock || 
                ') has reached or fallen below reorder level (' || v_reorder_level || ').');
        END IF;

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20004, 'Batch ID ' || :NEW.batch_id || ' does not exist.');
    END BEFORE EACH ROW;

END trg_validate_and_audit_batch_sale;
/

-- ----------------------------------------------------------------------------
-- 4. STORED PROCEDURE: sp_record_batch_sale_and_restock_check
-- Consumed directly by the backend API via python-oracledb callproc.
-- Uses OUT parameters to return computed invoice revenue, remaining stock,
-- reorder alert flag, and human-friendly status messages.
-- Also logs the transaction to SALE_AUDIT table.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_record_batch_sale_and_restock_check (
    p_sale_id           IN VARCHAR2,
    p_batch_id          IN VARCHAR2,
    p_quantity          IN NUMBER,
    p_sale_date         IN DATE,
    p_recorded_by       IN VARCHAR2,
    o_revenue           OUT NUMBER,
    o_remaining_stock   OUT NUMBER,
    o_reorder_alert     OUT VARCHAR2,
    o_message           OUT VARCHAR2
)
IS
    v_actual_sale_id    VARCHAR2(10);
    v_model_id          VARCHAR2(10);
    v_list_price        NUMBER(10, 2);
    v_production_qty    NUMBER(8);
    v_reorder_level     NUMBER(8);
    v_current_sold      NUMBER(8) := 0;
    v_available_stock   NUMBER(8) := 0;
    v_audit_id          VARCHAR2(10);
BEGIN
    -- Input validations
    IF p_quantity <= 0 THEN
        RAISE_APPLICATION_ERROR(-20005, 'Sale quantity must be greater than zero.');
    END IF;

    -- Fetch batch and model information
    SELECT mb.model_id, mb.production_qty, mb.reorder_level, mm.list_price
    INTO v_model_id, v_production_qty, v_reorder_level, v_list_price
    FROM MANUFACTURING_BATCH mb
    JOIN MOBILE_MODEL mm ON mb.model_id = mm.model_id
    WHERE mb.batch_id = p_batch_id;

    -- Check available stock
    SELECT NVL(SUM(quantity), 0)
    INTO v_current_sold
    FROM SALE
    WHERE batch_id = p_batch_id;

    v_available_stock := v_production_qty - v_current_sold;

    IF p_quantity > v_available_stock THEN
        RAISE_APPLICATION_ERROR(-20001, 
            'Overselling blocked: Requested quantity (' || p_quantity || 
            ') exceeds available stock (' || v_available_stock || 
            ') for Batch ' || p_batch_id || '.');
    END IF;

    -- Generate Sale ID if not provided or set to AUTO
    IF p_sale_id IS NULL OR UPPER(TRIM(p_sale_id)) = 'AUTO' THEN
        SELECT 'SL' || TO_CHAR(SEQ_SALE_ID.NEXTVAL) INTO v_actual_sale_id FROM DUAL;
    ELSE
        v_actual_sale_id := p_sale_id;
    END IF;

    -- Perform the insert into SALE (Trigger will also validate)
    INSERT INTO SALE (sale_id, batch_id, quantity, sale_date)
    VALUES (v_actual_sale_id, p_batch_id, p_quantity, NVL(p_sale_date, SYSDATE));

    -- Calculate financial outputs
    o_revenue := p_quantity * v_list_price;
    o_remaining_stock := v_available_stock - p_quantity;

    -- Check reorder condition
    IF o_remaining_stock <= v_reorder_level THEN
        o_reorder_alert := 'Y';
        o_message := 'Sale ' || v_actual_sale_id || ' recorded successfully. REORDER ALERT: Stock level (' || 
                     o_remaining_stock || ') is at or below threshold (' || v_reorder_level || ').';
    ELSE
        o_reorder_alert := 'N';
        o_message := 'Sale ' || v_actual_sale_id || ' recorded successfully. Remaining stock: ' || 
                     o_remaining_stock || ' units.';
    END IF;

    -- Audit log creation
    SELECT 'AUD' || LPAD(SEQ_AUDIT_ID.NEXTVAL, 3, '0') INTO v_audit_id FROM DUAL;
    INSERT INTO SALE_AUDIT (
        audit_id, sale_id, batch_id, quantity, sale_date, 
        recorded_by, recorded_at, reorder_alert_fired, remaining_stock
    )
    VALUES (
        v_audit_id, v_actual_sale_id, p_batch_id, p_quantity, NVL(p_sale_date, SYSDATE),
        NVL(p_recorded_by, 'system'), CURRENT_TIMESTAMP, o_reorder_alert, o_remaining_stock
    );

    DBMS_OUTPUT.PUT_LINE(o_message);

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20006, 'Invalid Batch ID ' || p_batch_id || '. Record not found.');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error in sp_record_batch_sale_and_restock_check: ' || SQLERRM);
        RAISE;
END sp_record_batch_sale_and_restock_check;
/

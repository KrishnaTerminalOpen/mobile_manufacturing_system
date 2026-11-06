-- ============================================================================
-- MASTER INITIALIZATION SCRIPT FOR ORACLE DATABASE 21c XE
-- Usage in SQL*Plus or SQLcl:
--   SQL> @database/init.sql
-- ============================================================================

PROMPT ====================================================================
PROMPT Step 1: Executing Schema Definitions (Tables, Constraints, Sequences)
PROMPT ====================================================================
@@schema.sql

PROMPT ====================================================================
PROMPT Step 2: Compiling PL/SQL Objects (Functions, Procedures, Triggers)
PROMPT ====================================================================
@@plsql.sql

PROMPT ====================================================================
PROMPT Step 3: Inserting Seed Data
PROMPT ====================================================================
@@seed.sql

PROMPT ====================================================================
PROMPT Initialization Completed Successfully!
PROMPT ====================================================================

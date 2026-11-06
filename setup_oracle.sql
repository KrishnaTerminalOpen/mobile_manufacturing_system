ALTER SESSION SET CONTAINER = XEPDB1;

-- Create user if not exists or alter password
BEGIN
    EXECUTE IMMEDIATE 'DROP USER mms_user CASCADE';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/

CREATE USER mms_user IDENTIFIED BY mms_password DEFAULT TABLESPACE USERS QUOTA UNLIMITED ON USERS;

GRANT CONNECT, RESOURCE TO mms_user;
GRANT CREATE SESSION TO mms_user;
GRANT CREATE TABLE TO mms_user;
GRANT CREATE VIEW TO mms_user;
GRANT CREATE PROCEDURE TO mms_user;
GRANT CREATE SEQUENCE TO mms_user;
GRANT CREATE TRIGGER TO mms_user;
GRANT UNLIMITED TABLESPACE TO mms_user;

DISCONNECT;

-- Now connect as mms_user in XEPDB1 and run schema, plsql, and seed
CONNECT mms_user/mms_password@localhost:1521/XEPDB1;

@database/schema.sql
@database/plsql.sql
@database/seed.sql

COMMIT;

PROMPT All Oracle database objects and seed data loaded successfully!
EXIT;

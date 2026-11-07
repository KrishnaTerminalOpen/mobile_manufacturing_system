# Mobile Manufacturing System (MMS)
### College DBMS Mini Project • MCA, Manipal Institute of Technology (MIT)

A full-stack, enterprise-grade manufacturing and supply-chain web application built on top of **Oracle Database 21c XE**, featuring **PL/SQL Stored Procedures, Functions, Compound Triggers, and Analytical Reports**.

---

## 🌟 Tech Stack
- **Database**: Oracle Database 21c XE (Pluggable Database: `XEPDB1`)
- **Backend**: Python 3.12+ with FastAPI, `python-oracledb` (thin mode), Connection Pooling, Pydantic validation, JWT Authentication, and CORS.
- **Frontend**: React + Vite, Tailwind CSS, Lucide Icons, Recharts for data visualization, React Router, Axios.

---

## 📂 Project Architecture

```
mobile-manufacturing-system/
├── database/
│   ├── schema.sql         # 10 Tables, Constraints, Indexes, Sequences
│   ├── plsql.sql          # BOM Function, Stored Procedure (OUT params), Compound Trigger
│   ├── seed.sql           # Canonical seed data (Brands, Models, Batches, Sales, BOM, Suppliers)
│   └── init.sql           # Master SQL*Plus execution script (@init.sql)
├── backend/
│   ├── app/
│   │   ├── config.py      # Environment configuration
│   │   ├── database.py    # Oracle Connection Pool + Shadow Engine fallback
│   │   ├── main.py        # FastAPI app & lifespan manager
│   │   ├── models/        # Pydantic schemas
│   │   ├── routers/       # Endpoints: auth, brands, models, batches, sales, reports, etc.
│   │   └── services/      # Oracle PL/SQL callproc/callfunc wrappers
│   ├── requirements.txt   # Python dependencies
│   ├── test_suite.py      # Automated backend testing script
│   └── verify_api.py      # End-to-end API verification suite
├── frontend/
│   ├── src/
│   │   ├── components/    # Navbar, Sidebar, ConfirmModal, LoadingSkeleton, EmptyState
│   │   ├── context/       # AuthContext, ThemeContext (Dark/Light), ToastContext
│   │   ├── pages/         # Dashboard, Brands, Models, Components, Suppliers,
│   │   │                  # SourcingMatrix, CostOptimizer, Batches, RecordSale,
│   │   │                  # SalesHistory, Reports, DBExplorer, AuditLog
│   │   ├── services/api.js# Axios client with JWT interceptor & ORA error mapper
│   │   └── App.jsx        # Protected routes & navigation
│   ├── package.json
│   └── vite.config.js     # Reverse proxy to backend
├── docker-compose.yml     # Oracle XE 21c Slim container configuration
├── setup_oracle.sql       # Automation script for local Oracle XE user & schema setup
├── .env.example           # Environment template
├── VIVA_NOTES.md          # Comprehensive viva reference & schema theory
└── README.md              # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Database Setup (Choose Option A or Option B)

#### Option A: Local Oracle Database 21c XE (Recommended)
If Oracle Database 21c XE is installed locally:
1. Open PowerShell / Command Prompt as Administrator in the project directory.
2. Run the automated setup script with SQL*Plus:
   ```powershell
   "@setup_oracle.sql" | sqlplus "/ as sysdba"
   ```
   *This creates the `mms_user` (password: `mms_password`) inside pluggable database `XEPDB1`, grants all privileges, and loads `schema.sql`, `plsql.sql`, and `seed.sql`.*

#### Option B: Docker Container (gvenzl/oracle-xe:21-slim)
If running via Docker:
1. Start the container:
   ```bash
   docker compose up -d
   ```
2. Wait for the database container to become healthy (`docker compose ps`).
3. Connect using `mms_user` / `mms_password` on `localhost:1521/XEPDB1`.

---

### 2. Backend Setup (FastAPI)

1. Open a terminal in the project root:
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Verify configuration in `.env` (already pre-configured):
   ```env
   DB_USER=mms_user
   DB_PASSWORD=mms_password
   DB_DSN=localhost:1521/XEPDB1
   DB_POOL_MIN=2
   DB_POOL_MAX=10
   JWT_SECRET_KEY=manipal-mit-mca-dbms-mobile-manufacturing-secret-key-2026
   USE_FALLBACK_IF_ORACLE_OFFLINE=true
   ```
3. Run the automated test suite to verify Oracle connection and PL/SQL execution:
   ```bash
   python backend/test_suite.py
   ```
4. Start the FastAPI development server:
   ```bash
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - OpenAPI Swagger Docs: `http://127.0.0.1:8000/docs`
   - Health Check: `http://127.0.0.1:8000/api/health`

---

### 3. Frontend Setup (React + Vite + Tailwind CSS)

1. Open a new terminal in the `frontend` directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## 🔑 Default Login Credentials

The system implements Role-Based Access Control (**RBAC**). The login screen includes **1-Click Quick Login** buttons for easy demonstration during vivas:

| Role | Username | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `admin123` | Full Access (Master Data, Batches, Sales, Reports, DB Explorer, **Audit Trail**, User Management) |
| **MANAGER** | `manager` | `manager123` | Operational Access (Create/Edit Batches, Record Sales, BOM, Cost Optimizer; no deletes or audit) |
| **VIEWER** | `viewer` | `viewer123` | Read-only Access (Dashboard, Inquiries, Reports; cannot modify data) |

---

## 🧩 Feature-to-Module Mapping

| Module | UI View / Route | Oracle DBMS Objects & Logic Used | Key Functionality |
| :--- | :--- | :--- | :--- |
| **Auth** | `/login` | `APP_USER` table, bcrypt password verification | JWT token authentication, role validation, 1-click test login buttons. |
| **Dashboard** | `/` | Aggregates on `SALE`, `MANUFACTURING_BATCH`, `BRAND` | 8 KPI cards, revenue by brand (bar), monthly sales (line), stock status (stacked bar), BOM vs list price (grouped bar), critical reorder banner in red. |
| **Module 1** | `/brands`, `/models`, `/components` | `BRAND`, `MOBILE_MODEL`, `COMPONENT`, `REQUIRES` | Searchable/sortable tables, FK-safe deletes, live BOM editor on Model Detail, per-unit BOM cost via `fn_calculate_model_bom_cost`. |
| **Module 2** | `/suppliers`, `/sourcing-matrix`, `/cost-optimizer` | `SUPPLIER`, `SUPPLIED_BY` (M:N) | Contact number uniqueness, 2D cross-tab matrix highlighting cheapest quotes, Cost Optimizer calculating batch-level procurement savings. |
| **Module 3** | `/batches`, `/batches/:id`, `/inventory` | `MANUFACTURING_BATCH`, `SALE` | Batch creation, depletion progress bar, status badge (OPTIMAL / REORDER IMMEDIATELY), remaining stock timeline, Query 1 inventory valuation with CSV export. |
| **Module 4** | `/record-sale`, `/sales-history`, `/reports` | `sp_record_batch_sale_and_restock_check`, `trg_validate_and_audit_batch_sale` | Live stock check, oversell prevention with friendly `ORA-20001` toast error, reorder alerts, Query 1–4 reports with CSV export. |
| **DBMS Explorer** | `/db-explorer` | Oracle Schema Metadata, PL/SQL Source dictionary | Relational schema viewer, syntax-highlighted PL/SQL code, **Live Oversell Trigger Tester**, read-only SQL Runner with execution timer. |
| **Audit Trail** | `/audit-log` | `SALE_AUDIT` table (written by PL/SQL procedure) | Admin-only compliance ledger tracking user attribution, timestamps, quantity, remaining stock, and threshold alerts. |

---

## 🧪 Testing Key Test Cases

1. **Test BOM Cost Calculation**: Open `MD101 (Astra Nova 5G)` at `/models/MD101`. Notice BOM cost is ₹17,150.00. Add 1 more `AMOLED Display (CMP01)` — BOM cost immediately recalculates to ₹21,350.00 via Oracle function.
2. **Test Overselling Blocked**: Go to `/db-explorer` -> **Trigger Live Tester** and click **Execute Oversell Attempt** (or try selling 500 units from Batch `BCH504` in `/record-sale`). Oracle Compound Trigger blocks the insert and displays a friendly toast: `Overselling blocked: Requested quantity (500) exceeds available stock (45) for Batch BCH504 (ORA-20001)`.
3. **Test Reorder Alert**: Go to `/record-sale`, pick Batch `BCH505` (70 units left, reorder level 50), record a sale of 30 units. The sale succeeds, remaining stock falls to 40, and an amber alert banner pops up indicating the reorder limit has been breached.
4. **Test Brand Financial Performance (Query 4 Fix)**: Go to `/reports` -> Tab 4. Verify that each batch is aggregated cleanly via the CTE without collapsing identical manufacturing costs.


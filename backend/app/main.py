from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .database import db_manager
from .routers import (
    auth,
    brands,
    models,
    components,
    suppliers,
    requires,
    supplied_by,
    batches,
    sales,
    sourcing,
    reports,
    dashboard,
    audit,
    db_explorer
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database Pool
    db_manager.initialize()
    yield
    # Shutdown: Close Pool
    db_manager.close()

app = FastAPI(
    title="Mobile Manufacturing System API",
    description="College DBMS Mini Project (MCA, Manipal Institute of Technology) - Oracle Database 21c XE",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(brands.router)
app.include_router(models.router)
app.include_router(components.router)
app.include_router(suppliers.router)
app.include_router(requires.router)
app.include_router(supplied_by.router)
app.include_router(batches.router)
app.include_router(sales.router)
app.include_router(sourcing.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(audit.router)
app.include_router(db_explorer.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "system": "Mobile Manufacturing System",
        "database_engine": db_manager.engine_name,
        "oracle_connected": db_manager.is_oracle_active
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)


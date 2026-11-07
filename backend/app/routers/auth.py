from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Dict, Any
from ..models.schemas import LoginRequest, TokenResponse, UserOut, UserCreate
from ..services.auth_service import verify_password, hash_password, create_access_token, get_current_user, require_admin
from ..services.db_service import DBService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    user = DBService.query_one(
        "SELECT user_id, username, password_hash, role, full_name FROM APP_USER WHERE username = :u",
        {"u": payload.username.strip().lower()}
    )
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    token = create_access_token(data={
        "sub": user["username"],
        "user_id": user["user_id"],
        "role": user["role"],
        "full_name": user["full_name"]
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "username": user["username"],
            "role": user["role"],
            "full_name": user["full_name"]
        }
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    user = DBService.query_one(
        "SELECT user_id, username, role, full_name, created_at FROM APP_USER WHERE user_id = :uid",
        {"uid": current_user["user_id"]}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/users", response_model=List[UserOut])
def list_users(_: Dict[str, Any] = Depends(require_admin)):
    return DBService.query(
        "SELECT user_id, username, role, full_name, created_at FROM APP_USER ORDER BY user_id"
    )

@router.post("/users", response_model=UserOut)
def create_user(payload: UserCreate, _: Dict[str, Any] = Depends(require_admin)):
    existing = DBService.query_one("SELECT 1 FROM APP_USER WHERE username = :u", {"u": payload.username.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_id = DBService.generate_id("USER")
    pwd_hash = hash_password(payload.password)
    DBService.execute(
        "INSERT INTO APP_USER (user_id, username, password_hash, role, full_name) VALUES (:id, :u, :p, :r, :f)",
        {"id": user_id, "u": payload.username.lower(), "p": pwd_hash, "r": payload.role, "f": payload.full_name}
    )
    return {
        "user_id": user_id,
        "username": payload.username.lower(),
        "role": payload.role,
        "full_name": payload.full_name,
        "created_at": None
    }


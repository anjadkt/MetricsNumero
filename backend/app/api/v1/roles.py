from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.auth import RoleCreate, RoleOut
from app.services import crud_auth

router = APIRouter(prefix="/roles", tags=["Roles"])

@router.get("", response_model=List[RoleOut])
def read_roles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_auth.get_roles(db, skip=skip, limit=limit)

@router.post("", response_model=RoleOut)
def create_role(role: RoleCreate, db: Session = Depends(get_db)):
    return crud_auth.create_role(db, role=role)

@router.put("/{role_id}", response_model=RoleOut)
def update_role(role_id: int, role: RoleCreate, db: Session = Depends(get_db)):
    return crud_auth.update_role(db, role_id=role_id, role=role)

@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    crud_auth.delete_role(db, role_id=role_id)
    return {"message": "Role deleted successfully"}

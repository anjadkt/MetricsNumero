from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.auth import PermissionCreate, PermissionOut
from app.services import crud_auth

router = APIRouter(prefix="/permissions", tags=["Permissions"])

@router.get("", response_model=List[PermissionOut])
def read_permissions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_auth.get_permissions(db, skip=skip, limit=limit)

@router.post("", response_model=PermissionOut)
def create_permission(permission: PermissionCreate, db: Session = Depends(get_db)):
    return crud_auth.create_permission(db, permission=permission)

@router.put("/{permission_id}", response_model=PermissionOut)
def update_permission(permission_id: int, permission: PermissionCreate, db: Session = Depends(get_db)):
    return crud_auth.update_permission(db, permission_id=permission_id, permission=permission)

@router.delete("/{permission_id}")
def delete_permission(permission_id: int, db: Session = Depends(get_db)):
    crud_auth.delete_permission(db, permission_id=permission_id)
    return {"message": "Permission deleted successfully"}

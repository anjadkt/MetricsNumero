from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.auth import ModuleCreate, ModuleOut
from app.services import crud_auth

router = APIRouter(prefix="/modules", tags=["Modules"])

@router.get("", response_model=List[ModuleOut])
def read_modules(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_auth.get_modules(db, skip=skip, limit=limit)

@router.post("", response_model=ModuleOut)
def create_module(module: ModuleCreate, db: Session = Depends(get_db)):
    return crud_auth.create_module(db, module=module)

@router.put("/{module_id}", response_model=ModuleOut)
def update_module(module_id: int, module: ModuleCreate, db: Session = Depends(get_db)):
    return crud_auth.update_module(db, module_id=module_id, module=module)

@router.delete("/{module_id}")
def delete_module(module_id: int, db: Session = Depends(get_db)):
    crud_auth.delete_module(db, module_id=module_id)
    return {"message": "Module deleted successfully"}

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.auth import OperationCreate, OperationOut
from app.services import crud_auth

router = APIRouter(prefix="/operations", tags=["Operations"])

@router.get("", response_model=List[OperationOut])
def read_operations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_auth.get_operations(db, skip=skip, limit=limit)

@router.post("", response_model=OperationOut)
def create_operation(operation: OperationCreate, db: Session = Depends(get_db)):
    return crud_auth.create_operation(db, operation=operation)

@router.put("/{operation_id}", response_model=OperationOut)
def update_operation(operation_id: int, operation: OperationCreate, db: Session = Depends(get_db)):
    return crud_auth.update_operation(db, operation_id=operation_id, operation=operation)

@router.delete("/{operation_id}")
def delete_operation(operation_id: int, db: Session = Depends(get_db)):
    crud_auth.delete_operation(db, operation_id=operation_id)
    return {"message": "Operation deleted successfully"}

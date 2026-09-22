from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.auth import Role, Module, Operation, Permission
from app.models.user import User
from app.schemas.auth import RoleCreate, ModuleCreate, OperationCreate, PermissionCreate

# --- ROLE ---
def get_roles(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Role).offset(skip).limit(limit).all()

def get_role(db: Session, role_id: int):
    return db.query(Role).filter(Role.id == role_id).first()

def create_role(db: Session, role: RoleCreate):
    db_role = Role(name=role.name)
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

def update_role(db: Session, role_id: int, role: RoleCreate):
    db_role = get_role(db, role_id)
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check constraints
    users_using = db.query(User).filter(User.role_id == role_id).count()
    perms_using = db.query(Permission).filter(Permission.role_id == role_id).count()
    if users_using > 0 or perms_using > 0:
        raise HTTPException(status_code=400, detail="Cannot update role because it is currently in use.")

    db_role.name = role.name
    db.commit()
    db.refresh(db_role)
    return db_role

def delete_role(db: Session, role_id: int):
    db_role = get_role(db, role_id)
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check constraints
    users_using = db.query(User).filter(User.role_id == role_id).count()
    perms_using = db.query(Permission).filter(Permission.role_id == role_id).count()
    if users_using > 0 or perms_using > 0:
        raise HTTPException(status_code=400, detail="Cannot delete role because it is currently in use.")

    db.delete(db_role)
    db.commit()


# --- MODULE ---
def get_modules(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Module).offset(skip).limit(limit).all()

def get_module(db: Session, module_id: int):
    return db.query(Module).filter(Module.id == module_id).first()

def create_module(db: Session, module: ModuleCreate):
    db_module = Module(name=module.name)
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module

def update_module(db: Session, module_id: int, module: ModuleCreate):
    db_module = get_module(db, module_id)
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    perms_using = db.query(Permission).filter(Permission.module_id == module_id).count()
    if perms_using > 0:
        raise HTTPException(status_code=400, detail="Cannot update module because it is currently in use by permissions.")
        
    db_module.name = module.name
    db.commit()
    db.refresh(db_module)
    return db_module

def delete_module(db: Session, module_id: int):
    db_module = get_module(db, module_id)
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    perms_using = db.query(Permission).filter(Permission.module_id == module_id).count()
    if perms_using > 0:
        raise HTTPException(status_code=400, detail="Cannot delete module because it is currently in use by permissions.")
        
    db.delete(db_module)
    db.commit()


# --- OPERATION ---
def get_operations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Operation).offset(skip).limit(limit).all()

def get_operation(db: Session, operation_id: int):
    return db.query(Operation).filter(Operation.id == operation_id).first()

def create_operation(db: Session, operation: OperationCreate):
    db_op = Operation(name=operation.name)
    db.add(db_op)
    db.commit()
    db.refresh(db_op)
    return db_op

def update_operation(db: Session, operation_id: int, operation: OperationCreate):
    db_op = get_operation(db, operation_id)
    if not db_op:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    perms_using = db.query(Permission).filter(Permission.operation_id == operation_id).count()
    if perms_using > 0:
        raise HTTPException(status_code=400, detail="Cannot update operation because it is currently in use by permissions.")
        
    db_op.name = operation.name
    db.commit()
    db.refresh(db_op)
    return db_op

def delete_operation(db: Session, operation_id: int):
    db_op = get_operation(db, operation_id)
    if not db_op:
        raise HTTPException(status_code=404, detail="Operation not found")
    
    perms_using = db.query(Permission).filter(Permission.operation_id == operation_id).count()
    if perms_using > 0:
        raise HTTPException(status_code=400, detail="Cannot delete operation because it is currently in use by permissions.")
        
    db.delete(db_op)
    db.commit()


# --- PERMISSION ---
def get_permissions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Permission).offset(skip).limit(limit).all()

def get_permission(db: Session, permission_id: int):
    return db.query(Permission).filter(Permission.id == permission_id).first()

def create_permission(db: Session, permission: PermissionCreate):
    db_perm = Permission(
        role_id=permission.role_id,
        module_id=permission.module_id,
        operation_id=permission.operation_id
    )
    db.add(db_perm)
    db.commit()
    db.refresh(db_perm)
    return db_perm

def update_permission(db: Session, permission_id: int, permission: PermissionCreate):
    db_perm = get_permission(db, permission_id)
    if not db_perm:
        raise HTTPException(status_code=404, detail="Permission not found")
        
    db_perm.role_id = permission.role_id
    db_perm.module_id = permission.module_id
    db_perm.operation_id = permission.operation_id
    
    db.commit()
    db.refresh(db_perm)
    return db_perm

def delete_permission(db: Session, permission_id: int):
    db_perm = get_permission(db, permission_id)
    if not db_perm:
        raise HTTPException(status_code=404, detail="Permission not found")
        
    db.delete(db_perm)
    db.commit()

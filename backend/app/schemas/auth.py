from pydantic import BaseModel, ConfigDict


class RoleBase(BaseModel):
    name: str


class RoleCreate(RoleBase):
    pass


class RoleOut(RoleBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ModuleBase(BaseModel):
    name: str


class ModuleCreate(ModuleBase):
    pass


class ModuleOut(ModuleBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class OperationBase(BaseModel):
    name: str


class OperationCreate(OperationBase):
    pass


class OperationOut(OperationBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class PermissionBase(BaseModel):
    role_id: int
    module_id: int
    operation_id: int


class PermissionCreate(PermissionBase):
    pass


class PermissionOut(PermissionBase):
    id: int
    role: RoleOut
    module: ModuleOut
    operation: OperationOut

    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, EmailStr, ConfigDict
from app.schemas.auth import RoleOut


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    role_id: int


class UserOut(UserBase):
    id: int
    role: RoleOut

    model_config = ConfigDict(from_attributes=True)

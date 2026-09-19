from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    users = relationship("User", back_populates="role")
    permissions = relationship("Permission", back_populates="role", cascade="all, delete-orphan")


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    permissions = relationship("Permission", back_populates="module", cascade="all, delete-orphan")


class Operation(Base):
    __tablename__ = "operations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    permissions = relationship("Permission", back_populates="operation", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    operation_id = Column(Integer, ForeignKey("operations.id"), nullable=False)

    role = relationship("Role", back_populates="permissions")
    module = relationship("Module", back_populates="permissions")
    operation = relationship("Operation", back_populates="permissions")

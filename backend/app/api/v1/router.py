from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.roles import router as roles_router
from app.api.v1.modules import router as modules_router
from app.api.v1.operations import router as operations_router
from app.api.v1.permissions import router as permissions_router

api_router = APIRouter(
    prefix="/api/v1",
)

api_router.include_router(health_router)
api_router.include_router(roles_router)
api_router.include_router(modules_router)
api_router.include_router(operations_router)
api_router.include_router(permissions_router)
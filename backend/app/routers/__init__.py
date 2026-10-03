from backend.app.routers.admin import router as admin_router
from backend.app.routers.analytics import router as analytics_router
from backend.app.routers.auth import router as auth_router
from backend.app.routers.communications import router as communications_router
from backend.app.routers.external_mentors import router as external_mentors_router
from backend.app.routers.internships import router as internships_router
from backend.app.routers.mentors import router as mentors_router
from backend.app.routers.students import router as students_router

__all__ = [
    "admin_router",
    "analytics_router",
    "auth_router",
    "communications_router",
    "external_mentors_router",
    "internships_router",
    "mentors_router",
    "students_router",
]

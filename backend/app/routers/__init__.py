"""
FastAPI Routers Package
"""
from .signatures import router as signatures
from .users import router as users
from .audit import router as audit
from .lark_bot import router as lark_bot
from .handwriting import router as handwriting
from .templates import router as templates
from .dl_generator import router as dl_generator

__all__ = [
    "signatures",
    "users",
    "audit",
    "lark_bot",
    "handwriting",
    "templates",
    "dl_generator"
]

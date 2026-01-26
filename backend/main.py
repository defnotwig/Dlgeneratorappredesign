"""
DL Generator FastAPI Backend
============================
Main application entry point with:
- FastAPI server configuration
- CORS middleware
- Route registration
- Database initialization
- PyTorch model loading
"""

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from app.database import init_db, close_db
from app.routers import signatures, users, audit, lark_bot, handwriting, templates, dl_generator, previews
from app.services.handwriting_gan import HandwritingGAN

# Create required directories
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "signatures").mkdir(exist_ok=True)
(UPLOAD_DIR / "generated").mkdir(exist_ok=True)
(UPLOAD_DIR / "templates").mkdir(exist_ok=True)
(UPLOAD_DIR / "lark_previews").mkdir(exist_ok=True)

# Global model instance
handwriting_model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown events."""
    global handwriting_model

    # Startup
    print("Starting DL Generator Backend...")

    # Initialize database
    await init_db()
    print("[OK] Database initialized")

    # Load PyTorch handwriting model
    try:
        handwriting_model = HandwritingGAN()
        await handwriting_model.load_model()
        print("[OK] PyTorch Handwriting GAN model loaded")
    except Exception as e:
        print(f"[WARN] Handwriting model loading failed (will use fallback): {e}")
        handwriting_model = HandwritingGAN(use_fallback=True)

    # Store model in app state
    app.state.handwriting_model = handwriting_model

    # Clear Lark preview cache on startup (ensures fresh images)
    try:
        from app.services.lark_preview_cache import clear_all_preview_cache
        clear_all_preview_cache()
        print("[OK] Lark preview cache cleared")
    except Exception as e:
        print(f"[WARN] Preview cache clear failed: {e}")

    # Start auto-approval scheduler
    try:
        from app.services.lark_approval_service import lark_approval_service
        await lark_approval_service.start_scheduler()
        print("[OK] Auto-approval scheduler started (runs every Sunday)")
    except Exception as e:
        print(f"[WARN] Auto-approval scheduler failed to start: {e}")

    print("[OK] DL Generator Backend ready!")

    yield

    # Shutdown
    print("Shutting down DL Generator Backend...")

    # Stop auto-approval scheduler
    try:
        from app.services.lark_approval_service import lark_approval_service
        await lark_approval_service.stop_scheduler()
    except Exception:
        pass

    await close_db()
    print("[OK] Database connection closed")


# Create FastAPI application
app = FastAPI(
    title="DL Generator API",
    description="Demand Letter Generator with PyTorch Handwriting Synthesis and Lark Bot Integration",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002"
    ],
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Mount sign folder for custom date font images
SIGN_DIR = Path(__file__).parent.parent / "sign"
if SIGN_DIR.exists():
    app.mount("/sign", StaticFiles(directory=str(SIGN_DIR)), name="sign")

# Register routers
app.include_router(signatures, prefix="/api/signatures", tags=["Signatures"])
app.include_router(users, prefix="/api/users", tags=["Users"])
app.include_router(audit, prefix="/api/audit", tags=["Audit Trail"])
app.include_router(lark_bot, prefix="/api/lark", tags=["Lark Bot"])
app.include_router(handwriting, prefix="/api/handwriting", tags=["Handwriting Generator"])
app.include_router(templates, prefix="/api/templates", tags=["Templates"])
app.include_router(dl_generator, prefix="/api/dl-generator", tags=["DL Generator"])
app.include_router(previews, prefix="/api/previews", tags=["Preview Storage"])


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "DL Generator API",
        "version": "1.0.0",
        "pytorch_available": handwriting_model is not None and not handwriting_model.use_fallback,
        "database": "connected"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    print(f"[ERROR] Error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "error": "Internal Server Error"}
    )


if __name__ == "__main__":
    import uvicorn
    reload_enabled = os.getenv("UVICORN_RELOAD", "0") == "1"
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=reload_enabled,
        log_level="info"
    )

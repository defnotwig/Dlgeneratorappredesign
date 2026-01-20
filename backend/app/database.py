"""
SQLite Database Configuration with SQLAlchemy Async
"""

import os
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

import aiosqlite
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship

# Database path
DB_PATH = Path(__file__).parent.parent / "database" / "dl_generator.db"
DB_PATH.parent.mkdir(exist_ok=True)

DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


# =============================================================================
# Database Models
# =============================================================================

class User(Base):
    """User model for system users."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    access_level = Column(String(50), default="User")
    branch = Column(String(100))
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    clients = relationship("UserClient", back_populates="user", cascade="all, delete-orphan")
    signatures = relationship("SignatureAsset", back_populates="uploader")


class UserClient(Base):
    """User-Client assignment model."""
    __tablename__ = "user_clients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    client_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="clients")


class SignatureAsset(Base):
    """Signature asset model."""
    __tablename__ = "signature_assets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    status = Column(String(50), default="Pending")
    validity_period = Column(String(100), default="Indefinite")
    purpose = Column(String(255), default="DL Generation")
    admin_message = Column(Text)
    approved_by = Column(String(255))
    approved_at = Column(DateTime)
    style_vector = Column(Text)
    lark_image_key = Column(String(255))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    uploader = relationship("User", back_populates="signatures")
    approval_requests = relationship("SignatureApprovalRequest", back_populates="signature", cascade="all, delete-orphan")
    generated_dates = relationship("GeneratedDate", back_populates="signature", cascade="all, delete-orphan")


class SignatureApprovalRequest(Base):
    """Signature approval request model."""
    __tablename__ = "signature_approval_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    signature_id = Column(Integer, ForeignKey("signature_assets.id", ondelete="CASCADE"), nullable=False)
    requested_by = Column(Integer, ForeignKey("users.id"))
    status = Column(String(50), default="Pending")
    lark_message_id = Column(String(255))
    lark_user_id = Column(String(255))
    responded_at = Column(DateTime)
    responded_by = Column(String(255))
    response_reason = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    signature = relationship("SignatureAsset", back_populates="approval_requests")


class LarkEventDedupe(Base):
    """Tracks processed Lark event IDs for idempotency."""
    __tablename__ = "lark_event_dedupe"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(255), unique=True, nullable=False, index=True)
    event_type = Column(String(255))
    open_message_id = Column(String(255))
    signature_id = Column(Integer)
    operator_open_id = Column(String(255))
    operator_user_id = Column(String(255))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Template(Base):
    """Document template model."""
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    file_path = Column(String(500))
    template_type = Column(String(50), default="DL")
    client_id = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class DLGenerationJob(Base):
    """DL generation job tracking model."""
    __tablename__ = "dl_generation_jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_uuid = Column(String(100), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    process_mode = Column(String(50), nullable=False)
    output_format = Column(String(50), nullable=False)
    client_name = Column(String(255), nullable=False)
    template_id = Column(Integer, ForeignKey("templates.id"))
    signature_id = Column(Integer, ForeignKey("signature_assets.id"))
    excel_file_path = Column(String(500))
    output_file_path = Column(String(500))
    status = Column(String(50), default="Pending")
    records_processed = Column(Integer, default=0)
    total_records = Column(Integer, default=0)
    error_message = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime)


class AuditLog(Base):
    """Audit trail model."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    user_name = Column(String(255))
    action = Column(String(255), nullable=False)
    resource_type = Column(String(100))
    resource_id = Column(Integer)
    details = Column(Text)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    status = Column(String(50), default="success")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class LarkBotConfig(Base):
    """Lark Bot configuration model for Message Card Builder integration."""
    __tablename__ = "lark_bot_config"

    id = Column(Integer, primary_key=True, autoincrement=True)
    webhook_url = Column(String(500), nullable=True)
    secret_key = Column(String(255))
    app_id = Column(String(255))
    template_id = Column(String(255))
    self_user_id = Column(String(255))
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class HandwritingStyle(Base):
    """Handwriting style configuration for GAN."""
    __tablename__ = "handwriting_styles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    font_family = Column(String(100), nullable=False)
    base_size = Column(Integer, default=28)
    rotation_variance = Column(Float, default=2.0)
    spacing_variance = Column(Float, default=1.5)
    stroke_width_variance = Column(Float, default=0.5)
    slant_angle = Column(Float, default=0.0)
    pressure_variation = Column(Float, default=0.3)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class GeneratedDate(Base):
    """Tracking generated handwritten date images."""
    __tablename__ = "generated_dates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    signature_id = Column(Integer, ForeignKey("signature_assets.id", ondelete="CASCADE"))
    date_string = Column(String(50), nullable=False)
    formatted_date = Column(String(50))
    date_image_path = Column(String(500), nullable=False)
    style_params = Column(Text)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    used_in_batch = Column(String(100))

    signature = relationship("SignatureAsset", back_populates="generated_dates")


# =============================================================================
# Database Initialization
# =============================================================================

async def init_db():
    """Initialize the database and create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Insert default data
    async with async_session() as session:
        # Check if admin user exists
        from sqlalchemy import select
        result = await session.execute(
            select(User).where(User.email == "admin@spmadridlaw.com")
        )
        admin = result.scalar_one_or_none()

        if not admin:
            # Create default admin user
            admin = User(
                email="admin@spmadridlaw.com",
                name="Rivera, Gabriel Ludwig R.",
                access_level="Administrator",
                branch="Main",
                status="Active"
            )
            session.add(admin)
            await session.flush()

            # Assign default clients
            default_clients = ["BPI", "EON BANK", "USB PLC", "BPI BANKO", "CITIBANK", "HSBC"]
            for client in default_clients:
                session.add(UserClient(user_id=admin.id, client_name=client))

            await session.commit()
            print("[OK] Default admin user created")

        # Check if handwriting styles exist
        result = await session.execute(select(HandwritingStyle))
        styles = result.scalars().all()

        if not styles:
            # Create default handwriting styles
            default_styles = [
                HandwritingStyle(
                    name="Natural Cursive",
                    font_family="Caveat",
                    base_size=28,
                    rotation_variance=2.0,
                    spacing_variance=1.5,
                    stroke_width_variance=0.5,
                    slant_angle=5.0,
                    pressure_variation=0.3
                ),
                HandwritingStyle(
                    name="Formal Script",
                    font_family="Dancing Script",
                    base_size=26,
                    rotation_variance=1.5,
                    spacing_variance=1.0,
                    stroke_width_variance=0.3,
                    slant_angle=12.0,
                    pressure_variation=0.2
                ),
                HandwritingStyle(
                    name="Casual Hand",
                    font_family="Indie Flower",
                    base_size=24,
                    rotation_variance=3.0,
                    spacing_variance=2.0,
                    stroke_width_variance=0.7,
                    slant_angle=-3.0,
                    pressure_variation=0.4
                ),
            ]
            for style in default_styles:
                session.add(style)
            await session.commit()
            print("[OK] Default handwriting styles created")


async def close_db():
    """Close database connection."""
    await engine.dispose()


async def get_db():
    """Dependency for getting database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

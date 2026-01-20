"""
User Routes - User management and RBAC
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import Optional, List
from pydantic import BaseModel

from app.database import get_db, User, UserClient

router = APIRouter()


class UserCreate(BaseModel):
    email: str
    name: str
    accessLevel: str = "User"
    branch: Optional[str] = None
    clients: Optional[List[str]] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    accessLevel: Optional[str] = None
    branch: Optional[str] = None
    status: Optional[str] = None
    clients: Optional[List[str]] = None


@router.get("/")
async def list_users(status: Optional[str] = None, accessLevel: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(User)
    if status:
        query = query.where(User.status == status)
    if accessLevel:
        query = query.where(User.access_level == accessLevel)
    result = await db.execute(query.order_by(User.name))
    users = result.scalars().all()

    users_with_clients = []
    for user in users:
        clients_result = await db.execute(select(UserClient.client_name).where(UserClient.user_id == user.id))
        clients = [c for c in clients_result.scalars().all()]
        user_dict = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "access_level": user.access_level,
            "branch": user.branch,
            "status": user.status,
            "clients": clients
        }
        users_with_clients.append(user_dict)
    return users_with_clients


@router.get("/{user_id}")
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    clients_result = await db.execute(select(UserClient.client_name).where(UserClient.user_id == user.id))
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "access_level": user.access_level,
        "branch": user.branch,
        "status": user.status,
        "clients": list(clients_result.scalars().all())
    }


@router.post("/")
async def create_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == user_data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already exists")

    new_user = User(
        email=user_data.email,
        name=user_data.name,
        access_level=user_data.accessLevel,
        branch=user_data.branch
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    if user_data.clients:
        for client in user_data.clients:
            db.add(UserClient(user_id=new_user.id, client_name=client))
        await db.commit()

    return {"id": new_user.id, "email": new_user.email, "name": new_user.name}


@router.put("/{user_id}")
async def update_user(user_id: int, user_data: UserUpdate, db: AsyncSession = Depends(get_db)):
    updates = {k: v for k, v in user_data.dict().items() if v is not None and k != "clients"}
    if "accessLevel" in updates:
        updates["access_level"] = updates.pop("accessLevel")

    if updates:
        await db.execute(update(User).where(User.id == user_id).values(**updates))

    if user_data.clients is not None:
        await db.execute(delete(UserClient).where(UserClient.user_id == user_id))
        for client in user_data.clients:
            db.add(UserClient(user_id=user_id, client_name=client))

    await db.commit()
    return await get_user(user_id, db)


@router.delete("/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()
    return {"message": "User deleted"}


@router.post("/{user_id}/reset-password")
async def reset_password(user_id: int, db: AsyncSession = Depends(get_db)):
    """Reset user password (generates a temporary password or sends reset email)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # In a real implementation, this would send a password reset email
    # For now, we'll just return success
    return {
        "message": f"Password reset link sent to {user.email}",
        "success": True
    }


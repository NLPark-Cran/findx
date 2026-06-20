from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db import User, UserStats, get_db

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str


class UserResponse(BaseModel):
    id: str
    username: str


@router.post("/register", response_model=UserResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)) -> User:
    existing = await db.execute(select(User).where(User.username == req.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(username=req.username)
    db.add(user)
    await db.flush()
    stats = UserStats(user_id=user.id)
    db.add(stats)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/users/{username}", response_model=UserResponse)
async def get_user(username: str, db: AsyncSession = Depends(get_db)) -> User:
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

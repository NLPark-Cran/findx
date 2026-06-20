from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db import Comment, Level, get_db
from app.services.level_generator import ensure_seed_levels

router = APIRouter(prefix="/levels", tags=["levels"])


class LevelSummary(BaseModel):
    id: str
    slug: str
    title_cn: str
    title_en: str
    topic: str
    difficulty: int
    tags: list[str]


class CommentOut(BaseModel):
    id: str
    text_cn: str
    text_en: str
    emotion: dict[str, float]
    fallacy_types: list[str]
    effective_weapons: list[str]
    ineffective_weapons: list[str]


class LevelDetail(LevelSummary):
    description_cn: str
    description_en: str
    comments: list[CommentOut]


@router.get("", response_model=list[LevelSummary])
async def list_levels(db: AsyncSession = Depends(get_db)) -> list[Level]:
    await ensure_seed_levels(db)
    result = await db.execute(select(Level).order_by(Level.difficulty))
    return list(result.scalars().all())


@router.get("/{level_id}", response_model=LevelDetail)
async def get_level(level_id: str, db: AsyncSession = Depends(get_db)) -> Level:
    await ensure_seed_levels(db)
    result = await db.execute(select(Level).where(Level.id == level_id))
    level = result.scalar_one_or_none()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    return level

import uuid
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, List

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.config import settings


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    stats: Mapped["UserStats"] = relationship(back_populates="user", uselist=False)
    agents: Mapped[List["Agent"]] = relationship(back_populates="owner")


class UserStats(Base):
    __tablename__ = "user_stats"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True)
    wins: Mapped[int] = mapped_column(Integer, default=0)
    losses: Mapped[int] = mapped_column(Integer, default=0)
    draws: Mapped[int] = mapped_column(Integer, default=0)
    rank_score: Mapped[int] = mapped_column(Integer, default=1000)
    total_score: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship(back_populates="stats")


class Level(Base):
    __tablename__ = "levels"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    title_cn: Mapped[str] = mapped_column(String(128), nullable=False)
    title_en: Mapped[str] = mapped_column(String(128), nullable=False)
    topic: Mapped[str] = mapped_column(String(64), nullable=False)
    difficulty: Mapped[int] = mapped_column(Integer, default=1)
    description_cn: Mapped[str] = mapped_column(Text, default="")
    description_en: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)

    comments: Mapped[List["Comment"]] = relationship(back_populates="level", lazy="selectin")


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    level_id: Mapped[str] = mapped_column(ForeignKey("levels.id"), nullable=False)
    text_cn: Mapped[str] = mapped_column(Text, nullable=False)
    text_en: Mapped[str] = mapped_column(Text, nullable=False)
    emotion: Mapped[dict[str, float]] = mapped_column(JSON, default=dict)
    fallacy_types: Mapped[list[str]] = mapped_column(JSON, default=list)
    confidence: Mapped[float] = mapped_column(default=0.0)
    explanation_cn: Mapped[str] = mapped_column(Text, default="")
    explanation_en: Mapped[str] = mapped_column(Text, default="")
    effective_weapons: Mapped[list[str]] = mapped_column(JSON, default=list)
    ineffective_weapons: Mapped[list[str]] = mapped_column(JSON, default=list)

    level: Mapped["Level"] = relationship(back_populates="comments")


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    avatar_url: Mapped[str] = mapped_column(String(512), default="")
    model: Mapped[str] = mapped_column(String(64), default="qwen3.7-max")
    system_prompt: Mapped[str] = mapped_column(Text, default="")
    weapon_priority: Mapped[list[str]] = mapped_column(JSON, default=list)
    personality: Mapped[str] = mapped_column(String(32), default="balanced")  # aggressive / balanced / mocking
    is_public: Mapped[bool] = mapped_column(default=False)
    agent_key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    version: Mapped[int] = mapped_column(Integer, default=1)
    wins: Mapped[int] = mapped_column(Integer, default=0)
    losses: Mapped[int] = mapped_column(Integer, default=0)
    draws: Mapped[int] = mapped_column(Integer, default=0)
    rank_score: Mapped[int] = mapped_column(Integer, default=1000)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    owner: Mapped["User"] = relationship(back_populates="agents")


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mode: Mapped[str] = mapped_column(String(32), nullable=False)  # pvp / agent / campaign
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending / active / finished
    player1_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    player2_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    agent1_id: Mapped[str | None] = mapped_column(ForeignKey("agents.id"), nullable=True)
    agent2_id: Mapped[str | None] = mapped_column(ForeignKey("agents.id"), nullable=True)
    level_id: Mapped[str | None] = mapped_column(ForeignKey("levels.id"), nullable=True)
    result: Mapped[str | None] = mapped_column(String(32), nullable=True)  # player1_win / player2_win / draw
    scores: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    replay: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# Engine & session
async_engine = create_async_engine(settings.async_database_url, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

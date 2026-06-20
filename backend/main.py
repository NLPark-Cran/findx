from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import agent, auth, fallacy, game, levels, pvp, sentiment
from app.config import settings
from app.models.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="FindX API",
    description="找猹 / FindX - AI logical fallacy battle game",
    version="0.1.0",
    lifespan=lifespan,
    root_path="/api",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:3006"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(sentiment.router)
app.include_router(fallacy.router)
app.include_router(levels.router)
app.include_router(game.router)
app.include_router(agent.router)
app.include_router(pvp.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

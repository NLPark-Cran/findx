from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db import Agent, Match, User, get_db
from app.services import agent_service
from app.services.agent_service import TRAINING_BOTS

router = APIRouter(prefix="/agent", tags=["agent"])


def get_agent_key(x_agent_key: str | None = Header(None)) -> str:
    if not x_agent_key:
        raise HTTPException(status_code=401, detail="Missing X-Agent-Key header")
    return x_agent_key


async def get_current_agent(
    agent_key: str = Depends(get_agent_key),
    db: AsyncSession = Depends(get_db),
) -> Agent:
    agent = await agent_service.get_agent_by_key(db, agent_key)
    if not agent:
        raise HTTPException(status_code=401, detail="Invalid agent key")
    return agent


class CreateAgentRequest(BaseModel):
    owner_username: str
    name: str
    model: str = "qwen3.7-max"
    system_prompt: str = ""
    weapon_priority: list[str] = Field(default_factory=lambda: ["clarifier", "evidence_shield", "reductio_sword"])
    personality: str = "balanced"
    is_public: bool = False


class UpdateCodeRequest(BaseModel):
    system_prompt: str | None = None
    weapon_priority: list[str] | None = None
    personality: str | None = None


@router.post("/fighters")
async def create_agent(req: CreateAgentRequest, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    from sqlalchemy import select

    result = await db.execute(select(User).where(User.username == req.owner_username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Owner user not found, register first")
    agent = await agent_service.create_agent(
        db=db,
        owner_id=user.id,
        name=req.name,
        model=req.model,
        system_prompt=req.system_prompt,
        weapon_priority=req.weapon_priority,
        personality=req.personality,
        is_public=req.is_public,
    )
    return {
        "id": agent.id,
        "name": agent.name,
        "agent_key": agent.agent_key,
        "version": agent.version,
    }


@router.get("/fighter")
async def read_agent(agent: Agent = Depends(get_current_agent)) -> dict[str, Any]:
    return {
        "id": agent.id,
        "name": agent.name,
        "model": agent.model,
        "system_prompt": agent.system_prompt,
        "weapon_priority": agent.weapon_priority,
        "personality": agent.personality,
        "is_public": agent.is_public,
        "version": agent.version,
        "wins": agent.wins,
        "losses": agent.losses,
        "draws": agent.draws,
        "rank_score": agent.rank_score,
        "agent_key": agent.agent_key,
    }


@router.post("/fighter/code")
async def update_code(
    req: UpdateCodeRequest,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    updated = await agent_service.update_agent_code(
        db=db,
        agent=agent,
        system_prompt=req.system_prompt,
        weapon_priority=req.weapon_priority,
        personality=req.personality,
    )
    return {
        "version": updated.version,
        "system_prompt": updated.system_prompt,
        "weapon_priority": updated.weapon_priority,
        "personality": updated.personality,
    }


class SimulateRequest(BaseModel):
    opponent_bot: str = "nova-scout"
    topic: str = "general"
    rounds: int = 3
    language: str = "zh"


@router.post("/fighter/simulate")
async def simulate(
    req: SimulateRequest,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    bot = TRAINING_BOTS.get(req.opponent_bot, TRAINING_BOTS["nova-scout"])
    result = await agent_service.run_match(
        db=db,
        agent1=agent,
        agent2=bot,
        topic=req.topic,
        rounds=req.rounds,
        language=req.language,
    )
    return result


class ChallengeRequest(BaseModel):
    opponent_agent_id: str
    topic: str = "general"
    rounds: int = 3
    language: str = "zh"


@router.post("/fighter/challenge")
async def challenge(
    req: ChallengeRequest,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    opponent = await agent_service.get_agent_by_id(db, req.opponent_agent_id)
    if not opponent:
        raise HTTPException(status_code=404, detail="Opponent agent not found")
    if not opponent.is_public and opponent.owner_id != agent.owner_id:
        raise HTTPException(status_code=403, detail="Opponent agent is not public")

    result = await agent_service.run_match(
        db=db,
        agent1=agent,
        agent2=opponent,
        topic=req.topic,
        rounds=req.rounds,
        language=req.language,
    )
    match = await agent_service.record_agent_match(
        db=db,
        agent1_id=agent.id,
        agent2_id=opponent.id,
        result=result["result"],
        scores={"total1": result["total1"], "total2": result["total2"]},
        replay=result["replay"],
    )
    await agent_service.update_agent_stats(db, agent, result["result"])
    await agent_service.update_agent_stats(db, opponent, "agent2_win" if result["result"] == "agent1_win" else "agent1_win" if result["result"] == "agent2_win" else "draw")
    return {"match_id": match.id, **result}


@router.get("/leaderboard")
async def leaderboard(limit: int = 50, db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    return await agent_service.get_leaderboard(db, limit=limit)


@router.get("/opponents")
async def opponents(limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db)) -> list[dict[str, Any]]:
    agents = await agent_service.list_public_agents(db, limit=limit, offset=offset)
    return [
        {
            "id": a.id,
            "name": a.name,
            "model": a.model,
            "rank_score": a.rank_score,
            "wins": a.wins,
            "losses": a.losses,
            "draws": a.draws,
            "personality": a.personality,
        }
        for a in agents
    ]


@router.get("/matches")
async def list_matches(
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
) -> list[dict[str, Any]]:
    from sqlalchemy import select

    result = await db.execute(
        select(Match)
        .where((Match.agent1_id == agent.id) | (Match.agent2_id == agent.id))
        .order_by(Match.created_at.desc())
        .limit(limit)
    )
    matches = result.scalars().all()
    return [
        {
            "id": m.id,
            "mode": m.mode,
            "result": m.result,
            "scores": m.scores,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in matches
    ]

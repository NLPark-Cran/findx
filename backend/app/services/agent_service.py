import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db import Agent, Match, User
from app.services.fallacy_judge import judge
from app.services.game_engine import compute_battle_result
from app.services.level_generator import generate_level_comments
from app.services.llm_client import generate_agent_move


DEFAULT_SYSTEM_PROMPT = """You are a calm and sharp debater. Your goal is to identify logical fallacies in the opponent's comment and respond with the most appropriate weapon and a concise rebuttal."""

TRAINING_BOTS = {
    "nova-scout": {
        "name": "Nova Scout",
        "model": "qwen3.7-max",
        "system_prompt": "You are a cautious beginner. Pick the most obvious fallacy and use simple explanations.",
        "weapon_priority": ["clarifier", "evidence_shield", "reductio_sword"],
        "personality": "balanced",
    },
    "azure-hunter": {
        "name": "Azure Hunter",
        "model": "qwen3.7-max",
        "system_prompt": "You are an aggressive hunter of logical flaws. Always attack the argument structure directly.",
        "weapon_priority": ["reductio_sword", "debunk_hammer", "causal_lens"],
        "personality": "aggressive",
    },
    "crimson-bastion": {
        "name": "Crimson Bastion",
        "model": "qwen3.7-max",
        "system_prompt": "You are a defensive expert. Focus on evidence and statistics, exposing unsupported claims.",
        "weapon_priority": ["evidence_shield", "statistical_lens", "clarifier"],
        "personality": "balanced",
    },
}


async def get_agent_by_key(db: AsyncSession, agent_key: str) -> Agent | None:
    result = await db.execute(select(Agent).where(Agent.agent_key == agent_key))
    return result.scalar_one_or_none()


async def get_agent_by_id(db: AsyncSession, agent_id: str) -> Agent | None:
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    return result.scalar_one_or_none()


async def create_agent(
    db: AsyncSession,
    owner_id: str,
    name: str,
    model: str = "qwen3.7-max",
    system_prompt: str = "",
    weapon_priority: list[str] | None = None,
    personality: str = "balanced",
    is_public: bool = False,
) -> Agent:
    agent = Agent(
        owner_id=owner_id,
        name=name,
        model=model,
        system_prompt=system_prompt or DEFAULT_SYSTEM_PROMPT,
        weapon_priority=weapon_priority or ["clarifier", "evidence_shield", "reductio_sword"],
        personality=personality,
        is_public=is_public,
        agent_key=str(uuid.uuid4()),
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


async def update_agent_code(
    db: AsyncSession,
    agent: Agent,
    system_prompt: str | None = None,
    weapon_priority: list[str] | None = None,
    personality: str | None = None,
) -> Agent:
    if system_prompt is not None:
        agent.system_prompt = system_prompt
    if weapon_priority is not None:
        agent.weapon_priority = weapon_priority
    if personality is not None:
        agent.personality = personality
    agent.version += 1
    await db.commit()
    await db.refresh(agent)
    return agent


async def execute_agent_turn(
    agent: Agent,
    comment_text: str,
    fallacy_types: list[str],
    language: str = "zh",
) -> dict[str, Any]:
    """Run one turn for an agent: choose weapon + rebuttal, then judge."""
    move = await generate_agent_move(
        comment=comment_text,
        system_prompt=agent.system_prompt,
        weapon_priority=agent.weapon_priority,
        personality=agent.personality,
        language=language,
    )
    weapon_id = move.get("weapon_id", "clarifier")
    rebuttal = move.get("rebuttal", "")
    evaluation = await judge(
        comment=comment_text,
        fallacy_types=fallacy_types,
        weapon_id=weapon_id,
        rebuttal=rebuttal,
        language=language,
    )
    return {
        "agent_id": agent.id,
        "name": agent.name,
        "weapon_id": weapon_id,
        "rebuttal": rebuttal,
        "move_confidence": move.get("confidence", 0.5),
        "evaluation": evaluation,
        "battle_result": compute_battle_result(
            hit_score=evaluation.get("hit_score", 0),
        ),
    }


async def run_match(
    db: AsyncSession,
    agent1: Agent,
    agent2: Agent | dict[str, Any],
    topic: str = "general",
    rounds: int = 3,
    language: str = "zh",
) -> dict[str, Any]:
    """Run a match between two agents. agent2 can be a training bot dict."""
    comments = await generate_level_comments(topic=topic, difficulty=3, count=rounds, language=language)
    replay = {"rounds": [], "total1": 0, "total2": 0}

    for idx, comment_data in enumerate(comments):
        text = comment_data.get("text_cn" if language == "zh" else "text_en", "")
        fallacy_types = comment_data.get("fallacy_types", [])

        turn1 = await execute_agent_turn(agent1, text, fallacy_types, language)
        if isinstance(agent2, Agent):
            turn2 = await execute_agent_turn(agent2, text, fallacy_types, language)
        else:
            # training bot
            bot_agent = Agent(
                name=agent2["name"],
                model=agent2["model"],
                system_prompt=agent2["system_prompt"],
                weapon_priority=agent2["weapon_priority"],
                personality=agent2["personality"],
            )
            turn2 = await execute_agent_turn(bot_agent, text, fallacy_types, language)

        score1 = turn1["battle_result"]["damage"]
        score2 = turn2["battle_result"]["damage"]
        replay["total1"] += score1
        replay["total2"] += score2
        replay["rounds"].append(
            {
                "round": idx + 1,
                "comment": comment_data,
                "turn1": turn1,
                "turn2": turn2,
                "winner": "turn1" if score1 > score2 else "turn2" if score2 > score1 else "draw",
            }
        )

    result = "draw"
    if replay["total1"] > replay["total2"]:
        result = "agent1_win"
    elif replay["total2"] > replay["total1"]:
        result = "agent2_win"

    return {
        "result": result,
        "total1": round(replay["total1"], 1),
        "total2": round(replay["total2"], 1),
        "replay": replay,
    }


async def record_agent_match(
    db: AsyncSession,
    agent1_id: str,
    agent2_id: str | None,
    result: str,
    scores: dict[str, Any],
    replay: dict[str, Any],
) -> Match:
    match = Match(
        mode="agent",
        agent1_id=agent1_id,
        agent2_id=agent2_id,
        status="finished",
        result=result,
        scores=scores,
        replay=replay,
    )
    db.add(match)
    await db.commit()
    await db.refresh(match)
    return match


async def update_agent_stats(db: AsyncSession, agent: Agent, result: str) -> None:
    if result == "agent1_win":
        agent.wins += 1
        agent.rank_score += 15
    elif result == "agent2_win":
        agent.losses += 1
        agent.rank_score = max(0, agent.rank_score - 10)
    else:
        agent.draws += 1
        agent.rank_score += 3
    await db.commit()


async def list_public_agents(db: AsyncSession, limit: int = 50, offset: int = 0) -> list[Agent]:
    result = await db.execute(
        select(Agent).where(Agent.is_public == True).order_by(Agent.rank_score.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars().all())


async def get_leaderboard(db: AsyncSession, limit: int = 50) -> list[dict[str, Any]]:
    result = await db.execute(
        select(Agent, User.username)
        .join(User, Agent.owner_id == User.id)
        .where(Agent.is_public == True)
        .order_by(Agent.rank_score.desc())
        .limit(limit)
    )
    rows = result.all()
    return [
        {
            "id": agent.id,
            "name": agent.name,
            "owner": username,
            "rank_score": agent.rank_score,
            "wins": agent.wins,
            "losses": agent.losses,
            "draws": agent.draws,
            "version": agent.version,
        }
        for agent, username in rows
    ]

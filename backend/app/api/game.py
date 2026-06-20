from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db import Match, get_db
from app.services.fallacy_judge import judge
from app.services.game_engine import compute_battle_result

router = APIRouter(prefix="/game", tags=["game"])


class SubmitMoveRequest(BaseModel):
    comment: str
    fallacy_types: list[str]
    detected_fallacies: list[str] = []
    weapon_id: str
    rebuttal: str = ""
    combo: int = 0
    language: str = "zh"


@router.post("/submit-move")
async def submit_move(req: SubmitMoveRequest) -> dict[str, Any]:
    evaluation = await judge(
        comment=req.comment,
        fallacy_types=req.fallacy_types,
        detected_fallacies=req.detected_fallacies,
        weapon_id=req.weapon_id,
        rebuttal=req.rebuttal,
        language=req.language,
    )
    battle = compute_battle_result(
        hit_score=evaluation.get("hit_score", 0),
        combo=req.combo,
    )
    return {
        "evaluation": evaluation,
        "battle": battle,
    }


class FinishRequest(BaseModel):
    user_id: str | None = None
    level_id: str | None = None
    score: int
    max_combo: int
    hits: int
    misses: int


@router.post("/finish")
async def finish_game(req: FinishRequest, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    match = Match(
        mode="campaign",
        player1_id=req.user_id,
        level_id=req.level_id,
        status="finished",
        result="completed",
        scores={
            "score": req.score,
            "max_combo": req.max_combo,
            "hits": req.hits,
            "misses": req.misses,
        },
    )
    db.add(match)
    await db.commit()
    return {"match_id": match.id, "score": req.score}

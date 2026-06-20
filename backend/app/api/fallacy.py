from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.fallacy_judge import judge

router = APIRouter(prefix="/fallacy", tags=["fallacy"])


class EvaluateRequest(BaseModel):
    comment: str
    fallacy_types: list[str]
    weapon_id: str
    rebuttal: str = ""
    language: str = "zh"


@router.post("/evaluate")
async def evaluate(req: EvaluateRequest) -> dict[str, Any]:
    return await judge(
        comment=req.comment,
        fallacy_types=req.fallacy_types,
        weapon_id=req.weapon_id,
        rebuttal=req.rebuttal,
        language=req.language,
    )

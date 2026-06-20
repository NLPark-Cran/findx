from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.sentiment_service import analyze

router = APIRouter(prefix="/sentiment", tags=["sentiment"])


class AnalyzeRequest(BaseModel):
    text: str
    language: str = "zh"


@router.post("/analyze")
async def analyze_text(req: AnalyzeRequest) -> dict[str, Any]:
    return await analyze(req.text, language=req.language)

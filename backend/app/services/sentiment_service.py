from typing import Any

from app.services.llm_client import analyze_comment


async def analyze(text: str, language: str = "zh") -> dict[str, Any]:
    """Analyze a single comment and return emotion + fallacy info."""
    return await analyze_comment(text, language=language)

from typing import Any

from app.services.llm_client import evaluate_rebuttal


async def judge(
    comment: str,
    fallacy_types: list[str],
    weapon_id: str,
    rebuttal: str,
    language: str = "zh",
    detected_fallacies: list[str] | None = None,
) -> dict[str, Any]:
    """Judge player's detected fallacies + weapon + rebuttal."""
    return await evaluate_rebuttal(
        comment=comment,
        fallacy_types=fallacy_types,
        weapon_id=weapon_id,
        rebuttal=rebuttal,
        language=language,
        detected_fallacies=detected_fallacies,
    )

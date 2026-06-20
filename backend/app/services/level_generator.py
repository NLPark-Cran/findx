import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db import Comment, Level
from app.services.llm_client import generate_level_comments


SEED_TOPICS = [
    {"slug": "game-review", "topic": "游戏评测翻车", "title_cn": "策划又作死了", "title_en": "Game Update Backlash"},
    {"slug": "social-news", "topic": "社会热点争议", "title_cn": "评论区大战", "title_en": "Social Media Firestorm"},
    {"slug": "fan-war", "topic": "饭圈 Battle", "title_cn": "谁家哥哥更强", "title_en": "Fandom War"},
    {"slug": "tech-debate", "topic": "科技产品对比", "title_cn": "苹果 vs 安卓", "title_en": "Tech Fanboy Fight"},
    {"slug": "food-culture", "topic": "饮食文化之争", "title_cn": "甜咸粽子大战", "title_en": "Food Culture Wars"},
]


def _load_seed_comments() -> dict[str, list[dict]]:
    seed_path = Path(__file__).resolve().parent.parent / "data" / "seed_comments.json"
    if seed_path.exists():
        with open(seed_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


async def ensure_seed_levels(db: AsyncSession) -> None:
    """Generate initial levels if none exist."""
    result = await db.execute(select(Level).limit(1))
    if result.scalar_one_or_none() is not None:
        return

    seed_comments = _load_seed_comments()

    for idx, item in enumerate(SEED_TOPICS, start=1):
        difficulty = min(idx, 5)
        level = Level(
            slug=item["slug"],
            title_cn=item["title_cn"],
            title_en=item["title_en"],
            topic=item["topic"],
            difficulty=difficulty,
            description_cn=f"在{item['topic']}的评论区中识别逻辑谬误。",
            description_en=f"Identify logical fallacies in the {item['topic']} comment section.",
            tags=[item["topic"]],
        )
        db.add(level)
        await db.flush()  # get level.id

        comments_data = seed_comments.get(item["slug"])
        if not comments_data:
            # fallback to LLM if seed file is missing this topic
            comments_data = await generate_level_comments(
                topic=item["topic"],
                difficulty=difficulty,
                count=4,
                language="zh",
            )
        for c in comments_data:
            comment = Comment(
                level_id=level.id,
                text_cn=c.get("text_cn", ""),
                text_en=c.get("text_en", ""),
                emotion=c.get("emotion", {}),
                fallacy_types=c.get("fallacy_types", []),
                confidence=c.get("confidence", 0.8),
                explanation_cn=c.get("explanation_cn", ""),
                explanation_en=c.get("explanation_en", ""),
                effective_weapons=c.get("effective_weapons", []),
                ineffective_weapons=c.get("ineffective_weapons", []),
            )
            db.add(comment)
    await db.commit()

import json
import re
from typing import Any

from openai import AsyncOpenAI

from app.config import settings

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.tokendance_api_key,
            base_url=settings.tokendance_base_url,
        )
    return _client


FALLACY_LIST = [
    {"id": "ad_hominem", "zh": "诉诸人身", "en": "Ad Hominem", "effective_weapon_ids": ["clarifier", "evidence_shield", "socratic_trap"]},
    {"id": "slippery_slope", "zh": "滑坡谬误", "en": "Slippery Slope", "effective_weapon_ids": ["causal_lens", "reductio_sword", "clarifier"]},
    {"id": "straw_man", "zh": "稻草人", "en": "Straw Man", "effective_weapon_ids": ["clarifier", "debunk_hammer", "evidence_shield"]},
    {"id": "false_dilemma", "zh": "非黑即白 / 虚假两难", "en": "False Dilemma", "effective_weapon_ids": ["socratic_trap", "clarifier", "reductio_sword"]},
    {"id": "survivorship_bias", "zh": "幸存者偏差", "en": "Survivorship Bias", "effective_weapon_ids": ["statistical_lens", "evidence_shield", "clarifier"]},
    {"id": "appeal_to_authority", "zh": "诉诸权威", "en": "Appeal to Authority", "effective_weapon_ids": ["evidence_shield", "clarifier", "socratic_trap"]},
    {"id": "equivocation", "zh": "偷换概念", "en": "Equivocation", "effective_weapon_ids": ["clarifier", "debunk_hammer", "socratic_trap"]},
    {"id": "appeal_to_emotion", "zh": "诉诸情感", "en": "Appeal to Emotion", "effective_weapon_ids": ["clarifier", "evidence_shield", "reductio_sword"]},
    {"id": "circular_reasoning", "zh": "循环论证", "en": "Circular Reasoning", "effective_weapon_ids": ["socratic_trap", "clarifier", "reductio_sword"]},
    {"id": "false_causality", "zh": "虚假因果", "en": "False Causality", "effective_weapon_ids": ["causal_lens", "statistical_lens", "clarifier"]},
    {"id": "hasty_generalization", "zh": "以偏概全", "en": "Hasty Generalization", "effective_weapon_ids": ["statistical_lens", "evidence_shield", "clarifier"]},
    {"id": "loaded_question", "zh": "诱导性问题", "en": "Loaded Question", "effective_weapon_ids": ["socratic_trap", "clarifier", "reductio_sword"]},
]

WEAPON_LIST = [
    {"id": "clarifier", "zh": "逻辑澄清弹", "en": "Clarifier", "target_fallacies": ["ad_hominem", "straw_man", "false_dilemma", "equivocation", "appeal_to_emotion", "circular_reasoning", "loaded_question", "hasty_generalization", "slippery_slope", "false_causality", "survivorship_bias", "appeal_to_authority"], "description_zh": "澄清论点的真实含义，拆穿偷换概念或稻草人", "description_en": "Clarify the actual claim and expose straw men or equivocation"},
    {"id": "evidence_shield", "zh": "证据护盾", "en": "Evidence Shield", "target_fallacies": ["ad_hominem", "straw_man", "appeal_to_authority", "appeal_to_emotion", "hasty_generalization", "survivorship_bias"], "description_zh": "要求对方出示证据，挡住人身攻击与情感绑架", "description_en": "Demand evidence to block ad hominem and emotional appeals"},
    {"id": "reductio_sword", "zh": "归谬剑", "en": "Reductio Sword", "target_fallacies": ["false_dilemma", "slippery_slope", "circular_reasoning", "loaded_question", "appeal_to_emotion"], "description_zh": "把对方逻辑推向极端，暴露其荒谬性", "description_en": "Push the opponent's logic to its absurd extreme"},
    {"id": "debunk_hammer", "zh": "拆解锤", "en": "Debunk Hammer", "target_fallacies": ["straw_man", "equivocation", "false_causality"], "description_zh": "逐条拆解对方论证中的错误构造", "description_en": "Dismantle the structure of the opponent's argument"},
    {"id": "causal_lens", "zh": "因果显微镜", "en": "Causal Lens", "target_fallacies": ["false_causality", "slippery_slope"], "description_zh": "检查因果链条，找出相关不等于因果", "description_en": "Inspect the causal chain; correlation is not causation"},
    {"id": "statistical_lens", "zh": "统计透镜", "en": "Statistical Lens", "target_fallacies": ["hasty_generalization", "survivorship_bias", "false_causality"], "description_zh": "用样本与数据审视以偏概全和幸存者偏差", "description_en": "Use sample and data to examine generalizations and biases"},
    {"id": "socratic_trap", "zh": "反问陷阱", "en": "Socratic Trap", "target_fallacies": ["false_dilemma", "circular_reasoning", "loaded_question", "equivocation", "appeal_to_authority"], "description_zh": "用反问迫使对方暴露前提漏洞", "description_en": "Force the opponent to expose hidden premises with questions"},
]


def get_fallacy_by_name(name: str) -> dict[str, Any] | None:
    """Match fallacy by Chinese or English name (handles ' / ' separator)."""
    name = name.strip().lower()
    for f in FALLACY_LIST:
        if name == f["zh"].lower() or name == f["en"].lower():
            return f
        if " / " in f["zh"] and name in f["zh"].lower().split(" / "):
            return f
    return None


def get_weapon_by_id(weapon_id: str) -> dict[str, Any] | None:
    for w in WEAPON_LIST:
        if w["id"] == weapon_id:
            return w
    return None


def _build_fallacy_table(language: str = "zh") -> str:
    lines = []
    for f in FALLACY_LIST:
        label = f"{f['zh']} / {f['en']}" if language == "zh" else f"{f['en']} / {f['zh']}"
        desc = f["description_zh"] if language == "zh" else f["description_en"]
        lines.append(f"- {label}: {desc}")
    return "\n".join(lines)


def _build_weapon_table(language: str = "zh") -> str:
    lines = []
    for w in WEAPON_LIST:
        label = f"{w['zh']} ({w['id']}) / {w['en']}" if language == "zh" else f"{w['en']} ({w['id']}) / {w['zh']}"
        desc = w["description_zh"] if language == "zh" else w["description_en"]
        lines.append(f"- {label}: {desc}")
    return "\n".join(lines)


def _extract_json(text: str) -> dict[str, Any]:
    """Extract JSON object from model output, allowing markdown fences."""
    if not text:
        raise ValueError("Empty response")
    text = text.strip()
    if "```" in text:
        matches = re.findall(r"```(?:json)?\s*([\s\S]*?)```", text)
        if matches:
            text = matches[-1].strip()
    if not text.startswith("{"):
        m = re.search(r"\{[\s\S]*\}", text)
        if m:
            text = m.group(0)
    return json.loads(text)


async def analyze_comment(text: str, language: str = "zh") -> dict[str, Any]:
    """Analyze a comment: emotion + fallacy detection."""
    client = get_client()
    lang_name = "Chinese" if language == "zh" else "English"
    system_prompt = f"""You are an expert in Chinese online comments, emotion analysis, and logical fallacy detection.
Respond ONLY with a valid JSON object. Do not include explanations outside JSON.

Available fallacy types:
{_build_fallacy_table(language)}

Output schema:
{{
  "emotion": {{
    "anger": 0.0-1.0,
    "sarcasm": 0.0-1.0,
    "fear": 0.0-1.0,
    "disgust": 0.0-1.0,
    "joy": 0.0-1.0,
    "sadness": 0.0-1.0,
    "surprise": 0.0-1.0,
    "contempt": 0.0-1.0
  }},
  "has_fallacy": true/false,
  "fallacy_types": ["fallacy name in {lang_name}"],
  "confidence": 0.0-1.0,
  "explanation": "brief explanation in {lang_name}",
  "counter_suggestion": "brief suggestion in {lang_name}"
}}
"""
    response = await client.chat.completions.create(
        model=settings.tokendance_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Analyze this comment in {lang_name}:\n{text}"},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
        max_tokens=1024,
    )
    content = response.choices[0].message.content or "{}"
    return _extract_json(content)


async def evaluate_rebuttal(
    comment: str,
    fallacy_types: list[str],
    weapon_id: str,
    rebuttal: str,
    language: str = "zh",
    detected_fallacies: list[str] | None = None,
) -> dict[str, Any]:
    """Evaluate whether the player's detected fallacies + weapon + rebuttal hit the target."""
    client = get_client()
    lang_name = "Chinese" if language == "zh" else "English"
    weapon_table = _build_weapon_table(language)
    detected = detected_fallacies or []

    system_prompt = f"""You are a fair judge in a logical-fallacy battle game.
Respond ONLY with a valid JSON object. Do not include explanations outside JSON.

Available weapons:
{weapon_table}

Actual fallacy types in this comment: {fallacy_types}
Player detected fallacies: {detected if detected else '(none selected)'}

Scoring criteria (0-100 each):
- fallacy_detection_score: how accurately the player identified the actual fallacies. 90-100 if exact or very close; 70-89 if partially correct; 40-69 if related but wrong; 0-39 if completely off.
- weapon_match_score: how well the chosen weapon counters the detected/actual fallacies. 90-100 if perfect; 70-89 if good; 40-69 if weak relevance; 0-39 if wrong.
- rebuttal_score: quality of the written rebuttal in explaining the flaw. 90-100 if clear, concise, and directly targets the fallacy; 70-89 if mostly good; 40-69 if vague; 0-39 if irrelevant or emotional.

Overall hit_score = round(0.4 * fallacy_detection_score + 0.3 * weapon_match_score + 0.3 * rebuttal_score).
hit = true if hit_score >= 70.

Also include an opponent_reaction object describing how the enemy troll would feel after reading the rebuttal. Be witty and in-character.

Output schema:
{{
  "fallacy_detection_score": 0-100,
  "weapon_match_score": 0-100,
  "rebuttal_score": 0-100,
  "hit": true/false,
  "hit_score": 0-100,
  "reason": "brief reason in {lang_name}",
  "improvement": "brief improvement tip in {lang_name}",
  "opponent_reaction": {{
    "inner_monologue": "the troll's inner monologue in {lang_name}, 1-2 sentences, emotional and dramatic",
    "emotion_delta": {{
      "anger": -0.0-1.0,
      "sarcasm": -0.0-1.0,
      "fear": 0.0-1.0,
      "disgust": -0.0-1.0,
      "joy": 0.0-1.0,
      "sadness": 0.0-1.0,
      "surprise": 0.0-1.0,
      "contempt": -0.0-1.0
    }}
  }}
}}
"""
    response = await client.chat.completions.create(
        model=settings.tokendance_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Comment in {lang_name}:\n{comment}\n\nPlayer detected fallacies: {detected}\nPlayer weapon: {weapon_id}\nPlayer rebuttal: {rebuttal or '(none)'}"},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
        max_tokens=1024,
    )
    content = response.choices[0].message.content or "{}"
    result = _extract_json(content)

    # Ensure all expected keys exist
    result.setdefault("fallacy_detection_score", 0)
    result.setdefault("weapon_match_score", 0)
    result.setdefault("rebuttal_score", 0)
    result.setdefault("hit", False)
    result.setdefault("hit_score", 0)
    result.setdefault("reason", "")
    result.setdefault("improvement", "")
    result.setdefault("opponent_reaction", {
        "inner_monologue": "",
        "emotion_delta": {k: 0.0 for k in ["anger", "sarcasm", "fear", "disgust", "joy", "sadness", "surprise", "contempt"]},
    })

    # Recalculate hit_score if missing or invalid
    try:
        fds = float(result["fallacy_detection_score"])
        wms = float(result["weapon_match_score"])
        rs = float(result["rebuttal_score"])
        result["hit_score"] = round(0.4 * fds + 0.3 * wms + 0.3 * rs, 1)
    except (ValueError, TypeError):
        pass

    result["hit"] = bool(result.get("hit_score", 0) >= 70)
    return result


async def generate_agent_move(
    comment: str,
    system_prompt: str,
    weapon_priority: list[str],
    personality: str,
    language: str = "zh",
) -> dict[str, Any]:
    """Ask an Agent (via LLM) to choose a weapon and write a rebuttal."""
    client = get_client()
    lang_name = "Chinese" if language == "zh" else "English"
    weapon_table = _build_weapon_table(language)
    full_prompt = f"""{system_prompt}

You are playing a logical-fallacy battle game. Your personality: {personality}.
Weapon priority (preferred first): {weapon_priority}.
Available weapons:
{weapon_table}

Respond ONLY with a valid JSON object:
{{
  "weapon_id": "one of: clarifier, evidence_shield, reductio_sword, debunk_hammer, causal_lens, statistical_lens, socratic_trap",
  "rebuttal": "a concise rebuttal in {lang_name} that targets the logical fallacy",
  "confidence": 0.0-1.0
}}
"""
    response = await client.chat.completions.create(
        model=settings.tokendance_model,
        messages=[
            {"role": "system", "content": full_prompt},
            {"role": "user", "content": f"Enemy comment in {lang_name}:\n{comment}\n\nChoose your weapon and write a rebuttal."},
        ],
        response_format={"type": "json_object"},
        temperature=0.6,
        max_tokens=1024,
    )
    content = response.choices[0].message.content or "{}"
    return _extract_json(content)


async def generate_level_comments(
    topic: str,
    difficulty: int,
    count: int = 5,
    language: str = "zh",
) -> list[dict[str, Any]]:
    """Generate a batch of comments for a level."""
    client = get_client()
    lang_name = "Chinese" if language == "zh" else "English"
    system_prompt = f"""You are a level designer for a Chinese internet comment battle game.
Generate {count} toxic or logically-flawed comments for a level about "{topic}" (difficulty {difficulty}/5).
Respond ONLY with a valid JSON array. Each item must follow this schema:
{{
  "text_cn": "comment text in Chinese, internet style (Bilibili/Tieba)",
  "text_en": "natural English translation",
  "emotion": {{"anger":0-1, "sarcasm":0-1, "fear":0-1, "disgust":0-1, "joy":0-1, "sadness":0-1, "surprise":0-1, "contempt":0-1}},
  "fallacy_types": ["Chinese fallacy name"],
  "effective_weapons": ["weapon_id"],
  "ineffective_weapons": ["weapon_id"]
}}

Valid weapon_ids: clarifier, evidence_shield, reductio_sword, debunk_hammer, causal_lens, statistical_lens, socratic_trap.
Valid fallacy names (Chinese): 诉诸人身, 滑坡谬误, 稻草人, 非黑即白 / 虚假两难, 幸存者偏差, 诉诸权威, 偷换概念, 诉诸情感, 循环论证, 虚假因果, 以偏概全, 诱导性问题.

Make comments varied, emotionally charged, and realistically annoying. Include at least one compound fallacy for difficulty >= 4.
"""
    response = await client.chat.completions.create(
        model=settings.tokendance_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Generate {count} comments. Output language context: {lang_name}."},
        ],
        response_format={"type": "json_object"},
        temperature=0.8,
        max_tokens=4096,
    )
    content = response.choices[0].message.content or "[]"
    data = _extract_json(content)
    if isinstance(data, dict) and "comments" in data:
        return data["comments"]
    if isinstance(data, list):
        return data
    return []

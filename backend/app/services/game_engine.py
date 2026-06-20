from typing import Any


def compute_battle_result(
    hit_score: float,
    combo: int = 0,
    enemy_rage: float = 0,
    sanity: float = 100,
) -> dict[str, Any]:
    """Compute HP/Rage/Sanity changes from a single move."""
    hit_score = max(0, min(100, hit_score))
    base_damage = hit_score * 0.8
    combo_bonus = min(combo * 5, 25)
    total_damage = base_damage + combo_bonus

    rage_increase = 0.0
    sanity_cost = 0.0
    if hit_score >= 70:
        rage_increase = -10 if enemy_rage >= 10 else 0
        sanity_cost = 0
        combo_next = combo + 1
    elif hit_score >= 40:
        rage_increase = 5
        sanity_cost = 5
        combo_next = 0
    else:
        rage_increase = 15
        sanity_cost = 10
        combo_next = 0

    return {
        "damage": round(total_damage, 1),
        "enemy_rage_delta": round(rage_increase, 1),
        "sanity_cost": round(sanity_cost, 1),
        "combo_next": combo_next,
        "hit_score": round(hit_score, 1),
    }

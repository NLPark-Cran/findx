export interface Fallacy {
  id: string;
  zh: string;
  en: string;
  description_zh: string;
  description_en: string;
  icon: string;
  effective_weapon_ids: string[];
}

export const FALLACIES: Fallacy[] = [
  {
    id: "ad_hominem",
    zh: "诉诸人身",
    en: "Ad Hominem",
    description_zh: "攻击对方人格，而非论证本身",
    description_en: "Attacking the person instead of the argument",
    icon: "🤡",
    effective_weapon_ids: ["clarifier", "evidence_shield", "socratic_trap"],
  },
  {
    id: "slippery_slope",
    zh: "滑坡谬误",
    en: "Slippery Slope",
    description_zh: "把可能性无限推演成必然灾难",
    description_en: "Sliding from possibility to inevitable disaster",
    icon: "🛝",
    effective_weapon_ids: ["causal_lens", "reductio_sword", "clarifier"],
  },
  {
    id: "straw_man",
    zh: "稻草人",
    en: "Straw Man",
    description_zh: "歪曲对方观点后再攻击",
    description_en: "Distorting the opponent's argument before attacking it",
    icon: "🌾",
    effective_weapon_ids: ["clarifier", "debunk_hammer", "evidence_shield"],
  },
  {
    id: "false_dilemma",
    zh: "非黑即白",
    en: "False Dilemma",
    description_zh: "只给出两个极端选项，忽略中间地带",
    description_en: "Presenting only two extreme options while ignoring alternatives",
    icon: "⚫",
    effective_weapon_ids: ["socratic_trap", "clarifier", "reductio_sword"],
  },
  {
    id: "survivorship_bias",
    zh: "幸存者偏差",
    en: "Survivorship Bias",
    description_zh: "只看见成功案例，忽略沉默的大多数",
    description_en: "Only seeing successes while ignoring the silent majority",
    icon: "🎰",
    effective_weapon_ids: ["statistical_lens", "evidence_shield", "clarifier"],
  },
  {
    id: "appeal_to_authority",
    zh: "诉诸权威",
    en: "Appeal to Authority",
    description_zh: "用权威身份代替证据",
    description_en: "Using authority status in place of evidence",
    icon: "👑",
    effective_weapon_ids: ["evidence_shield", "clarifier", "socratic_trap"],
  },
  {
    id: "equivocation",
    zh: "偷换概念",
    en: "Equivocation",
    description_zh: "悄悄改变关键词含义",
    description_en: "Subtly changing the meaning of a key term",
    icon: "🎭",
    effective_weapon_ids: ["clarifier", "debunk_hammer", "socratic_trap"],
  },
  {
    id: "appeal_to_emotion",
    zh: "诉诸情感",
    en: "Appeal to Emotion",
    description_zh: "用情绪煽动代替逻辑论证",
    description_en: "Replacing logic with emotional manipulation",
    icon: "🔥",
    effective_weapon_ids: ["clarifier", "evidence_shield", "reductio_sword"],
  },
  {
    id: "circular_reasoning",
    zh: "循环论证",
    en: "Circular Reasoning",
    description_zh: "结论伪装成前提",
    description_en: "The conclusion is disguised as a premise",
    icon: "🔄",
    effective_weapon_ids: ["socratic_trap", "clarifier", "reductio_sword"],
  },
  {
    id: "false_causality",
    zh: "虚假因果",
    en: "False Causality",
    description_zh: "把相关当成因果",
    description_en: "Confusing correlation with causation",
    icon: "📉",
    effective_weapon_ids: ["causal_lens", "statistical_lens", "clarifier"],
  },
  {
    id: "hasty_generalization",
    zh: "以偏概全",
    en: "Hasty Generalization",
    description_zh: "从少量样本推出普遍结论",
    description_en: "Drawing broad conclusions from a small sample",
    icon: "🗺️",
    effective_weapon_ids: ["statistical_lens", "evidence_shield", "clarifier"],
  },
  {
    id: "loaded_question",
    zh: "诱导性问题",
    en: "Loaded Question",
    description_zh: "问题里藏了未经验证的预设",
    description_en: "A question that smuggles in an unproven assumption",
    icon: "🪤",
    effective_weapon_ids: ["socratic_trap", "clarifier", "reductio_sword"],
  },
];

export function getFallacyById(id: string): Fallacy | undefined {
  return FALLACIES.find((f) => f.id === id);
}

export function getFallacyByName(name: string): Fallacy | undefined {
  const normalized = name.trim().toLowerCase();
  return FALLACIES.find(
    (f) =>
      f.id.toLowerCase() === normalized ||
      f.zh.toLowerCase() === normalized ||
      f.en.toLowerCase() === normalized ||
      f.zh.toLowerCase().split(" / ").includes(normalized)
  );
}

export function labelFallacy(f: Fallacy, locale: string): string {
  return locale === "zh" ? `${f.zh} / ${f.en}` : `${f.en} / ${f.zh}`;
}

export interface Weapon {
  id: string;
  name: { zh: string; en: string };
  description: { zh: string; en: string };
  icon: string;
  color: string;
  pixelColor: string;
  target_fallacies: string[];
}

export const WEAPONS: Weapon[] = [
  {
    id: "clarifier",
    name: { zh: "逻辑澄清弹", en: "Clarifier" },
    description: {
      zh: "澄清论点的真实含义，拆穿偷换概念或稻草人",
      en: "Clarify the actual claim and expose straw men",
    },
    icon: "💡",
    color: "bg-yellow-500",
    pixelColor: "#fbbf24",
    target_fallacies: ["straw_man", "equivocation", "false_dilemma", "appeal_to_emotion", "loaded_question"],
  },
  {
    id: "evidence_shield",
    name: { zh: "证据护盾", en: "Evidence Shield" },
    description: {
      zh: "要求对方出示证据，挡住人身攻击与情感绑架",
      en: "Demand evidence to block ad hominem and emotional appeals",
    },
    icon: "🛡️",
    color: "bg-blue-500",
    pixelColor: "#60a5fa",
    target_fallacies: ["ad_hominem", "appeal_to_authority", "appeal_to_emotion", "hasty_generalization", "survivorship_bias"],
  },
  {
    id: "reductio_sword",
    name: { zh: "归谬剑", en: "Reductio Sword" },
    description: {
      zh: "把对方逻辑推向极端，暴露其荒谬性",
      en: "Push the opponent's logic to its absurd extreme",
    },
    icon: "⚔️",
    color: "bg-red-500",
    pixelColor: "#f87171",
    target_fallacies: ["false_dilemma", "slippery_slope", "circular_reasoning", "loaded_question", "appeal_to_emotion"],
  },
  {
    id: "debunk_hammer",
    name: { zh: "拆解锤", en: "Debunk Hammer" },
    description: {
      zh: "逐条拆解对方论证中的错误构造",
      en: "Dismantle the structure of the opponent's argument",
    },
    icon: "🔨",
    color: "bg-orange-500",
    pixelColor: "#fb923c",
    target_fallacies: ["straw_man", "equivocation", "false_causality"],
  },
  {
    id: "causal_lens",
    name: { zh: "因果显微镜", en: "Causal Lens" },
    description: {
      zh: "检查因果链条，找出相关不等于因果",
      en: "Inspect the causal chain; correlation is not causation",
    },
    icon: "🔬",
    color: "bg-cyan-500",
    pixelColor: "#22d3ee",
    target_fallacies: ["false_causality", "slippery_slope"],
  },
  {
    id: "statistical_lens",
    name: { zh: "统计透镜", en: "Statistical Lens" },
    description: {
      zh: "用样本与数据审视以偏概全和幸存者偏差",
      en: "Use sample and data to examine generalizations and biases",
    },
    icon: "📊",
    color: "bg-green-500",
    pixelColor: "#4ade80",
    target_fallacies: ["hasty_generalization", "survivorship_bias", "false_causality"],
  },
  {
    id: "socratic_trap",
    name: { zh: "反问陷阱", en: "Socratic Trap" },
    description: {
      zh: "用反问迫使对方暴露前提漏洞",
      en: "Force the opponent to expose hidden premises with questions",
    },
    icon: "❓",
    color: "bg-purple-500",
    pixelColor: "#c084fc",
    target_fallacies: ["false_dilemma", "circular_reasoning", "loaded_question", "equivocation", "appeal_to_authority"],
  },
];

export function getWeaponById(id: string): Weapon | undefined {
  return WEAPONS.find((w) => w.id === id);
}

export function labelWeapon(w: Weapon, locale: string): string {
  return locale === "zh" ? `${w.name.zh} / ${w.name.en}` : `${w.name.en} / ${w.name.zh}`;
}

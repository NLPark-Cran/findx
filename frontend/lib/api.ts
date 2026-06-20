export interface LevelSummary {
  id: string;
  slug: string;
  title_cn: string;
  title_en: string;
  topic: string;
  difficulty: number;
  tags: string[];
}

export interface Comment {
  id: string;
  text_cn: string;
  text_en: string;
  emotion: Record<string, number>;
  fallacy_types: string[];
  effective_weapons: string[];
  ineffective_weapons: string[];
}

export interface LevelDetail extends LevelSummary {
  description_cn: string;
  description_en: string;
  comments: Comment[];
}

export interface MoveEvaluation {
  hit: boolean;
  hit_score: number;
  fallacy_detection_score: number;
  weapon_match_score: number;
  rebuttal_score: number;
  reason: string;
  improvement: string;
  opponent_reaction: {
    inner_monologue: string;
    emotion_delta: Record<string, number>;
  };
}

export interface BattleResult {
  damage: number;
  enemy_rage_delta: number;
  sanity_cost: number;
  combo_next: number;
  hit_score: number;
}

export interface MoveResult {
  evaluation: MoveEvaluation;
  battle: BattleResult;
}

const API_BASE = "/api";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listLevels: () => fetchJson<LevelSummary[]>("/levels"),

  getLevel: (id: string) => fetchJson<LevelDetail>(`/levels/${id}`),

  submitMove: (payload: {
    comment: string;
    fallacy_types: string[];
    detected_fallacies: string[];
    weapon_id: string;
    rebuttal: string;
    combo: number;
    language: string;
  }) => fetchJson<MoveResult>("/game/submit-move", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  finishGame: (payload: {
    user_id?: string;
    level_id?: string;
    score: number;
    max_combo: number;
    hits: number;
    misses: number;
  }) => fetchJson<{ match_id: string; score: number }>("/game/finish", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  analyzeSentiment: (text: string, language: string) =>
    fetchJson<{ emotion: Record<string, number>; fallacy_types: string[] }>("/sentiment/analyze", {
      method: "POST",
      body: JSON.stringify({ text, language }),
    }),

  createPvPRoom: (topic: string, language: string) =>
    fetchJson<{ room_id: string; topic: string; language: string }>("/pvp/rooms", {
      method: "POST",
      body: JSON.stringify({ topic, language }),
    }),

  createAgent: (payload: {
    owner_username: string;
    name: string;
    system_prompt: string;
    is_public?: boolean;
  }) => fetchJson<{ id: string; name: string; agent_key: string; version: number }>("/agent/fighters", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  getAgentLeaderboard: () => fetchJson<Array<{ id: string; name: string; rank_score: number; wins: number; losses: number; draws: number }>>("/agent/leaderboard"),
};

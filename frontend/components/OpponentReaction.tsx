"use client";

import { motion } from "framer-motion";

interface OpponentReactionProps {
  innerMonologue: string;
  emotionDelta: Record<string, number>;
  locale?: string;
}

const LABELS_ZH: Record<string, string> = {
  anger: "愤怒",
  sarcasm: "讽刺",
  fear: "恐惧",
  disgust: "厌恶",
  joy: "喜悦",
  sadness: "悲伤",
  surprise: "惊讶",
  contempt: "轻蔑",
};

const LABELS_EN: Record<string, string> = {
  anger: "Anger",
  sarcasm: "Sarcasm",
  fear: "Fear",
  disgust: "Disgust",
  joy: "Joy",
  sadness: "Sadness",
  surprise: "Surprise",
  contempt: "Contempt",
};

export function OpponentReaction({ innerMonologue, emotionDelta, locale = "zh" }: OpponentReactionProps) {
  const labels = locale === "zh" ? LABELS_ZH : LABELS_EN;

  const sorted = Object.entries(emotionDelta || {})
    .filter(([, v]) => Math.abs(v) > 0.01)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-muted/50 p-4"
    >
      <div className="flex items-start gap-3">
        <img
          src="/assets/enemy-troll_001.jpg"
          alt="enemy"
          className="h-11 w-11 rounded-xl object-cover shadow-sm"
        />
        <div className="flex-1">
          <div className="text-xs font-medium text-muted-foreground">
            {locale === "zh" ? "💭 对方 OS" : "💭 Opponent OS"}
          </div>
          <p className="mt-1 text-sm italic text-foreground">“{innerMonologue}”</p>

          {sorted.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {sorted.map(([key, value]) => {
                const isUp = value > 0;
                return (
                  <span
                    key={key}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      isUp ? "bg-destructive/10 text-destructive" : "bg-accent/15 text-accent"
                    }`}
                  >
                    {labels[key] || key} {isUp ? "↑" : "↓"} {Math.abs(value).toFixed(1)}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

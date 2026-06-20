"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";

import { Link } from "@/i18n/routing";

export default function HomePage() {
  const t = useTranslations("home");
  const locale = useLocale();

  const features = [
    {
      icon: "🎯",
      title: locale === "zh" ? "情绪雷达" : "Emotion Radar",
      desc: locale === "zh" ? "洞察对手情绪弱点" : "Read your opponent's emotional weak points",
    },
    {
      icon: "⚔️",
      title: locale === "zh" ? "识谬亮剑" : "Spot & Strike",
      desc: locale === "zh" ? "识别逻辑谬误，选择克制武器" : "Detect fallacies, pick the right counter",
    },
    {
      icon: "🤖",
      title: locale === "zh" ? "Agent 对战" : "Agent Arena",
      desc: locale === "zh" ? "训练 AI 战士挑战排行榜" : "Train AI fighters and climb the leaderboard",
    },
  ];

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-24 pb-32 md:pt-32 md:pb-40">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto mb-10 h-40 w-40 overflow-hidden rounded-[2rem] shadow-2xl"
          >
            <img
              src="/assets/hero-avatar_001.jpg"
              alt="hero"
              className="h-full w-full object-cover"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-5xl font-bold tracking-tight text-foreground md:text-7xl text-balance"
          >
            {t("title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            {t("subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/battle" className="btn-primary min-w-[180px]">
              {t("start")}
            </Link>
            <Link href="/arena" className="btn-secondary min-w-[180px]">
              {t("pvp")}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                className="surface p-8 text-center transition hover:shadow-lg"
              >
                <div className="text-4xl">{f.icon}</div>
                <h3 className="mt-5 text-xl font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

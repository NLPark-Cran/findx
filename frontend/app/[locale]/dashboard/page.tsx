"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type LevelSummary } from "@/lib/api";

export default function DashboardPage() {
  const t = useTranslations("common");
  const locale = useLocale();
  const [levels, setLevels] = useState<LevelSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listLevels()
      .then(setLevels)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxDifficulty = levels.reduce((acc, l) => Math.max(acc, l.difficulty), 0);

  const labels = {
    levels: locale === "zh" ? "关卡数" : "Levels",
    topics: locale === "zh" ? "话题数" : "Topics",
    difficulty: locale === "zh" ? "最高难度" : "Max Difficulty",
  };

  if (loading) {
    return <div className="mx-auto max-w-4xl px-6 py-8">{t("loading")}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-10 text-3xl font-bold tracking-tight text-foreground">
        {locale === "zh" ? "数据面板" : "Dashboard"}
      </h1>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="surface">
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">{labels.levels}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{levels.length}</div>
          </CardContent>
        </Card>
        <Card className="surface">
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">{labels.topics}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{new Set(levels.map((l) => l.topic)).size}</div>
          </CardContent>
        </Card>
        <Card className="surface">
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">{labels.difficulty}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{maxDifficulty}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {levels.map((level) => (
          <Card key={level.id} className="surface">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {locale === "zh" ? level.title_cn : level.title_en}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">{level.topic}</div>
              <div className="mt-2 text-sm text-primary">{"⭐".repeat(level.difficulty)}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

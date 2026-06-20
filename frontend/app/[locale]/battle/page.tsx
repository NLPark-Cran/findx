"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmotionRadar } from "@/components/EmotionRadar";
import { WeaponHand, WeaponMini } from "@/components/WeaponHand";
import { FallacyDetector } from "@/components/FallacyDetector";
import { OpponentReaction } from "@/components/OpponentReaction";
import { api } from "@/lib/api";
import { getFallacyById, labelFallacy } from "@/lib/fallacies";

interface Level {
  id: string;
  slug: string;
  title_cn: string;
  title_en: string;
  topic: string;
  difficulty: number;
}

interface Comment {
  id: string;
  text_cn: string;
  text_en: string;
  emotion: Record<string, number>;
  fallacy_types: string[];
  effective_weapons: string[];
  ineffective_weapons: string[];
}

interface MoveResult {
  evaluation: {
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
  };
  battle: {
    damage: number;
    combo_next: number;
  };
}

type Step = "detect" | "weapon" | "rebuttal" | "result";

export default function BattlePage() {
  const t = useTranslations("battle");
  const locale = useLocale();

  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<Step>("detect");
  const [detectedFallacies, setDetectedFallacies] = useState<string[]>([]);
  const [selectedWeapon, setSelectedWeapon] = useState<string>();
  const [rebuttal, setRebuttal] = useState("");
  const [result, setResult] = useState<MoveResult | null>(null);
  const [showHint, setShowHint] = useState(false);

  const [enemyHp, setEnemyHp] = useState(100);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    api.listLevels().then(setLevels).catch(console.error);
  }, []);

  const startLevel = async (level: Level) => {
    setLoading(true);
    const data = await api.getLevel(level.id);
    setSelectedLevel(level);
    setComments(data.comments || []);
    setIndex(0);
    setEnemyHp(100);
    setScore(0);
    setCombo(0);
    setHits(0);
    setMisses(0);
    setFinished(false);
    resetMove();
    setLoading(false);
  };

  const resetMove = () => {
    setStep("detect");
    setDetectedFallacies([]);
    setSelectedWeapon(undefined);
    setRebuttal("");
    setResult(null);
    setShowHint(false);
  };

  const current = comments[index];

  const recommendedWeapons = useMemo(() => {
    const ids = new Set<string>();
    detectedFallacies.forEach((fid) => {
      const f = getFallacyById(fid);
      f?.effective_weapon_ids.forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [detectedFallacies]);

  const submitMove = async () => {
    if (!current || !selectedWeapon) return;
    setLoading(true);
    const data = await api.submitMove({
      comment: locale === "zh" ? current.text_cn : current.text_en,
      fallacy_types: current.fallacy_types,
      detected_fallacies: detectedFallacies.map((fid) => {
        const f = getFallacyById(fid);
        return f ? (locale === "zh" ? f.zh : f.en) : fid;
      }),
      weapon_id: selectedWeapon,
      rebuttal,
      combo,
      language: locale,
    });
    setResult(data);
    setEnemyHp((hp) => Math.max(0, hp - data.battle.damage));
    setScore((s) => s + Math.round(data.battle.damage));
    setCombo(data.battle.combo_next);
    if (data.evaluation.hit) setHits((h) => h + 1);
    else setMisses((m) => m + 1);
    setStep("result");
    setShowHint(true);
    setLoading(false);
  };

  const nextComment = () => {
    if (index + 1 >= comments.length || enemyHp <= 0) {
      setFinished(true);
      api.finishGame({
        level_id: selectedLevel?.id,
        score,
        max_combo: combo,
        hits,
        misses,
      }).catch(console.error);
    } else {
      setIndex((i) => i + 1);
      resetMove();
    }
  };

  if (!selectedLevel) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {t("choose_level")}
          </h1>
          <p className="mt-3 text-muted-foreground">{t("choose_level_subtitle")}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {levels.map((level) => (
            <Card
              key={level.id}
              className="surface cursor-pointer transition hover:shadow-lg"
              onClick={() => startLevel(level)}
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {locale === "zh" ? level.title_cn : level.title_en}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="border-border text-muted-foreground">
                  {level.topic}
                </Badge>
                <div className="mt-3 text-sm text-primary">
                  {locale === "zh" ? "难度 " : "Difficulty "}{"⭐".repeat(level.difficulty)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-6xl">
          {enemyHp <= 0 ? "🏆" : "📜"}
        </motion.div>
        <h1 className="mt-6 text-3xl font-bold">{enemyHp <= 0 ? t("victory") : t("defeat")}</h1>
        <p className="mt-4 text-muted-foreground">
          {t("score")}: {score} | {t("combo")}: {combo} | {t("damage")}: {100 - enemyHp}
        </p>
        <Button className="mt-8 btn-primary" onClick={() => setSelectedLevel(null)}>
          {t("choose_level")}
        </Button>
      </div>
    );
  }

  if (!current) return null;

  const commentText = locale === "zh" ? current.text_cn : current.text_en;
  const commentTranslation = locale === "zh" ? current.text_en : current.text_cn;

  const stepTitle = {
    detect: t("detect_fallacy"),
    weapon: t("select_weapon"),
    rebuttal: t("write_rebuttal"),
    result: t("result"),
  }[step];

  const stepNumber = { detect: 1, weapon: 2, rebuttal: 3, result: 4 }[step];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {locale === "zh" ? selectedLevel.title_cn : selectedLevel.title_en}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {locale === "zh" ? `第 ${index + 1} 轮` : `Round ${index + 1}`} / {comments.length}
          </p>
        </div>
        <div className="flex items-center gap-6 text-right">
          <div>
            <div className="text-xs text-muted-foreground">{t("score")}</div>
            <div className="text-2xl font-bold text-primary">{score}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t("combo")}</div>
            <div className="text-2xl font-bold text-accent">{combo}</div>
          </div>
        </div>
      </div>

      <Progress value={enemyHp} className="mb-8 h-2 bg-muted" />

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`h-2 rounded-full transition-all ${
              stepNumber >= n ? "w-8 bg-primary" : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: enemy comment + radar */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <Card className="surface overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">{t("comment")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4 rounded-2xl bg-muted/50 p-6">
                  <img
                    src="/assets/enemy-troll_001.jpg"
                    alt="enemy"
                    className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover shadow-md"
                  />
                  <div className="flex-1">
                    <p className="text-lg font-medium leading-relaxed text-foreground">{commentText}</p>
                    <p className="mt-2 text-sm italic text-muted-foreground">{commentTranslation}</p>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">{t("actual_fallacies")}</span>
                    {!showHint && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowHint(true)}
                        className="h-8 text-xs text-primary hover:bg-primary/10"
                      >
                        {locale === "zh" ? "🔍 点击提示" : "🔍 Show Hint"}
                      </Button>
                    )}
                  </div>
                  {showHint ? (
                    <div className="flex flex-wrap gap-2">
                      {current.fallacy_types.map((f) => (
                        <Badge key={f} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                      {locale === "zh" ? "提示已隐藏，点击上方按钮查看" : "Hint hidden. Click the button above to reveal."}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-2 text-sm font-medium text-muted-foreground">{t("emotion_radar")}</div>
                  <EmotionRadar emotion={current.emotion} language={locale} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Right: step panel */}
        <div className="space-y-6">
          <Card className="surface">
            <CardHeader>
              <CardTitle className="text-base font-medium text-muted-foreground">{stepTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {step === "detect" && (
                <>
                  <p className="text-sm text-muted-foreground">{t("detect_hint")}</p>
                  <FallacyDetector
                    selected={detectedFallacies}
                    onChange={setDetectedFallacies}
                    locale={locale}
                    max={2}
                  />
                  <Button
                    onClick={() => setStep("weapon")}
                    disabled={detectedFallacies.length === 0}
                    className="w-full btn-primary"
                  >
                    {t("next_step")}
                  </Button>
                </>
              )}

              {step === "weapon" && (
                <>
                  <div className="text-sm text-muted-foreground">
                    {t("detected")}: {" "}
                    {detectedFallacies.map((fid) => {
                      const f = getFallacyById(fid);
                      return f ? (
                        <Badge key={fid} className="mr-1 bg-accent/15 text-accent">
                          {labelFallacy(f, locale)}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                  <WeaponHand
                    selected={selectedWeapon}
                    onSelect={setSelectedWeapon}
                    locale={locale}
                    recommended={recommendedWeapons}
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep("detect")} className="flex-1 btn-secondary">
                      {t("back")}
                    </Button>
                    <Button
                      onClick={() => setStep("rebuttal")}
                      disabled={!selectedWeapon}
                      className="flex-1 btn-primary"
                    >
                      {t("next_step")}
                    </Button>
                  </div>
                </>
              )}

              {step === "rebuttal" && (
                <>
                  <div className="rounded-xl bg-muted/50 p-4 text-sm">
                    <div className="text-muted-foreground">{t("detected")}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {detectedFallacies.map((fid) => {
                        const f = getFallacyById(fid);
                        return f ? <WeaponMini key={fid} id={fid} locale={locale} /> : null;
                      })}
                    </div>
                    <div className="mt-3 text-muted-foreground">{t("selected_weapon")}</div>
                    <div className="mt-2">
                      {selectedWeapon && <WeaponMini id={selectedWeapon} locale={locale} />}
                    </div>
                  </div>
                  <Textarea
                    value={rebuttal}
                    onChange={(e) => setRebuttal(e.target.value)}
                    placeholder={t("rebuttal_placeholder")}
                    className="min-h-[120px] rounded-xl border-border bg-muted/30"
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep("weapon")} className="flex-1 btn-secondary">
                      {t("back")}
                    </Button>
                    <Button
                      onClick={submitMove}
                      disabled={loading}
                      className="flex-1 btn-primary"
                    >
                      {loading ? t("judging") : t("submit")}
                    </Button>
                  </div>
                </>
              )}

              {step === "result" && result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-muted/50 p-3">
                      <div className="text-xs text-muted-foreground">{t("fallacy_detection")}</div>
                      <div className="text-xl font-bold text-primary">{Math.round(result.evaluation.fallacy_detection_score)}</div>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3">
                      <div className="text-xs text-muted-foreground">{t("weapon_match")}</div>
                      <div className="text-xl font-bold text-accent">{Math.round(result.evaluation.weapon_match_score)}</div>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3">
                      <div className="text-xs text-muted-foreground">{t("rebuttal_quality")}</div>
                      <div className="text-xl font-bold text-destructive">{Math.round(result.evaluation.rebuttal_score)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-primary/10 p-4">
                    <span className="font-medium">{t("total_damage")}</span>
                    <span className="text-2xl font-bold text-primary">{Math.round(result.battle.damage)}</span>
                  </div>

                  <p className="text-sm text-foreground">{result.evaluation.reason}</p>
                  {result.evaluation.improvement && (
                    <p className="text-xs text-muted-foreground">💡 {result.evaluation.improvement}</p>
                  )}

                  <OpponentReaction
                    innerMonologue={result.evaluation.opponent_reaction.inner_monologue}
                    emotionDelta={result.evaluation.opponent_reaction.emotion_delta}
                    locale={locale}
                  />

                  <Button onClick={nextComment} className="w-full btn-primary">
                    {t("next")}
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

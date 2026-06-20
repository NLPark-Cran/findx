"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

export default function AgentPage() {
  const t = useTranslations("agent");
  const locale = useLocale();
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [agentKey, setAgentKey] = useState("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [response, setResponse] = useState("");

  const create = async () => {
    const data = await api.createAgent({ owner_username: owner, name, system_prompt: prompt, is_public: true });
    setAgentKey(data.agent_key);
    setResponse(JSON.stringify(data, null, 2));
  };

  const fetchLeaderboard = async () => {
    setLeaderboard(await api.getAgentLeaderboard());
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>

      <Card className="surface">
        <CardHeader>
          <CardTitle className="text-base font-medium">{t("create")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Owner username"
            className="rounded-xl border-border bg-muted/30"
          />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
            className="rounded-xl border-border bg-muted/30"
          />
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t("system_prompt")}
            className="min-h-[120px] rounded-xl border-border bg-muted/30"
          />
          <Button onClick={create} className="btn-primary">
            {t("create")}
          </Button>
          {agentKey && (
            <div className="rounded-2xl border border-border bg-muted/50 p-4 text-xs break-all text-foreground">
              <strong>Agent Key:</strong> {agentKey}
            </div>
          )}
          {response && (
            <pre className="mt-2 max-h-40 overflow-auto rounded-2xl border border-border bg-muted/50 p-4 text-xs text-foreground">
              {response}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card className="surface mt-6">
        <CardHeader>
          <CardTitle className="text-base font-medium">{t("leaderboard")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" onClick={fetchLeaderboard} className="btn-secondary">
            Load
          </Button>
          <div className="mt-4 space-y-2">
            {leaderboard.map((a) => (
              <div
                key={a.id}
                className="flex justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm"
              >
                <span className="text-foreground">{a.name}</span>
                <span className="font-mono text-primary">{a.rank_score}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

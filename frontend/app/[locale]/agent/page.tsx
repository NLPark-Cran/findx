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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>{t("create")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner username" className="bg-white/5" />
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name")} className="bg-white/5" />
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t("system_prompt")} className="bg-white/5" />
          <Button onClick={create}>{t("create")}</Button>
          {agentKey && (
            <div className="rounded bg-black/30 p-3 text-xs break-all">
              <strong>Agent Key:</strong> {agentKey}
            </div>
          )}
          {response && <pre className="mt-2 max-h-40 overflow-auto rounded bg-black/30 p-3 text-xs">{response}</pre>}
        </CardContent>
      </Card>

      <Card className="mt-6 border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>{t("leaderboard")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" onClick={fetchLeaderboard}>Load</Button>
          <div className="mt-4 space-y-2">
            {leaderboard.map((a) => (
              <div key={a.id} className="flex justify-between rounded bg-white/5 px-3 py-2">
                <span>{a.name}</span>
                <span className="font-mono text-pink-400">{a.rank_score}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

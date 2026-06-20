"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function ArenaPage() {
  const t = useTranslations("arena");
  const locale = useLocale();
  const [roomId, setRoomId] = useState("");
  const [nickname, setNickname] = useState("Player");
  const [log, setLog] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connect = (id: string) => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/api/pvp/ws/${id}`);
    socket.onopen = () => {
      socket.send(JSON.stringify({ nickname }));
      setLog((l) => [...l, "Connected"]);
    };
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setLog((l) => [...l, `${data.type}: ${JSON.stringify(data)}`]);
    };
    socket.onclose = () => setLog((l) => [...l, "Disconnected"]);
    setWs(socket);
  };

  const createRoom = async () => {
    const data = await api.createPvPRoom("general", locale);
    setRoomId(data.room_id);
    connect(data.room_id);
  };

  const joinRoom = () => {
    if (roomId) connect(roomId);
  };

  const sendMove = () => {
    ws?.send(JSON.stringify({ type: "move", weapon_id: "clarifier", rebuttal: "test" }));
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
      <Card className="surface">
        <CardHeader>
          <CardTitle className="text-base font-medium">{t("join_room")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t("nickname")}
            className="rounded-xl border-border bg-muted/30"
          />
          <Input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder={t("room_id")}
            className="rounded-xl border-border bg-muted/30"
          />
          <div className="flex flex-wrap gap-3">
            <Button onClick={createRoom} className="btn-primary">
              {t("create_room")}
            </Button>
            <Button variant="secondary" onClick={joinRoom} className="btn-secondary">
              {t("join_room")}
            </Button>
            <Button variant="outline" onClick={sendMove} className="btn-secondary">
              Send Test Move
            </Button>
          </div>
          <div className="mt-4 max-h-64 overflow-auto rounded-2xl border border-border bg-muted/50 p-4 font-mono text-xs text-foreground">
            {log.map((l, i) => (
              <div key={i} className="mb-1">
                {l}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

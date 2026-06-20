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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>{t("join_room")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={t("nickname")} className="bg-white/5" />
          <Input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder={t("room_id")} className="bg-white/5" />
          <div className="flex gap-2">
            <Button onClick={createRoom}>{t("create_room")}</Button>
            <Button variant="secondary" onClick={joinRoom}>{t("join_room")}</Button>
            <Button variant="outline" onClick={sendMove}>Send Test Move</Button>
          </div>
          <div className="mt-4 rounded bg-black/30 p-3 font-mono text-xs">
            {log.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PvPMsg {
  type: "system" | "opponent" | "self";
  content: string;
}

export default function PvPPage() {
  const locale = useLocale();
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<PvPMsg[]>([]);
  const [input, setInput] = useState("");

  const label = {
    title: locale === "zh" ? "在线对战" : "PvP Battle",
    connect: locale === "zh" ? "匹配对手" : "Match Opponent",
    send: locale === "zh" ? "发送" : "Send",
    waiting: locale === "zh" ? "等待对手…" : "Waiting for opponent...",
  };

  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  function connect() {
    const ws = new WebSocket("wss://findx.hub.tt2.li/api/game/ws/pvp");
    wsRef.current = ws;
    ws.onopen = () => {
      setConnected(true);
      setMessages([{ type: "system", content: label.waiting }]);
    };
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const content = typeof data === "string" ? data : data.message || JSON.stringify(data);
        const from = data.from === "self" ? "self" : "opponent";
        setMessages((m) => [...m, { type: from === "self" ? "self" : "opponent", content }]);
      } catch {
        setMessages((m) => [...m, { type: "system", content: e.data }]);
      }
    };
    ws.onclose = () => setConnected(false);
  }

  function send() {
    if (!input.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "move", payload: input }));
    setMessages((m) => [...m, { type: "self", content: input }]);
    setInput("");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">{label.title}</h1>

      <Card className="surface">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">
            {connected ? "● Live" : "○ Offline"}
          </CardTitle>
          {!connected && (
            <Button onClick={connect} className="btn-primary">
              {label.connect}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-96 overflow-y-auto rounded-2xl border border-border bg-muted/50 p-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-3 text-sm ${
                    msg.type === "system"
                      ? "text-center text-xs text-muted-foreground"
                      : msg.type === "self"
                      ? "text-right text-primary"
                      : "text-left text-foreground"
                  }`}
                >
                  {msg.content}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="mt-4 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={locale === "zh" ? "输入你的反驳…" : "Type your rebuttal..."}
              className="rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <Button onClick={send} disabled={!connected} className="btn-primary">
              {label.send}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

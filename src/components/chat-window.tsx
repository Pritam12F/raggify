"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { ChatMessage } from "@/components/chat-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, SendHorizonal } from "lucide-react";
import { Entry, Message } from "@/generated/prisma/client";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useLoadingContext } from "@/context/loading";
import ThinkingIndicator from "./thinking-indicator";

export type SelectedSourceType = {
  id: string;
  title: string;
  type: "PDF" | "URL" | "TEXT";
};

export function ChatWindow() {
  const [sources, setSources] = useState<Entry[]>([]);
  const [isPending, startTransition] = useTransition();
  const [chatVal, setChatVal] = useState("");
  const [selectedSource, setSelectedSource] = useState<SelectedSourceType>();
  const messageRef = useRef<HTMLDivElement>(null);
  const { isFilePending, isURLPending, isTextPending } = useLoadingContext();
  const thinkingAnimateVal = ["Thinking.", "Thinking..", "Thinking..."];

  // Fetch sources on mount
  useEffect(() => {
    startTransition(async () => {
      const res = await fetch("/api/v1/entries");
      const entries = (await res.json()).entries as Entry[];
      setSources(entries ?? []);
      if (entries.length && !selectedSource) {
        setSelectedSource({
          id: entries[0].id,
          title: entries[0].title ?? "Text",
          type: entries[0].type,
        });
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFilePending, isURLPending, isTextPending]);

  const { sendMessage, messages, setMessages, status } = useChat({
    id: selectedSource?.id,
    transport: new DefaultChatTransport({ api: "/api/v1/chat" }),
  });

  // Fetch messages when source changes
  const fetchMessages = useCallback(
    (source: SelectedSourceType) => {
      startTransition(async () => {
        const res = await fetch("/api/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId: source.id }),
        });
        const data = await res.json();
        const msgs = (data.messages as Message[]) ?? [];
        setMessages(
          msgs.map((m) => ({
            id: m.id,
            role: m.role as UIMessage["role"],
            parts: [{ type: "text" as const, text: m.content }],
          })),
        );
      });
    },
    [startTransition, setMessages],
  );

  useEffect(() => {
    if (selectedSource) {
      fetchMessages(selectedSource);
    }
  }, [selectedSource, fetchMessages]);

  useEffect(() => {
    if (!messageRef.current) return;

    messageRef.current?.scrollIntoView();
  }, [messages]);

  const handleChange = (value: string) => {
    const found = sources.find((s) => s.id === value)!;
    setSelectedSource({
      id: found.id,
      title: found.title ?? "text",
      type: found.type,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chatVal.trim()) return;

    sendMessage(
      { text: chatVal },
      {
        body: {
          entry: selectedSource?.title,
          entryId: selectedSource?.id,
        },
      },
    );
    setChatVal("");
  };

  const displayName = selectedSource?.title.replaceAll("_", ".") ?? "text";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-zinc-700/50 px-5 py-3.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20">
          <span className="text-xs font-bold text-emerald-400">2</span>
        </div>
        <h2 className="text-sm font-semibold text-zinc-200">Chat</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-500">Model</span>
          <Select
            value={selectedSource?.id}
            onValueChange={handleChange}
            disabled={isPending}
          >
            <SelectTrigger className="h-7 w-48 border-zinc-700 bg-zinc-800 text-xs text-zinc-300">
              <SelectValue placeholder="Loading..." />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900">
              {sources.map((s) => (
                <SelectItem
                  key={s.id}
                  value={s.id}
                  className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                >
                  {s.title?.replaceAll("_", ".") ?? "text"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-5 py-4 h-50">
        <div className="flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-500">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">
                  No messages yet
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  Add a source above, then ask a question
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                ref={messageRef}
                key={msg.id}
                message={{
                  role: msg.role,
                  content: msg.parts
                    .filter((p) => p.type === "text")
                    .map((p) => p.text)
                    .join(""),
                }}
              />
            ))
          )}
          {status === "submitted" && <ThinkingIndicator />}
        </div>
      </ScrollArea>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex justify-center items-center mb-5.25 space-x-2"
      >
        <Input
          type="text"
          value={chatVal}
          onChange={(e) => setChatVal(e.target.value)}
          className="px-5 w-7/8 h-9 text-white"
          placeholder={`Chat with ${displayName}`}
        />
        <Button
          variant={"outline"}
          className="h-9 mb-0.5 hover:bg-slate-200 active:bg-slate-300"
        >
          <SendHorizonal />
        </Button>
      </form>
    </div>
  );
}

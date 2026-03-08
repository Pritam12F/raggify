"use client";

import { useState, useTransition, useEffect } from "react";
import { ChatMessage } from "@/components/chat-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare } from "lucide-react";
import { Entry, Message } from "@/generated/prisma/client";

export interface EntryWithMessages extends Entry {
  messages: Message[];
}

export function ChatWindow() {
  const [sources, setSources] = useState<EntryWithMessages[]>([]);
  const [selectedSource, setSelectedSource] = useState<{
    id: string;
    title: string;
  }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, startTransition] = useTransition();

  const fetchSources = () => {
    startTransition(async () => {
      const res = await fetch("/api/v1/entries");
      const entries = (await res.json()).entries as EntryWithMessages[];

      setSources(entries ?? []);
      if (entries.length) {
        setSelectedSource({
          id: entries[0].id,
          title: entries[0].title ?? "Text",
        });

        setMessages([...entries[0].messages]);
      }
    });
  };

  const handleChange = (value: string) => {
    const newSelected = sources.find((s) => s.id === value)!;

    setSelectedSource({
      id: newSelected.id,
      title: newSelected.title ?? "Text",
    });

    setMessages([...newSelected.messages]);
  };

  useEffect(() => {
    fetchSources();
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
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
                  {s.title ?? "Text"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-5 py-4">
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
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

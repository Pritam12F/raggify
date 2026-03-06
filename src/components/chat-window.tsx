"use client";

import { useState } from "react";
import { ChatMessage, Message } from "@/components/chat-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare } from "lucide-react";

interface ChatWindowProps {
  messages: Message[];
}

const MODELS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
];

export function ChatWindow({ messages }: ChatWindowProps) {
  const [model, setModel] = useState(MODELS[0].value);

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
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="h-7 w-48 border-zinc-700 bg-zinc-800 text-xs text-zinc-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900">
              {MODELS.map((m) => (
                <SelectItem
                  key={m.value}
                  value={m.value}
                  className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                >
                  {m.label}
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
                <p className="text-sm font-medium text-zinc-400">No messages yet</p>
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

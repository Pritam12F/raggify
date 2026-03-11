"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ChatStatus } from "ai";
import { RefObject } from "react";

export type Message = {
  role: "user" | "assistant" | "tool" | "system";
  content: string;
};

interface ChatMessageProps {
  message: Message;
  ref: RefObject<HTMLDivElement | null>;
  status: ChatStatus;
}

export function ChatMessage({ message, ref, status }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-start gap-2",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
      ref={ref}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs font-semibold",
            isUser
              ? "bg-violet-600 text-white"
              : "bg-zinc-700 text-emerald-400",
          )}
        >
          {isUser ? "U" : "AI"}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[70%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-violet-600 text-white shadow-md shadow-violet-900/30"
            : "bg-zinc-800 text-zinc-100",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

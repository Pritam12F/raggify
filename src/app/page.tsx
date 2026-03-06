"use client";

import { useState } from "react";
import { SourceInput } from "@/components/source-input";
import { ChatWindow } from "@/components/chat-window";
import { Message } from "@/components/chat-message";

export default function Home() {
  const [sourceText, setSourceText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    // TODO: add submit logic
  };

  const handleUpload = () => {
    // TODO: add upload logic
  };

  return (
    <main className="flex h-screen items-center justify-center bg-background p-6">
      <div className="flex h-full w-full max-w-6xl gap-6 rounded-xl border bg-card p-6 shadow-sm">
        {/* Left panel */}
        <div className="flex w-1/2 flex-col">
          <SourceInput
            value={sourceText}
            onChange={setSourceText}
            onSubmit={handleSubmit}
            onUpload={handleUpload}
            isLoading={isLoading}
          />
        </div>

        {/* Right panel — Chat Window */}
        <div className="flex w-1/2 flex-col">
          <ChatWindow messages={messages} />
        </div>
      </div>
    </main>
  );
}

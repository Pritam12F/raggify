"use client";

import { ChatMessage, Message } from "@/components/chat-message";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatWindowProps {
  messages: Message[];
}

export function ChatWindow({ messages }: ChatWindowProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col p-4">
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-4 pr-2">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                No messages yet. Ask something!
              </p>
            ) : (
              messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

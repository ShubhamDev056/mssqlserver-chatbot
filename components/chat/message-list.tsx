"use client";

import { useEffect, useRef } from "react";
import { Message } from "@/lib/types";
import { UserMessage } from "./user-message";
import { BotMessage } from "./bot-message";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  className?: string;
}

export function MessageList({ 
  messages, 
  isLoading = false,
  className 
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <p className="mb-4 text-lg font-medium">No conversation yet</p>
          <p className="text-muted-foreground">
            Start by asking a question about your database
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6 py-4", className)}>
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === "user" ? (
            <UserMessage content={message.content} />
          ) : (
            <BotMessage 
              content={message.content} 
              sql={message.sql} 
              error={message.error}
              data={message.data}
            />
          )}
        </div>
      ))}
      
      {isLoading && <BotMessage isLoading content="" />}
      
      <div ref={bottomRef} />
    </div>
  );
}
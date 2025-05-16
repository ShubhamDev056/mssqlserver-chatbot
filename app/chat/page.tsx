"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateId } from "@/lib/utils";
import { Message } from "@/lib/types";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { NavHeader } from "@/components/nav-header";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Database, LogOut } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Check if connected to a database
  useEffect(() => {
    async function checkConnection() {
      try {
        const response = await fetch("/api/database/connect");
        const result = await response.json();
        
        if (result.success && result.data) {
          setIsConnected(result.data.isConnected);
          
          if (!result.data.isConnected) {
            toast({
              title: "Not connected to database",
              description: "Please connect to a database to continue",
              variant: "destructive",
            });
            router.push("/");
          }
        }
      } catch (error) {
        console.error("Error checking connection:", error);
        toast({
          title: "Connection error",
          description: "Failed to check database connection",
          variant: "destructive",
        });
        setIsConnected(false);
      }
    }
    
    checkConnection();
  }, [router, toast]);

  const handleSendMessage = async (content: string) => {
    if (!isConnected) {
      toast({
        title: "Not connected",
        description: "Please connect to a database first",
        variant: "destructive",
      });
      router.push("/");
      return;
    }
    
    // Add user message to the list
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Send message to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to process request");
      }
      
      // Create bot message
      const botMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: result.data.error 
          ? "I encountered an error while executing your query. Please check the error message and try again." 
          : "Here are the results for your query:",
        timestamp: new Date(),
        sql: result.data.sql,
        data: result.data.data,
        error: result.data.error,
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch("/api/database/disconnect", {
        method: "POST",
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to disconnect");
      }
      
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from database",
      });
      
      router.push("/");
    } catch (error) {
      console.error("Error disconnecting:", error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disconnect",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <NavHeader />
      
      <main className="flex-1 container max-w-6xl py-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Database className="mr-2 h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Database Chat</h1>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleDisconnect}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </Button>
        </div>
        
        <div className="flex flex-col gap-4 md:h-[calc(100vh-12rem)]">
          <div className="flex-1 overflow-auto rounded-lg border bg-card">
            <MessageList messages={messages} isLoading={isLoading} />
          </div>
          
          <div className="sticky bottom-0">
            <ChatInput 
              onSubmit={handleSendMessage} 
              isDisabled={isLoading || !isConnected} 
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Tip: Ask questions like "Show me the top 10 products by sales" or "What were the total orders in the last quarter?"
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
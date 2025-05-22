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
import { Plus, Minus } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const [datasets, setDatasets] = useState<Record<string, string[]>>({});
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSchema() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/database/schema");
        const result = await res.json();

        if (!result.success) {
          throw new Error(result.error || "Unknown error");
        }

        setDatasets(result.data);
        setExpandedSections(
          Object.fromEntries(
            Object.keys(result.data).map((key) => [key, false])
          )
        );
      } catch (err: any) {
        setError(err.message || "Failed to fetch schema");
      } finally {
        setLoading(false);
      }
    }

    fetchSchema();
  }, []);

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

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

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      const result = await response.json();

      if (!response.ok)
        throw new Error(result.error || "Failed to process request");

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
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content:
          "Sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };

      setMessages((prev) => [...prev, errorMessage]);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to process request",
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
        description:
          error instanceof Error ? error.message : "Failed to disconnect",
        variant: "destructive",
      });
    }
  };

  const suggestedQuestions = [
    "List of blocks are in Bihar?",
    "List all districts in Karnataka.",
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <NavHeader />

      <main className="w-full py-4 px-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Database className="mr-2 h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Database Chat Bot</h1>
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

        <div className="flex flex-col md:flex-row gap-4 md:h-[calc(100vh-12rem)] w-full">
          {/* Left Section (Chat) */}
          <div className="w-full md:w-8/12 flex flex-col gap-4 h-full">
            <div className="flex-1 overflow-auto rounded-lg border bg-card">
              <MessageList messages={messages} isLoading={isLoading} />
            </div>
            <div className="sticky bottom-0">
              <ChatInput
                onSubmit={handleSendMessage}
                isDisabled={isLoading || !isConnected}
                value={inputValue}
                onChange={setInputValue}
              />
            </div>
          </div>

          {/* Right Section (Suggestions) */}
          <div className="w-full md:w-4/12 flex flex-col gap-4 p-4 border rounded-lg bg-muted h-full overflow-y-auto">
            <h2 className="text-lg font-semibold">Available Datasets</h2>

            {loading && (
              <p className="text-sm text-muted-foreground">
                Loading datasets...
              </p>
            )}

            {error && <div className="text-sm text-red-500">⚠️ {error}</div>}

            {!loading && !error && Object.entries(datasets).length === 0 && (
              <p className="text-sm text-muted-foreground">
                No datasets found.
              </p>
            )}

            {!loading &&
              !error &&
              Object.entries(datasets).map(([name, columns]) => (
                <div key={name} className="border rounded-md bg-background">
                  <button
                    onClick={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        [name]: !prev[name],
                      }))
                    }
                    className="w-full text-left px-4 py-2 font-medium text-primary hover:bg-accent flex items-center justify-between"
                  >
                    {name}
                    {expandedSections[name] ? (
                      <Minus size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                  </button>

                  {expandedSections[name] && (
                    <ul className="px-6 pb-4 pt-2 text-sm list-disc text-muted-foreground">
                      {columns.map((col) => (
                        <li key={col}>{col}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

            <h2 className="text-lg font-semibold mb-2">You may ask</h2>
            <ul className="space-y-2 text-sm">
              {suggestedQuestions.map((question, idx) => (
                <li
                  key={idx}
                  onClick={() => setInputValue(question)}
                  className="cursor-pointer text-primary hover:underline"
                >
                  {question}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

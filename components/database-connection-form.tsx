"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { DatabaseIcon, KeyRound, Loader2, Server, User } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  host: z.string().min(1, { message: "Host is required" }),
  port: z.string().transform((val) => parseInt(val) || 3306),
  user: z.string().min(1, { message: "Username is required" }),
  password: z.string(),
  database: z.string().min(1, { message: "Database name is required" }),
});

type FormValues = z.infer<typeof formSchema>;

export function DatabaseConnectionForm() {
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      host: "",
      port: "3306",
      user: "",
      password: "",
      database: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/database/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to connect to database");
      }

      toast({
        title: "Connection successful",
        description: "Successfully connected to the database",
      });

      // Redirect to chat page
      router.push("/chat");
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Connect to your MySQL Database
        </CardTitle>
        <CardDescription>
          Enter your database credentials to start exploring your data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Server className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="localhost" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Port</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="3306" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="root" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="Password" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="database"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <DatabaseIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="my_database" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    The name of the database you want to query
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        Your credentials are only stored in your browser and never shared
      </CardFooter>
    </Card>
  );
}
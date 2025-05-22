import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Database, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SqlDisplay } from "./sql-display";
import { DataTable } from "../data-table";
import { formatDatabaseResult } from "@/lib/utils";

interface BotMessageProps {
  content: string;
  sql?: string;
  data?: any[];
  error?: string;
  isLoading?: boolean;
  className?: string;
}

export function BotMessage({
  content,
  sql,
  data,
  error,
  isLoading = false,
  className,
}: BotMessageProps) {
  // Format data for display if available
  const formattedData =
    data && data.length > 0 ? formatDatabaseResult(data) : null;

  return (
    <div
      className={cn(
        "flex items-start gap-4 bg-muted/50 p-4 rounded-md",
        className
      )}
    >
      <Avatar className="h-8 w-8 bg-primary/20">
        <AvatarFallback className="bg-primary/20">
          <Database className="h-4 w-4 text-primary" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-2">
          <div className="font-semibold">WASH Plateform</div>
          {isLoading && (
            <div className="text-sm text-muted-foreground flex items-center">
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Generating response...
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="h-6 w-3/4 animate-pulse rounded bg-muted"></div>
        ) : (
          <div className="prose prose-neutral dark:prose-invert">{content}</div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-destructive">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <div className="font-medium">Error</div>
            </div>
            <div className="mt-2 text-sm">{error}</div>
          </div>
        )}

        {sql && !isLoading && <SqlDisplay sql={sql} className="my-4" />}

        {formattedData && !isLoading && (
          <div className="mt-4 overflow-hidden rounded-md border bg-background">
            <DataTable
              columns={formattedData.columns}
              data={formattedData.rows}
            />
          </div>
        )}
      </div>
    </div>
  );
}

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface UserMessageProps {
  content: string;
  className?: string;
}

export function UserMessage({ content, className }: UserMessageProps) {
  return (
    <div className={cn("flex items-start gap-4 p-4", className)}>
      <Avatar className="h-8 w-8 bg-primary">
        <AvatarFallback className="bg-primary">
          <User className="h-4 w-4 text-primary-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="font-semibold">You</div>
        </div>
        <div className="prose prose-neutral dark:prose-invert">{content}</div>
      </div>
    </div>
  );
}
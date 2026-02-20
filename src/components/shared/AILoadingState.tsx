"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Brain } from "lucide-react";

interface AILoadingStateProps {
  message?: string;
}

export function AILoadingState({ message = "Thinking..." }: AILoadingStateProps) {
  return (
    <div className="ai-content pl-4 py-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Brain className="h-4 w-4 animate-pulse text-[var(--primary)]" />
        <span>{message}</span>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

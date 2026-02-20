"use client";

import { cn } from "@/lib/utils";

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  className?: string;
}

export function StreamingText({ text, isStreaming, className }: StreamingTextProps) {
  if (!text && !isStreaming) return null;

  return (
    <div className={cn("ai-content pl-4 py-2", className)}>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">
        {text}
        {isStreaming && <span className="streaming-cursor" />}
      </p>
    </div>
  );
}

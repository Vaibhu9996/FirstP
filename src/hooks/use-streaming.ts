"use client";

import { useState, useRef, useCallback } from "react";
import { streamMessage } from "@/lib/anthropic-client";

interface UseStreamingOptions {
  onComplete?: (fullText: string) => void;
  onError?: (error: string) => void;
}

export function useStreaming(options: UseStreamingOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(
    async (systemPrompt: string, userMessage: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setText("");
      setError(null);

      await streamMessage(
        systemPrompt,
        userMessage,
        {
          onText: (accumulated) => setText(accumulated),
          onComplete: (fullText) => {
            setIsStreaming(false);
            options.onComplete?.(fullText);
          },
          onError: (msg) => {
            setError(msg);
            setIsStreaming(false);
            options.onError?.(msg);
          },
        },
        controller.signal
      );
    },
    [options]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setText("");
    setError(null);
  }, []);

  return { start, stop, reset, isStreaming, text, error };
}

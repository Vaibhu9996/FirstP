"use client";

import Anthropic from "@anthropic-ai/sdk";

let clientInstance: Anthropic | null = null;
let currentKey: string | null = null;

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("firstp-api-key");
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("firstp-api-key", key);
  clientInstance = null;
  currentKey = null;
}

export function removeApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("firstp-api-key");
  clientInstance = null;
  currentKey = null;
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export function getClient(): Anthropic {
  const key = getApiKey();
  if (!key) {
    throw new Error("No API key configured. Please add your Anthropic API key in Settings.");
  }

  if (!clientInstance || currentKey !== key) {
    clientInstance = new Anthropic({
      apiKey: key,
      dangerouslyAllowBrowser: true,
    });
    currentKey = key;
  }

  return clientInstance;
}

export interface StreamCallbacks {
  onText?: (text: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: string) => void;
}

export async function streamMessage(
  systemPrompt: string,
  userMessage: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const client = getClient();
  let accumulated = "";

  try {
    const stream = client.messages.stream(
      {
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      },
      { signal }
    );

    for await (const event of stream) {
      if (signal?.aborted) break;
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        accumulated += event.delta.text;
        callbacks.onText?.(accumulated);
      }
    }

    callbacks.onComplete?.(accumulated);
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    const msg = err instanceof Error ? err.message : "Stream failed";
    callbacks.onError?.(msg);
  }
}

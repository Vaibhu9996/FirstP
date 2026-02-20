"use client";

import { useState, useCallback } from "react";
import { useAnalysisStore } from "@/stores/analysis-store";
import { useStreaming } from "@/hooks/use-streaming";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StreamingText } from "@/components/shared/StreamingText";
import { AILoadingState } from "@/components/shared/AILoadingState";
import { Sparkles, ArrowRight, Check, Edit3 } from "lucide-react";
import { generateId } from "@/lib/utils";
import { getFramingSystemPrompt, getFramingUserPrompt } from "@/lib/prompts/framing";
import { hasApiKey } from "@/lib/anthropic-client";
import { ApiKeyGate } from "@/components/shared/ApiKeyDialog";
import Link from "next/link";
import type { ReframedStatement } from "@/types/analysis";

function FramingContent() {
  const {
    analysis,
    setOriginalInput,
    setContext,
    setDomain,
    setReframedStatements,
    selectFraming,
    setCurrentPhase,
    incrementAIInteractions,
  } = useAnalysisStore();

  const [localInput, setLocalInput] = useState(analysis.framing.originalInput);
  const [localContext, setLocalContext] = useState(analysis.framing.context);
  const [editingFraming, setEditingFraming] = useState(false);
  const [customFraming, setCustomFraming] = useState("");

  const parseReframings = useCallback(
    (fullText: string) => {
      const lines = fullText.split("\n");
      const reframings: ReframedStatement[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("{") && trimmed.includes('"perspective"')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.perspective && parsed.text) {
              reframings.push({
                id: generateId(),
                text: parsed.text,
                perspective: parsed.perspective,
                selected: false,
              });
            }
          } catch { /* skip */ }
        }
      }
      if (reframings.length > 0) setReframedStatements(reframings);
    },
    [setReframedStatements]
  );

  const { start, isStreaming, text, reset } = useStreaming({
    onComplete: (fullText) => {
      parseReframings(fullText);
      incrementAIInteractions();
    },
  });

  const handleAnalyze = () => {
    setOriginalInput(localInput);
    setContext(localContext);
    reset();
    setReframedStatements([]);
    start(
      getFramingSystemPrompt(),
      getFramingUserPrompt(localInput, localContext || undefined, analysis.framing.domain || undefined)
    );
  };

  const handleSelectFraming = (stmt: ReframedStatement) => {
    selectFraming(stmt.text);
  };

  const handleCustomFraming = () => {
    if (customFraming.trim()) {
      selectFraming(customFraming.trim());
      setEditingFraming(false);
    }
  };

  const hasFraming = analysis.framing.selectedFraming.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Problem Framing</h1>
        <p className="text-[var(--muted-foreground)] mt-1">
          Define your problem clearly. AI will help you see it from multiple angles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What problem are you trying to solve?</CardTitle>
          <CardDescription>Be as specific or broad as you like. The AI will help refine it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder='e.g., "How can we reduce customer churn in our SaaS product?" or "Why is education so expensive?"'
            className="min-h-[120px] text-base"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <Input value={localContext} onChange={(e) => setLocalContext(e.target.value)} placeholder="Additional context (optional)" className="flex-1" />
            <Input value={analysis.framing.domain || ""} onChange={(e) => setDomain(e.target.value || null)} placeholder="Domain (optional)" className="sm:w-48" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">{localInput.length} characters</span>
            <Button onClick={handleAnalyze} disabled={!localInput.trim() || isStreaming} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {isStreaming ? "Analyzing..." : "Analyze & Reframe"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(isStreaming || text) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Perspectives</CardTitle>
            <CardDescription>Different ways to look at your problem. Select one or write your own.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isStreaming && analysis.framing.reframedStatements.length === 0 && (
              <AILoadingState message="Analyzing your problem from multiple perspectives..." />
            )}
            {!isStreaming && analysis.framing.reframedStatements.length === 0 && text && (
              <StreamingText text={text} isStreaming={false} />
            )}
            {analysis.framing.reframedStatements.map((stmt) => (
              <button
                key={stmt.id}
                onClick={() => handleSelectFraming(stmt)}
                className={`w-full text-left rounded-lg border p-4 transition-all ${
                  stmt.selected ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]" : "border-[var(--border)] hover:border-[var(--primary)]/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2">{stmt.perspective}</Badge>
                    <p className="text-sm">{stmt.text}</p>
                  </div>
                  {stmt.selected && <Check className="h-5 w-5 text-[var(--primary)] shrink-0 mt-1" />}
                </div>
              </button>
            ))}
            {analysis.framing.reframedStatements.length > 0 && (
              <div className="pt-2 border-t border-[var(--border)]">
                {editingFraming ? (
                  <div className="space-y-2">
                    <Textarea value={customFraming} onChange={(e) => setCustomFraming(e.target.value)} placeholder="Write your own problem framing..." className="min-h-[80px]" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleCustomFraming}>Use This Framing</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingFraming(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="ghost" className="gap-2 text-[var(--muted-foreground)]" onClick={() => setEditingFraming(true)}>
                    <Edit3 className="h-3.5 w-3.5" />
                    Write your own framing
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {hasFraming && (
        <Card className="border-[var(--primary)]/20 bg-[var(--primary)]/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-white shrink-0">
                <Check className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Selected Problem Framing</p>
                <p className="text-sm text-[var(--muted-foreground)]">{analysis.framing.selectedFraming}</p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Link href="/analysis/assumptions">
                <Button className="gap-2" onClick={() => setCurrentPhase("assumptions")}>
                  Continue to Assumptions
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function FramingPage() {
  return (
    <ApiKeyGate>
      <FramingContent />
    </ApiKeyGate>
  );
}

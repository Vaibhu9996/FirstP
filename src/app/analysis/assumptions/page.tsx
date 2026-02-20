"use client";

import { useState, useCallback } from "react";
import { useAnalysisStore } from "@/stores/analysis-store";
import { useStreaming } from "@/hooks/use-streaming";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { AILoadingState } from "@/components/shared/AILoadingState";
import { Sparkles, ArrowRight, ArrowLeft, Plus, Trash2, AlertTriangle, Shield, HelpCircle } from "lucide-react";
import { generateId, confidenceLabel } from "@/lib/utils";
import { getAssumptionsSystemPrompt, getAssumptionsUserPrompt } from "@/lib/prompts/assumptions";
import { ApiKeyGate } from "@/components/shared/ApiKeyDialog";
import Link from "next/link";
import type { Assumption, AssumptionCategory } from "@/types/analysis";

const categoryColors: Record<AssumptionCategory, string> = {
  domain: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  constraint: "bg-red-500/10 text-red-600 dark:text-red-400",
  cultural: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  technical: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  economic: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  temporal: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  scope: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

const statusIcons = { pending: HelpCircle, validated: Shield, challenged: AlertTriangle, disproved: Trash2 };

function AssumptionsContent() {
  const { analysis, addAssumption, updateAssumption, removeAssumption, setCurrentPhase, incrementAIInteractions } = useAnalysisStore();
  const [newAssumptionText, setNewAssumptionText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const parseAssumptions = useCallback(
    (fullText: string) => {
      const lines = fullText.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("{") && trimmed.includes('"text"')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.text && parsed.category) {
              const existing = analysis.assumptions.find((a) => a.text.toLowerCase() === parsed.text.toLowerCase());
              if (!existing) {
                addAssumption({
                  id: generateId(), text: parsed.text, category: parsed.category as AssumptionCategory,
                  confidence: parsed.confidence ?? 70, source: "ai", isChallengeable: parsed.isChallengeable ?? true,
                  notes: parsed.reasoning ?? "", validationStatus: "pending", timestamp: new Date().toISOString(),
                });
              }
            }
          } catch { /* skip */ }
        }
      }
    },
    [addAssumption, analysis.assumptions]
  );

  const { start, isStreaming, reset } = useStreaming({
    onComplete: (fullText) => { parseAssumptions(fullText); incrementAIInteractions(); },
  });

  const handleExtract = () => {
    reset();
    const ps = analysis.framing.selectedFraming || analysis.framing.originalInput;
    start(getAssumptionsSystemPrompt(), getAssumptionsUserPrompt(ps, analysis.assumptions.map((a) => a.text)));
  };

  const handleAddManual = () => {
    if (!newAssumptionText.trim()) return;
    addAssumption({ id: generateId(), text: newAssumptionText.trim(), category: "domain", confidence: 50, source: "user", isChallengeable: true, notes: "", validationStatus: "pending", timestamp: new Date().toISOString() });
    setNewAssumptionText("");
  };

  const cycleStatus = (a: Assumption) => {
    const order: Assumption["validationStatus"][] = ["pending", "validated", "challenged", "disproved"];
    updateAssumption(a.id, { validationStatus: order[(order.indexOf(a.validationStatus) + 1) % order.length] });
  };

  const problemStatement = analysis.framing.selectedFraming || analysis.framing.originalInput;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Assumption Extraction</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Uncover hidden assumptions. Challenge what you take for granted.</p>
      </div>

      {problemStatement && (
        <Card className="bg-[var(--muted)]/50">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Problem Statement</p>
            <p className="text-sm">{problemStatement}</p>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleExtract} disabled={!problemStatement || isStreaming} className="gap-2">
        <Sparkles className="h-4 w-4" />
        {isStreaming ? "Extracting..." : analysis.assumptions.length > 0 ? "Find More Assumptions" : "Extract Assumptions with AI"}
      </Button>

      {isStreaming && analysis.assumptions.length === 0 && <AILoadingState message="Uncovering hidden assumptions..." />}

      {analysis.assumptions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Assumptions ({analysis.assumptions.length})</h2>
            <div className="flex gap-2 text-xs text-[var(--muted-foreground)]">
              <span>{analysis.assumptions.filter((a) => a.validationStatus === "challenged").length} challenged</span>
              <span>{analysis.assumptions.filter((a) => a.validationStatus === "validated").length} validated</span>
            </div>
          </div>

          {analysis.assumptions.map((assumption) => {
            const StatusIcon = statusIcons[assumption.validationStatus];
            return (
              <Card key={assumption.id} className="transition-all hover:shadow-md">
                <CardContent className="pt-5 pb-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <button onClick={() => cycleStatus(assumption)} className={`mt-0.5 shrink-0 rounded-full p-1.5 transition-colors ${assumption.validationStatus === "challenged" ? "bg-amber-500/10 text-amber-600" : assumption.validationStatus === "validated" ? "bg-emerald-500/10 text-emerald-600" : assumption.validationStatus === "disproved" ? "bg-red-500/10 text-red-600" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`} title={`Status: ${assumption.validationStatus}. Click to cycle.`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      {editingId === assumption.id ? (
                        <div className="flex gap-2">
                          <Input value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1" onKeyDown={(e) => { if (e.key === "Enter") { updateAssumption(assumption.id, { text: editText }); setEditingId(null); } if (e.key === "Escape") setEditingId(null); }} autoFocus />
                          <Button size="sm" onClick={() => { updateAssumption(assumption.id, { text: editText }); setEditingId(null); }}>Save</Button>
                        </div>
                      ) : (
                        <p className="text-sm cursor-pointer hover:text-[var(--primary)]" onClick={() => { setEditingId(assumption.id); setEditText(assumption.text); }}>{assumption.text}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className={categoryColors[assumption.category]}>{assumption.category}</Badge>
                        {assumption.source === "ai" && <Badge variant="outline" className="text-[10px]">AI</Badge>}
                        {assumption.isChallengeable && <Badge variant="warning" className="text-[10px]">Challengeable</Badge>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--destructive)]" onClick={() => removeAssumption(assumption.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="pl-9">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--muted-foreground)]">Confidence</span>
                      <span className="text-xs font-medium">{confidenceLabel(assumption.confidence)}</span>
                    </div>
                    <Slider value={assumption.confidence} onChange={(val) => updateAssumption(assumption.id, { confidence: val })} showValue />
                  </div>
                  {assumption.notes && <p className="pl-9 text-xs text-[var(--muted-foreground)] italic">{assumption.notes}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex gap-2">
            <Input value={newAssumptionText} onChange={(e) => setNewAssumptionText(e.target.value)} placeholder="Add your own assumption..." onKeyDown={(e) => { if (e.key === "Enter") handleAddManual(); }} />
            <Button variant="outline" onClick={handleAddManual} disabled={!newAssumptionText.trim()} className="gap-1.5 shrink-0"><Plus className="h-3.5 w-3.5" />Add</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Link href="/analysis/framing"><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Framing</Button></Link>
        <Link href="/analysis/decomposition"><Button className="gap-2" onClick={() => setCurrentPhase("decomposition")} disabled={analysis.assumptions.length === 0}>Continue to Decomposition<ArrowRight className="h-4 w-4" /></Button></Link>
      </div>
    </div>
  );
}

export default function AssumptionsPage() {
  return <ApiKeyGate><AssumptionsContent /></ApiKeyGate>;
}

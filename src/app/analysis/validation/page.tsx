"use client";

import { useState, useCallback } from "react";
import { useAnalysisStore } from "@/stores/analysis-store";
import { useStreaming } from "@/hooks/use-streaming";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AILoadingState } from "@/components/shared/AILoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Sparkles, ArrowRight, ArrowLeft, ShieldCheck, BarChart3, BookOpen, User, Clock, Brain, FlaskConical, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { generateId } from "@/lib/utils";
import { getValidationSystemPrompt, getValidationUserPrompt } from "@/lib/prompts/validation";
import { ApiKeyGate } from "@/components/shared/ApiKeyDialog";
import Link from "next/link";
import type { Evidence, EvidenceType, ValidationResult } from "@/types/analysis";

const evidenceTypeIcons: Record<EvidenceType, React.ElementType> = { statistic: BarChart3, study: BookOpen, expert_opinion: User, historical: Clock, logical: Brain, empirical: FlaskConical };
const confidenceBadge = { high: { variant: "success" as const, label: "High Confidence" }, medium: { variant: "warning" as const, label: "Medium Confidence" }, low: { variant: "destructive" as const, label: "Low Confidence" } };

function ValidationContent() {
  const { analysis, addValidation, setCurrentPhase, incrementAIInteractions } = useAnalysisStore();
  const [validatingNodeId, setValidatingNodeId] = useState<string | null>(null);

  const parseValidation = useCallback(
    (fullText: string, nodeId: string) => {
      const lines = fullText.split("\n");
      const evidence: Evidence[] = [];
      const counterArgs: Evidence[] = [];
      let summary = ""; let overallConfidence: "high" | "medium" | "low" = "medium"; let suggestedRevision: string | null = null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("{")) continue;
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.summary) { summary = parsed.summary; overallConfidence = parsed.overallConfidence || "medium"; suggestedRevision = parsed.suggestedRevision || null; continue; }
          if (parsed.content && parsed.type) {
            const ev: Evidence = { id: generateId(), nodeId, type: parsed.type as EvidenceType, content: parsed.content, source: parsed.source || "", sourceLabel: parsed.sourceLabel || "Unknown Source", confidence: parsed.confidence || "medium", isCounterArgument: parsed.isCounterArgument ?? false, timestamp: new Date().toISOString() };
            if (ev.isCounterArgument) counterArgs.push(ev); else evidence.push(ev);
          }
        } catch { /* skip */ }
      }
      addValidation({ nodeId, overallConfidence, evidence, counterArguments: counterArgs, summary, suggestedRevision });
    },
    [addValidation]
  );

  const { start, isStreaming, reset } = useStreaming({
    onComplete: (fullText) => { if (validatingNodeId) parseValidation(fullText, validatingNodeId); incrementAIInteractions(); },
  });

  const handleValidate = (nodeId: string) => {
    setValidatingNodeId(nodeId);
    reset();
    const node = analysis.tree.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    start(getValidationSystemPrompt(), getValidationUserPrompt(`${node.label}: ${node.description}`, analysis.framing.selectedFraming || analysis.framing.originalInput, node.type));
  };

  const validatableNodes = analysis.tree.nodes.filter((n) => n.type !== "root" && (n.isFundamental || n.type === "principle" || n.type === "component"));
  const getValidation = (nodeId: string) => analysis.validations.find((v) => v.nodeId === nodeId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Data-Backed Validation</h1>
        <p className="text-muted-foreground mt-1">Validate each claim with evidence. Every truth needs data to back it up.</p>
      </div>

      {validatableNodes.length > 0 && <div className="flex gap-4 text-sm"><span>{analysis.validations.length} / {validatableNodes.length} nodes validated</span></div>}

      {validatableNodes.length === 0 && (
        <EmptyState icon={ShieldCheck} title="Nothing to validate yet" description="Build your decomposition tree first, then come back to validate each component.">
          <Link href="/analysis/decomposition"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Go to Decomposition</Button></Link>
        </EmptyState>
      )}

      {validatableNodes.length > 0 && analysis.validations.length < validatableNodes.length && (
        <Button variant="outline" className="gap-2" onClick={() => { const uv = validatableNodes.find((n) => !getValidation(n.id)); if (uv) handleValidate(uv.id); }} disabled={isStreaming}>
          <Sparkles className="h-4 w-4" />Validate Next
        </Button>
      )}

      {isStreaming && <AILoadingState message="Gathering evidence and counter-arguments..." />}

      <div className="space-y-4">
        {validatableNodes.map((node) => {
          const validation = getValidation(node.id);
          const isValidating = isStreaming && validatingNodeId === node.id;
          return (
            <Card key={node.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {node.label}
                      {node.isFundamental && <Badge variant="warning" className="text-[10px]">Fundamental</Badge>}
                    </CardTitle>
                    {node.description && <p className="text-sm text-muted-foreground mt-1">{node.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {validation && <Badge variant={confidenceBadge[validation.overallConfidence].variant}>{confidenceBadge[validation.overallConfidence].label}</Badge>}
                    <Button size="sm" variant={validation ? "outline" : "default"} className="gap-1.5 shrink-0" onClick={() => handleValidate(node.id)} disabled={isStreaming}>
                      <Sparkles className="h-3.5 w-3.5" />{validation ? "Re-validate" : "Validate"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {(validation || isValidating) && (
                <CardContent className="space-y-4">
                  {isValidating && !validation && <AILoadingState message="Analyzing evidence..." />}
                  {validation && (
                    <>
                      {validation.summary && <div className="ai-border pl-4 py-3 rounded-lg bg-muted/30"><p className="text-sm">{validation.summary}</p></div>}
                      {validation.suggestedRevision && (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Suggested Revision</p>
                          <p className="text-sm">{validation.suggestedRevision}</p>
                        </div>
                      )}
                      {validation.evidence.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><span className="text-sm font-medium">Supporting Evidence ({validation.evidence.length})</span></div>
                          <div className="space-y-2">
                            {validation.evidence.map((ev) => {
                              const EvidenceIcon = evidenceTypeIcons[ev.type] || Brain;
                              return (
                                <div key={ev.id} className="flex gap-3 rounded-lg border border-border p-3">
                                  <div className="shrink-0 mt-0.5"><EvidenceIcon className="h-4 w-4 text-muted-foreground" /></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm">{ev.content}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <Badge variant={confidenceBadge[ev.confidence].variant} className="text-[10px]">{ev.confidence}</Badge>
                                      <Badge variant="secondary" className="text-[10px]">{ev.type.replace("_", " ")}</Badge>
                                      {ev.source && ev.sourceLabel && (
                                        <a href={ev.source.startsWith("http") ? ev.source : undefined} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-primary hover:underline">
                                          {ev.sourceLabel}<ExternalLink className="h-2.5 w-2.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {validation.counterArguments.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-amber-600" /><span className="text-sm font-medium">Counter-Arguments ({validation.counterArguments.length})</span></div>
                          <div className="space-y-2">
                            {validation.counterArguments.map((ev) => {
                              const EvidenceIcon = evidenceTypeIcons[ev.type] || Brain;
                              return (
                                <div key={ev.id} className="flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                                  <div className="shrink-0 mt-0.5"><EvidenceIcon className="h-4 w-4 text-amber-600" /></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm">{ev.content}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <Badge variant="warning" className="text-[10px]">{ev.confidence}</Badge>
                                      {ev.sourceLabel && <span className="text-[10px] text-muted-foreground">{ev.sourceLabel}</span>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Link href="/analysis/decomposition"><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Decomposition</Button></Link>
        <Link href="/analysis/reconstruction"><Button className="gap-2" onClick={() => setCurrentPhase("reconstruction")}>Continue to Reconstruction<ArrowRight className="h-4 w-4" /></Button></Link>
      </div>
    </div>
  );
}

export default function ValidationPage() {
  return <ApiKeyGate><ValidationContent /></ApiKeyGate>;
}

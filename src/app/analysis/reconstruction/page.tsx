"use client";

import { useState, useCallback } from "react";
import { useAnalysisStore } from "@/stores/analysis-store";
import { useStreaming } from "@/hooks/use-streaming";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AILoadingState } from "@/components/shared/AILoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Sparkles, ArrowRight, ArrowLeft, Puzzle, Star, Trophy } from "lucide-react";
import { generateId } from "@/lib/utils";
import { getReconstructionSystemPrompt, getReconstructionUserPrompt } from "@/lib/prompts/reconstruction";
import { ApiKeyGate } from "@/components/shared/ApiKeyDialog";
import Link from "next/link";
import type { Solution } from "@/types/analysis";

const noveltyConfig = {
  incremental: { color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", label: "Incremental" },
  moderate: { color: "bg-purple-500/10 text-purple-600 dark:text-purple-400", label: "Moderate" },
  radical: { color: "bg-orange-500/10 text-orange-600 dark:text-orange-400", label: "Radical" },
};
const feasibilityConfig = {
  high: { color: "text-emerald-600", label: "High Feasibility" },
  medium: { color: "text-amber-600", label: "Medium Feasibility" },
  low: { color: "text-red-600", label: "Low Feasibility" },
};

function ReconstructionContent() {
  const { analysis, setSolutions, rankSolution, setCurrentPhase, incrementAIInteractions } = useAnalysisStore();
  const [comparison, setComparison] = useState("");

  const fundamentalTruths = analysis.tree.nodes.filter((n) => n.isFundamental || n.type === "principle");
  const challengedAssumptions = analysis.assumptions.filter((a) => a.validationStatus === "challenged" || a.validationStatus === "disproved").map((a) => a.text);

  const parseSolutions = useCallback(
    (fullText: string) => {
      const lines = fullText.split("\n");
      const newSolutions: Solution[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("{")) continue;
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.comparison) { setComparison(parsed.comparison); continue; }
          if (parsed.title && parsed.description) {
            newSolutions.push({
              id: generateId(), title: parsed.title, description: parsed.description,
              approach: parsed.approach || "first_principles", usedPrinciples: parsed.usedPrinciples || [],
              novelty: parsed.novelty || "moderate", feasibility: parsed.feasibility || "medium",
              userRank: null, aiRationale: parsed.rationale || "", timestamp: new Date().toISOString(),
            });
          }
        } catch { /* skip */ }
      }
      if (newSolutions.length > 0) setSolutions(newSolutions);
    },
    [setSolutions]
  );

  const { start, isStreaming, reset } = useStreaming({
    onComplete: (fullText) => { parseSolutions(fullText); incrementAIInteractions(); },
  });

  const handleReconstruct = () => {
    reset(); setComparison(""); setSolutions([]);
    start(
      getReconstructionSystemPrompt(),
      getReconstructionUserPrompt(
        analysis.framing.selectedFraming || analysis.framing.originalInput,
        fundamentalTruths.map((t) => ({ label: t.label, description: t.description })),
        challengedAssumptions
      )
    );
  };

  const conventionalSolution = analysis.solutions.find((s) => s.approach === "conventional");
  const fpSolutions = analysis.solutions.filter((s) => s.approach === "first_principles");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Reconstruction</h1>
        <p className="text-muted-foreground mt-1">Build novel solutions from your fundamental truths, free from old assumptions.</p>
      </div>

      {fundamentalTruths.length > 0 && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4 text-gold" />Your Fundamental Truths ({fundamentalTruths.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">{fundamentalTruths.map((t) => <Badge key={t.id} variant="outline" className="py-1 px-3">{t.label}</Badge>)}</div>
            {challengedAssumptions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-medium text-amber-600 mb-1">Removed Constraints ({challengedAssumptions.length})</p>
                <div className="flex flex-wrap gap-1">{challengedAssumptions.map((a, i) => <Badge key={i} variant="secondary" className="text-[10px] line-through opacity-60">{a.slice(0, 40)}...</Badge>)}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button onClick={handleReconstruct} disabled={isStreaming || fundamentalTruths.length === 0} className="gap-2">
        <Sparkles className="h-4 w-4" />{isStreaming ? "Generating Solutions..." : analysis.solutions.length > 0 ? "Regenerate Solutions" : "Generate Solutions from First Principles"}
      </Button>

      {isStreaming && analysis.solutions.length === 0 && <AILoadingState message="Combining fundamental truths into novel solutions..." />}

      {fundamentalTruths.length === 0 && (
        <EmptyState icon={Puzzle} title="No fundamental truths yet" description="Complete the decomposition and validation phases to identify fundamental truths.">
          <Link href="/analysis/decomposition"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Go to Decomposition</Button></Link>
        </EmptyState>
      )}

      {conventionalSolution && fpSolutions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-muted-foreground/20">
            <CardHeader className="pb-3"><CardDescription className="text-xs uppercase tracking-wider">Conventional Approach</CardDescription><CardTitle className="text-base">{conventionalSolution.title}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{conventionalSolution.description}</p>
              <div className="flex gap-2 mt-3"><Badge variant="secondary">Conventional</Badge><Badge variant="secondary" className={feasibilityConfig[conventionalSolution.feasibility].color}>{feasibilityConfig[conventionalSolution.feasibility].label}</Badge></div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3"><CardDescription className="text-xs uppercase tracking-wider text-primary">First Principles Approach</CardDescription><CardTitle className="text-base">{fpSolutions[0].title}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm">{fpSolutions[0].description}</p>
              <div className="flex gap-2 mt-3"><Badge className={noveltyConfig[fpSolutions[0].novelty].color}>{noveltyConfig[fpSolutions[0].novelty].label}</Badge><Badge variant="secondary" className={feasibilityConfig[fpSolutions[0].feasibility].color}>{feasibilityConfig[fpSolutions[0].feasibility].label}</Badge></div>
            </CardContent>
          </Card>
        </div>
      )}

      {comparison && <Card className="ai-border"><CardContent className="pt-5"><p className="text-xs font-medium text-muted-foreground uppercase mb-2">Key Differences</p><p className="text-sm">{comparison}</p></CardContent></Card>}

      {analysis.solutions.length > 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">All Solutions</h2>
          <div className="space-y-3">
            {analysis.solutions.map((solution, idx) => (
              <Card key={solution.id} className="transition-all hover:shadow-md">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-4">
                    <button className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors ${solution.userRank === 1 ? "bg-primary text-white border-primary" : "border-border hover:border-primary"}`} onClick={() => rankSolution(solution.id, solution.userRank === 1 ? 0 : 1)} title="Click to mark as best">
                      {solution.userRank === 1 ? <Trophy className="h-3.5 w-3.5" /> : idx + 1}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1"><h3 className="font-medium">{solution.title}</h3>{solution.approach === "conventional" && <Badge variant="secondary">Conventional</Badge>}</div>
                      <p className="text-sm text-muted-foreground mb-2">{solution.description}</p>
                      {solution.aiRationale && <div className="ai-border pl-3 py-2 mb-2"><p className="text-xs text-muted-foreground">{solution.aiRationale}</p></div>}
                      <div className="flex flex-wrap gap-2">
                        <Badge className={noveltyConfig[solution.novelty].color}>{noveltyConfig[solution.novelty].label}</Badge>
                        <Badge variant="outline" className={feasibilityConfig[solution.feasibility].color}>{feasibilityConfig[solution.feasibility].label}</Badge>
                        {solution.usedPrinciples.length > 0 && <span className="text-[10px] text-muted-foreground">Uses: {solution.usedPrinciples.join(", ")}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Link href="/analysis/validation"><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Validation</Button></Link>
        <Link href="/analysis/dashboard"><Button className="gap-2" onClick={() => setCurrentPhase("dashboard")}>View Dashboard<ArrowRight className="h-4 w-4" /></Button></Link>
      </div>
    </div>
  );
}

export default function ReconstructionPage() {
  return <ApiKeyGate><ReconstructionContent /></ApiKeyGate>;
}

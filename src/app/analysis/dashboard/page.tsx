"use client";

import { useAnalysisStore } from "@/stores/analysis-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Upload,
  Printer,
  MessageSquare,
  AlertTriangle,
  GitBranch,
  ShieldCheck,
  Puzzle,
  Star,
  Brain,
  Clock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useRef } from "react";

export default function DashboardPage() {
  const { analysis, exportAnalysis, importAnalysis } = useAnalysisStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fundamentalTruths = analysis.tree.nodes.filter(
    (n) => n.isFundamental || n.type === "principle"
  );
  const challengedAssumptions = analysis.assumptions.filter(
    (a) => a.validationStatus === "challenged" || a.validationStatus === "disproved"
  );
  const validatedAssumptions = analysis.assumptions.filter(
    (a) => a.validationStatus === "validated"
  );
  const topSolution = analysis.solutions.find((s) => s.userRank === 1) || analysis.solutions[0];

  const handleExport = () => {
    const data = exportAnalysis();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `firstp-${analysis.title.slice(0, 30).replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        importAnalysis(data);
      } catch {
        alert("Invalid analysis file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const phases = [
    {
      label: "Problem Framing",
      icon: MessageSquare,
      done: !!analysis.framing.selectedFraming,
      detail: analysis.framing.selectedFraming
        ? analysis.framing.selectedFraming.slice(0, 80) + "..."
        : "Not started",
    },
    {
      label: "Assumptions",
      icon: AlertTriangle,
      done: analysis.assumptions.length > 0,
      detail: `${analysis.assumptions.length} assumptions identified`,
    },
    {
      label: "Decomposition",
      icon: GitBranch,
      done: analysis.tree.nodes.length > 1,
      detail: `${analysis.tree.nodes.length} nodes, ${fundamentalTruths.length} fundamental truths`,
    },
    {
      label: "Validation",
      icon: ShieldCheck,
      done: analysis.validations.length > 0,
      detail: `${analysis.validations.length} nodes validated`,
    },
    {
      label: "Reconstruction",
      icon: Puzzle,
      done: analysis.solutions.length > 0,
      detail: `${analysis.solutions.length} solutions generated`,
    },
  ];

  return (
    <div className="space-y-8 print:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{analysis.title || "Analysis Dashboard"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Created {formatDate(analysis.createdAt)} &middot; Updated{" "}
            {formatDate(analysis.updatedAt)}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Brain className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{analysis.metadata.totalAIInteractions}</p>
            <p className="text-xs text-muted-foreground">AI Interactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <GitBranch className="h-5 w-5 mx-auto text-purple-600 mb-1" />
            <p className="text-2xl font-bold">{analysis.tree.nodes.length}</p>
            <p className="text-xs text-muted-foreground">Tree Nodes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Star className="h-5 w-5 mx-auto text-gold mb-1" />
            <p className="text-2xl font-bold">{fundamentalTruths.length}</p>
            <p className="text-xs text-muted-foreground">First Principles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <Puzzle className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-bold">{analysis.solutions.length}</p>
            <p className="text-xs text-muted-foreground">Solutions</p>
          </CardContent>
        </Card>
      </div>

      {/* Process timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Analysis Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {phases.map((phase, i) => (
              <div key={phase.label} className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    phase.done
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {phase.done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <phase.icon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{phase.label}</p>
                  <p className="text-xs text-muted-foreground">{phase.detail}</p>
                </div>
                {i < phases.length - 1 && (
                  <div className="hidden sm:block w-px h-4 bg-border" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      {(fundamentalTruths.length > 0 || challengedAssumptions.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fundamentalTruths.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                  Fundamental Truths Discovered
                </p>
                <div className="space-y-2">
                  {fundamentalTruths.map((t) => (
                    <div key={t.id} className="flex items-start gap-2">
                      <Star className="h-3.5 w-3.5 mt-0.5 text-gold shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{t.label}</p>
                        {t.description && (
                          <p className="text-xs text-muted-foreground">{t.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {challengedAssumptions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                  Challenged Assumptions
                </p>
                <div className="space-y-1">
                  {challengedAssumptions.map((a) => (
                    <div key={a.id} className="flex items-start gap-2">
                      <XCircle className="h-3.5 w-3.5 mt-0.5 text-amber-600 shrink-0" />
                      <p className="text-sm">{a.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top solution */}
      {topSolution && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {topSolution.userRank === 1 ? "Top Ranked Solution" : "Recommended Solution"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-lg mb-1">{topSolution.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {topSolution.description}
            </p>
            {topSolution.aiRationale && (
              <div className="ai-border pl-3 py-2">
                <p className="text-xs text-muted-foreground">
                  {topSolution.aiRationale}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assumptions table */}
      {analysis.assumptions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All Assumptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.assumptions.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <div className="shrink-0">
                    {a.validationStatus === "validated" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                    {a.validationStatus === "challenged" && (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                    {a.validationStatus === "disproved" && (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    {a.validationStatus === "pending" && (
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm flex-1">{a.text}</p>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {a.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">
                    {a.confidence}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between no-print">
        <Link href="/analysis/reconstruction">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Reconstruction
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            New Analysis
          </Button>
        </Link>
      </div>
    </div>
  );
}

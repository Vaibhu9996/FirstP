"use client";

import { useState, useCallback, useMemo } from "react";
import { useAnalysisStore } from "@/stores/analysis-store";
import { useStreaming } from "@/hooks/use-streaming";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AILoadingState } from "@/components/shared/AILoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Sparkles, ArrowRight, ArrowLeft, Plus, Trash2, ChevronRight, ChevronDown, Star, GitBranch, HelpCircle, Lock, Layers } from "lucide-react";
import { generateId } from "@/lib/utils";
import { getDecompositionSystemPrompt, getDecompositionUserPrompt } from "@/lib/prompts/decomposition";
import { ApiKeyGate } from "@/components/shared/ApiKeyDialog";
import Link from "next/link";
import type { DecompositionNode, NodeType } from "@/types/analysis";

const nodeTypeConfig: Record<NodeType, { icon: React.ElementType; color: string; label: string }> = {
  root: { icon: Layers, color: "text-blue-600 bg-blue-500/10", label: "Root" },
  component: { icon: GitBranch, color: "text-purple-600 bg-purple-500/10", label: "Component" },
  principle: { icon: Star, color: "text-amber-600 bg-amber-500/10", label: "First Principle" },
  question: { icon: HelpCircle, color: "text-cyan-600 bg-cyan-500/10", label: "Question" },
  constraint: { icon: Lock, color: "text-red-600 bg-red-500/10", label: "Constraint" },
};

function DecompositionContent() {
  const { analysis, addNode, addEdge, removeNode, updateNode, setCurrentPhase, incrementAIInteractions } = useAnalysisStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<NodeType>("component");

  const problemStatement = analysis.framing.selectedFraming || analysis.framing.originalInput;

  useMemo(() => {
    if (analysis.tree.nodes.length === 0 && problemStatement) {
      addNode({
        id: generateId(), parentId: null, label: problemStatement.slice(0, 60),
        description: problemStatement, type: "root", depth: 0, isFundamental: false,
        source: "user", evidence: [], position: { x: 0, y: 0 }, collapsed: false,
        timestamp: new Date().toISOString(),
      });
    }
  }, [analysis.tree.nodes.length, problemStatement, addNode]);

  const getChildren = (parentId: string) => analysis.tree.nodes.filter((n) => n.parentId === parentId);

  const parseDecomposition = useCallback(
    (fullText: string, parentId: string, parentDepth: number) => {
      const lines = fullText.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("{") && trimmed.includes('"label"')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.label) {
              const nodeId = generateId();
              addNode({
                id: nodeId, parentId, label: parsed.label, description: parsed.description || "",
                type: parsed.type || "component", depth: parentDepth + 1,
                isFundamental: parsed.isFundamental ?? false, source: "ai", evidence: [],
                position: { x: 0, y: 0 }, collapsed: false, timestamp: new Date().toISOString(),
              });
              addEdge({ id: generateId(), source: parentId, target: nodeId });
            }
          } catch { /* skip */ }
        }
      }
    },
    [addNode, addEdge]
  );

  const { start, isStreaming, reset } = useStreaming({
    onComplete: (fullText) => {
      if (selectedNodeId) {
        const parent = analysis.tree.nodes.find((n) => n.id === selectedNodeId);
        parseDecomposition(fullText, selectedNodeId, parent?.depth ?? 0);
      }
      incrementAIInteractions();
    },
  });

  const handleDecompose = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    reset();
    const node = analysis.tree.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const children = getChildren(nodeId);
    start(
      getDecompositionSystemPrompt(),
      getDecompositionUserPrompt(
        problemStatement,
        { label: node.label, description: node.description },
        children.map((c) => c.label),
        analysis.assumptions.filter((a) => a.validationStatus === "challenged").map((a) => a.text)
      )
    );
  };

  const handleAddManualNode = (parentId: string) => {
    if (!newLabel.trim()) return;
    const parent = analysis.tree.nodes.find((n) => n.id === parentId);
    const nodeId = generateId();
    addNode({
      id: nodeId, parentId, label: newLabel.trim(), description: newDescription.trim(),
      type: newType, depth: (parent?.depth ?? 0) + 1, isFundamental: newType === "principle",
      source: "user", evidence: [], position: { x: 0, y: 0 }, collapsed: false,
      timestamp: new Date().toISOString(),
    });
    addEdge({ id: generateId(), source: parentId, target: nodeId });
    setNewLabel(""); setNewDescription(""); setShowAddForm(false);
  };

  const renderNode = (node: DecompositionNode, level: number = 0) => {
    const children = getChildren(node.id);
    const hasChildren = children.length > 0;
    const config = nodeTypeConfig[node.type];
    const Icon = config.icon;
    const isSelected = selectedNodeId === node.id;

    return (
      <div key={node.id} className={level > 0 ? "ml-6 border-l border-[var(--border)] pl-4" : ""}>
        <div className={`group flex items-start gap-2 rounded-lg p-3 transition-all cursor-pointer ${isSelected ? "bg-[var(--primary)]/5 border border-[var(--primary)]/20" : "hover:bg-[var(--muted)]/50"} ${node.isFundamental ? "ring-1 ring-[var(--fundamental)]/30" : ""}`} onClick={() => setSelectedNodeId(isSelected ? null : node.id)}>
          <button onClick={(e) => { e.stopPropagation(); updateNode(node.id, { collapsed: !node.collapsed }); }} className="mt-0.5 shrink-0">
            {hasChildren ? (node.collapsed ? <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" /> : <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />) : <div className="w-4" />}
          </button>
          <div className={`shrink-0 rounded-md p-1.5 ${config.color}`}><Icon className="h-3.5 w-3.5" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{node.label}</span>
              {node.isFundamental && <Star className="h-3 w-3 text-[var(--fundamental)] fill-[var(--fundamental)]" />}
              {node.source === "ai" && <Badge variant="outline" className="text-[10px] py-0">AI</Badge>}
            </div>
            {node.description && <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-2">{node.description}</p>}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDecompose(node.id); }} disabled={isStreaming} title="Decompose with AI"><Sparkles className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.id); setShowAddForm(true); }} title="Add child node"><Plus className="h-3 w-3" /></Button>
            {node.type !== "root" && <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--destructive)]" onClick={(e) => { e.stopPropagation(); removeNode(node.id); }} title="Remove"><Trash2 className="h-3 w-3" /></Button>}
          </div>
        </div>

        {showAddForm && selectedNodeId === node.id && (
          <div className="ml-6 border-l border-[var(--border)] pl-4 mt-2">
            <Card className="border-dashed">
              <CardContent className="pt-4 pb-3 space-y-3">
                <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Node label" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleAddManualNode(node.id); if (e.key === "Escape") setShowAddForm(false); }} />
                <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description (optional)" className="min-h-[60px]" />
                <div className="flex gap-2 flex-wrap">
                  {(["component", "principle", "question", "constraint"] as NodeType[]).map((t) => (
                    <button key={t} onClick={() => setNewType(t)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${newType === t ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]" : "border-[var(--border)]"}`}>{nodeTypeConfig[t].label}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAddManualNode(node.id)}>Add Node</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!node.collapsed && children.length > 0 && <div className="mt-1">{children.map((child) => renderNode(child, level + 1))}</div>}
      </div>
    );
  };

  const rootNodes = analysis.tree.nodes.filter((n) => n.parentId === null);
  const fundamentalCount = analysis.tree.nodes.filter((n) => n.isFundamental).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Decomposition Tree</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Break your problem into fundamental components. Keep decomposing until you reach irreducible truths.</p>
      </div>

      {analysis.tree.nodes.length > 0 && (
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5"><GitBranch className="h-4 w-4 text-[var(--muted-foreground)]" /><span>{analysis.tree.nodes.length} nodes</span></div>
          <div className="flex items-center gap-1.5"><Star className="h-4 w-4 text-[var(--fundamental)]" /><span>{fundamentalCount} fundamental truths</span></div>
        </div>
      )}

      {isStreaming && <AILoadingState message="Decomposing into fundamental components..." />}

      {rootNodes.length > 0 ? (
        <Card><CardContent className="pt-6 pb-4">{rootNodes.map((node) => renderNode(node))}</CardContent></Card>
      ) : (
        <EmptyState icon={GitBranch} title="No decomposition yet" description="Go back to Problem Framing to define your problem first.">
          <Link href="/analysis/framing"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Go to Framing</Button></Link>
        </EmptyState>
      )}

      <div className="flex justify-between">
        <Link href="/analysis/assumptions"><Button variant="ghost" className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Assumptions</Button></Link>
        <Link href="/analysis/validation"><Button className="gap-2" onClick={() => setCurrentPhase("validation")} disabled={analysis.tree.nodes.length === 0}>Continue to Validation<ArrowRight className="h-4 w-4" /></Button></Link>
      </div>
    </div>
  );
}

export default function DecompositionPage() {
  return <ApiKeyGate><DecompositionContent /></ApiKeyGate>;
}

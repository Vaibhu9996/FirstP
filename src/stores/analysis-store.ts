"use client";

import { create } from "zustand";
import type {
  Analysis,
  AnalysisPhase,
  Assumption,
  DecompositionNode,
  DecompositionEdge,
  Evidence,
  ValidationResult,
  Solution,
  ReframedStatement,
  ExportedAnalysis,
} from "@/types/analysis";
import { generateId } from "@/lib/utils";

function createEmptyAnalysis(): Analysis {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    version: 1,
    title: "Untitled Analysis",
    createdAt: now,
    updatedAt: now,
    currentPhase: "framing",
    framing: {
      originalInput: "",
      reframedStatements: [],
      selectedFraming: "",
      domain: null,
      context: "",
      timestamp: now,
    },
    assumptions: [],
    tree: { nodes: [], edges: [] },
    validations: [],
    solutions: [],
    metadata: {
      totalAIInteractions: 0,
      timeSpentMinutes: 0,
      exportCount: 0,
    },
  };
}

interface AnalysisState {
  analysis: Analysis;
  isStreaming: boolean;
  streamingPhase: AnalysisPhase | null;

  // Framing
  setOriginalInput: (input: string) => void;
  setReframedStatements: (stmts: ReframedStatement[]) => void;
  addReframedStatement: (stmt: ReframedStatement) => void;
  selectFraming: (text: string) => void;
  setDomain: (domain: string | null) => void;
  setContext: (context: string) => void;

  // Assumptions
  setAssumptions: (assumptions: Assumption[]) => void;
  addAssumption: (assumption: Assumption) => void;
  updateAssumption: (id: string, updates: Partial<Assumption>) => void;
  removeAssumption: (id: string) => void;

  // Tree
  addNode: (node: DecompositionNode) => void;
  updateNode: (id: string, updates: Partial<DecompositionNode>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: DecompositionEdge) => void;
  removeEdge: (id: string) => void;
  setNodes: (nodes: DecompositionNode[]) => void;
  setEdges: (edges: DecompositionEdge[]) => void;

  // Validation
  addValidation: (result: ValidationResult) => void;
  attachEvidence: (nodeId: string, evidence: Evidence) => void;

  // Solutions
  addSolution: (solution: Solution) => void;
  setSolutions: (solutions: Solution[]) => void;
  rankSolution: (id: string, rank: number) => void;

  // Navigation
  setCurrentPhase: (phase: AnalysisPhase) => void;
  setTitle: (title: string) => void;

  // Streaming
  setStreaming: (isStreaming: boolean, phase?: AnalysisPhase | null) => void;
  incrementAIInteractions: () => void;

  // Persistence
  exportAnalysis: () => ExportedAnalysis;
  importAnalysis: (data: ExportedAnalysis) => void;
  newAnalysis: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  analysis: createEmptyAnalysis(),
  isStreaming: false,
  streamingPhase: null,

  // Framing
  setOriginalInput: (input) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        updatedAt: new Date().toISOString(),
        framing: { ...s.analysis.framing, originalInput: input },
      },
    })),

  setReframedStatements: (stmts) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        updatedAt: new Date().toISOString(),
        framing: { ...s.analysis.framing, reframedStatements: stmts },
      },
    })),

  addReframedStatement: (stmt) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        updatedAt: new Date().toISOString(),
        framing: {
          ...s.analysis.framing,
          reframedStatements: [...s.analysis.framing.reframedStatements, stmt],
        },
      },
    })),

  selectFraming: (text) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        updatedAt: new Date().toISOString(),
        title: text.slice(0, 60),
        framing: {
          ...s.analysis.framing,
          selectedFraming: text,
          reframedStatements: s.analysis.framing.reframedStatements.map((r) => ({
            ...r,
            selected: r.text === text,
          })),
        },
      },
    })),

  setDomain: (domain) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        framing: { ...s.analysis.framing, domain },
      },
    })),

  setContext: (context) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        framing: { ...s.analysis.framing, context },
      },
    })),

  // Assumptions
  setAssumptions: (assumptions) =>
    set((s) => ({
      analysis: { ...s.analysis, updatedAt: new Date().toISOString(), assumptions },
    })),

  addAssumption: (assumption) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        updatedAt: new Date().toISOString(),
        assumptions: [...s.analysis.assumptions, assumption],
      },
    })),

  updateAssumption: (id, updates) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        updatedAt: new Date().toISOString(),
        assumptions: s.analysis.assumptions.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      },
    })),

  removeAssumption: (id) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        updatedAt: new Date().toISOString(),
        assumptions: s.analysis.assumptions.filter((a) => a.id !== id),
      },
    })),

  // Tree
  addNode: (node) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        updatedAt: new Date().toISOString(),
        tree: {
          ...s.analysis.tree,
          nodes: [...s.analysis.tree.nodes, node],
        },
      },
    })),

  updateNode: (id, updates) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        updatedAt: new Date().toISOString(),
        tree: {
          ...s.analysis.tree,
          nodes: s.analysis.tree.nodes.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        },
      },
    })),

  removeNode: (id) =>
    set((s) => {
      const nodesToRemove = new Set<string>();
      const collectChildren = (parentId: string) => {
        nodesToRemove.add(parentId);
        s.analysis.tree.nodes
          .filter((n) => n.parentId === parentId)
          .forEach((n) => collectChildren(n.id));
      };
      collectChildren(id);
      return {
        analysis: {
          ...s.analysis,
          updatedAt: new Date().toISOString(),
          tree: {
            nodes: s.analysis.tree.nodes.filter((n) => !nodesToRemove.has(n.id)),
            edges: s.analysis.tree.edges.filter(
              (e) => !nodesToRemove.has(e.source) && !nodesToRemove.has(e.target)
            ),
          },
        },
      };
    }),

  addEdge: (edge) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        tree: {
          ...s.analysis.tree,
          edges: [...s.analysis.tree.edges, edge],
        },
      },
    })),

  removeEdge: (id) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        tree: {
          ...s.analysis.tree,
          edges: s.analysis.tree.edges.filter((e) => e.id !== id),
        },
      },
    })),

  setNodes: (nodes) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        tree: { ...s.analysis.tree, nodes },
      },
    })),

  setEdges: (edges) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        tree: { ...s.analysis.tree, edges },
      },
    })),

  // Validation
  addValidation: (result) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        updatedAt: new Date().toISOString(),
        validations: [
          ...s.analysis.validations.filter((v) => v.nodeId !== result.nodeId),
          result,
        ],
      },
    })),

  attachEvidence: (nodeId, evidence) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        updatedAt: new Date().toISOString(),
        tree: {
          ...s.analysis.tree,
          nodes: s.analysis.tree.nodes.map((n) =>
            n.id === nodeId
              ? { ...n, evidence: [...n.evidence, evidence] }
              : n
          ),
        },
      },
    })),

  // Solutions
  addSolution: (solution) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        updatedAt: new Date().toISOString(),
        solutions: [...s.analysis.solutions, solution],
      },
    })),

  setSolutions: (solutions) =>
    set((s) => ({
      analysis: { ...s.analysis, updatedAt: new Date().toISOString(), solutions },
    })),

  rankSolution: (id, rank) =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        solutions: s.analysis.solutions.map((sol) =>
          sol.id === id ? { ...sol, userRank: rank } : sol
        ),
      },
    })),

  // Navigation
  setCurrentPhase: (phase) =>
    set((s) => ({
      analysis: { ...s.analysis, currentPhase: phase },
    })),

  setTitle: (title) =>
    set((s) => ({
      analysis: { ...s.analysis, title },
    })),

  // Streaming
  setStreaming: (isStreaming, phase = null) =>
    set({ isStreaming, streamingPhase: phase }),

  incrementAIInteractions: () =>
    set((s) => ({
      analysis: {
        ...s.analysis,
        metadata: {
          ...s.analysis.metadata,
          totalAIInteractions: s.analysis.metadata.totalAIInteractions + 1,
        },
      },
    })),

  // Persistence
  exportAnalysis: () => {
    const { analysis } = get();
    return {
      format: "firstp-analysis" as const,
      version: 1 as const,
      exportedAt: new Date().toISOString(),
      analysis: {
        ...analysis,
        metadata: {
          ...analysis.metadata,
          exportCount: analysis.metadata.exportCount + 1,
        },
      },
    };
  },

  importAnalysis: (data) => {
    if (data.format !== "firstp-analysis" || !data.analysis) {
      throw new Error("Invalid analysis file format");
    }
    set({ analysis: data.analysis, isStreaming: false, streamingPhase: null });
  },

  newAnalysis: () =>
    set({
      analysis: createEmptyAnalysis(),
      isStreaming: false,
      streamingPhase: null,
    }),
}));

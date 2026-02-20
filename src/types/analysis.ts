export type AnalysisPhase =
  | "framing"
  | "assumptions"
  | "decomposition"
  | "validation"
  | "reconstruction"
  | "dashboard";

export type AssumptionCategory =
  | "domain"
  | "constraint"
  | "cultural"
  | "technical"
  | "economic"
  | "temporal"
  | "scope";

export type NodeType =
  | "root"
  | "component"
  | "principle"
  | "question"
  | "constraint";

export type EvidenceType =
  | "statistic"
  | "study"
  | "expert_opinion"
  | "historical"
  | "logical"
  | "empirical";

export interface ReframedStatement {
  id: string;
  text: string;
  perspective: string;
  selected: boolean;
}

export interface ProblemFraming {
  originalInput: string;
  reframedStatements: ReframedStatement[];
  selectedFraming: string;
  domain: string | null;
  context: string;
  timestamp: string;
}

export interface Assumption {
  id: string;
  text: string;
  category: AssumptionCategory;
  confidence: number;
  source: "ai" | "user";
  isChallengeable: boolean;
  notes: string;
  validationStatus: "pending" | "validated" | "challenged" | "disproved";
  timestamp: string;
}

export interface DecompositionNode {
  id: string;
  parentId: string | null;
  label: string;
  description: string;
  type: NodeType;
  depth: number;
  isFundamental: boolean;
  source: "ai" | "user";
  evidence: Evidence[];
  position: { x: number; y: number };
  collapsed: boolean;
  timestamp: string;
}

export interface DecompositionEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Evidence {
  id: string;
  nodeId: string;
  type: EvidenceType;
  content: string;
  source: string;
  sourceLabel: string;
  confidence: "high" | "medium" | "low";
  isCounterArgument: boolean;
  timestamp: string;
}

export interface ValidationResult {
  nodeId: string;
  overallConfidence: "high" | "medium" | "low";
  evidence: Evidence[];
  counterArguments: Evidence[];
  summary: string;
  suggestedRevision: string | null;
}

export interface Solution {
  id: string;
  title: string;
  description: string;
  approach: "first_principles" | "conventional";
  usedPrinciples: string[];
  novelty: "incremental" | "moderate" | "radical";
  feasibility: "high" | "medium" | "low";
  userRank: number | null;
  aiRationale: string;
  timestamp: string;
}

export interface Analysis {
  id: string;
  version: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  currentPhase: AnalysisPhase;
  framing: ProblemFraming;
  assumptions: Assumption[];
  tree: {
    nodes: DecompositionNode[];
    edges: DecompositionEdge[];
  };
  validations: ValidationResult[];
  solutions: Solution[];
  metadata: {
    totalAIInteractions: number;
    timeSpentMinutes: number;
    exportCount: number;
  };
}

export interface ExportedAnalysis {
  format: "firstp-analysis";
  version: 1;
  exportedAt: string;
  analysis: Analysis;
}

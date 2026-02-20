import type { NodeType } from "./analysis";

export interface FramingRequest {
  problemInput: string;
  context?: string;
  domain?: string;
}

export interface AssumptionRequest {
  problemStatement: string;
  existingAssumptions: string[];
}

export interface DecomposeRequest {
  problemStatement: string;
  currentNodes: Array<{ id: string; label: string; description: string }>;
  targetNodeId: string;
  assumptions: string[];
}

export interface ValidateRequest {
  claim: string;
  context: string;
  nodeType: NodeType;
}

export interface ReconstructRequest {
  problemStatement: string;
  fundamentalTruths: Array<{ label: string; description: string }>;
  challengedAssumptions: string[];
}

export interface StreamChunk {
  type: "text" | "data" | "done" | "error";
  content: string;
  metadata?: Record<string, unknown>;
}

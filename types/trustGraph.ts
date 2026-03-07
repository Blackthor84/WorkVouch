/**
 * Types for Trust Graph visualization (React Flow).
 */

export type GraphNodeType = "candidate" | "coworker" | "manager";

export type GraphNode = {
  id: string;
  label: string;
  type: GraphNodeType;
  /** For hover tooltip */
  verificationType?: string;
  /** ISO timestamp for tooltip */
  timestamp?: string;
  /** When true, render node in red (suspicious cluster) */
  suspicious?: boolean;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  /** ISO timestamp for tooltip */
  timestamp?: string;
};

export type TrustGraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** When true, fraud detection flagged this graph */
  suspicious?: boolean;
  suspiciousReason?: string;
};

"use client";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeProps,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import type { TrustGraphData, GraphNode as ApiGraphNode } from "@/types/trustGraph";

const CANDIDATE_COLOR = "#3b82f6";
const MANAGER_COLOR = "#22c55e";
const COWORKER_COLOR = "#6b7280";
const SUSPICIOUS_COLOR = "#dc2626";

function nodeColor(type: ApiGraphNode["type"], suspicious?: boolean): string {
  if (suspicious) return SUSPICIOUS_COLOR;
  switch (type) {
    case "candidate":
      return CANDIDATE_COLOR;
    case "manager":
      return MANAGER_COLOR;
    case "coworker":
    default:
      return COWORKER_COLOR;
  }
}

function TrustGraphNode({ data, selected }: NodeProps) {
  const d = data as {
    label?: string;
    nodeType?: ApiGraphNode["type"];
    verificationType?: string;
    timestamp?: string;
    suspicious?: boolean;
  };
  const color = nodeColor(d.nodeType ?? "coworker", d.suspicious);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative rounded-lg border-2 px-3 py-2 shadow-sm"
      style={{
        borderColor: color,
        backgroundColor: selected ? `${color}20` : "white",
        minWidth: 100,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="font-medium text-slate-900" style={{ color }}>
        {d.label ?? "Unknown"}
      </div>
      {showTooltip && (
        <div
          className="absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 rounded bg-slate-800 px-2 py-1.5 text-xs text-white shadow-lg whitespace-nowrap"
          role="tooltip"
        >
          <div>{d.label}</div>
          {d.verificationType && (
            <div className="text-slate-300">{d.verificationType}</div>
          )}
          {d.timestamp && (
            <div className="text-slate-400">
              {new Date(d.timestamp).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { trustNode: TrustGraphNode };

function layoutNodes(
  apiNodes: ApiGraphNode[],
  candidateId: string,
  width: number,
  height: number
): Node[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const candidate = apiNodes.find((n) => n.id === candidateId);
  const others = apiNodes.filter((n) => n.id !== candidateId);
  const positions: Node[] = [];

  if (candidate) {
    positions.push({
      id: candidate.id,
      type: "trustNode",
      position: { x: centerX - 60, y: centerY - 20 },
      data: {
        label: candidate.label,
        nodeType: candidate.type,
        verificationType: candidate.verificationType,
        timestamp: candidate.timestamp,
        suspicious: candidate.suspicious,
      },
    });
  }

  const r = 180;
  others.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(others.length, 1);
    positions.push({
      id: n.id,
      type: "trustNode",
      position: {
        x: centerX + r * Math.cos(angle) - 50,
        y: centerY + r * Math.sin(angle) - 20,
      },
      data: {
        label: n.label,
        nodeType: n.type,
        verificationType: n.verificationType,
        timestamp: n.timestamp,
        suspicious: n.suspicious,
      },
    });
  });

  return positions;
}

interface TrustGraphProps {
  candidateId: string;
}

export function TrustGraph({ candidateId }: TrustGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suspicious, setSuspicious] = useState(false);
  const [suspiciousReason, setSuspiciousReason] = useState<string | null>(null);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/trust/graph/${encodeURIComponent(candidateId)}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to load graph");
      }
      const data: TrustGraphData = await res.json();

      setSuspicious(Boolean(data.suspicious));
      setSuspiciousReason(data.suspiciousReason ?? null);

      const apiNodes = data.nodes ?? [];
      const candidate = apiNodes.find((n) => n.type === "candidate");
      const candId = candidate?.id ?? candidateId;

      if (data.suspicious && apiNodes.length > 0) {
        apiNodes.forEach((n) => {
          if (n.type !== "candidate") n.suspicious = true;
        });
      }

      const layouted = layoutNodes(apiNodes, candId, 600, 400);
      setNodes(layouted);

      const flowEdges: Edge[] = (data.edges ?? []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        labelStyle: { fontSize: 10 },
        labelBgStyle: { fill: "white" },
        labelBgBorderRadius: 4,
      }));
      setEdges(flowEdges);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load graph");
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [candidateId, setNodes, setEdges]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-slate-500">Loading verification network…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suspicious && suspiciousReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Suspicious verification cluster
          </p>
          <p className="text-xs text-red-700 dark:text-red-300">{suspiciousReason}</p>
        </div>
      )}
      <div className="h-[400px] w-full rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

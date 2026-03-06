"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import type { TrustNetworkConnection } from "@/app/api/trust/network/[profileId]/route";
import { UserCircleIcon } from "@heroicons/react/24/outline";

export type TrustNetworkGraphProps = {
  profileId: string;
  profileName: string | null;
  connections: TrustNetworkConnection[];
  depthBand: string;
  onProfileClick?: (profileId: string) => void;
};

const RADIUS = 140;
const CENTER = 200;
const NODE_R = 24;

function polarToCart(angle: number, r: number) {
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) };
}

export function TrustNetworkGraph({
  profileId,
  profileName,
  connections,
  depthBand,
  onProfileClick,
}: TrustNetworkGraphProps) {
  const [scale, setScale] = useState(1);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const positions = useMemo(() => {
    const n = connections.length;
    if (n === 0) return [];
    return connections.map((c, i) => ({
      ...c,
      ...polarToCart((2 * Math.PI * i) / n, RADIUS),
    }));
  }, [connections]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      setScale((s) => Math.min(2, Math.max(0.4, s - e.deltaY * 0.002)));
    },
    []
  );

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Trust Network
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Depth: {depthBand}. Central node: you; connected professionals with relationship type.
      </p>
      <div
        ref={containerRef}
        className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
        onWheel={handleWheel}
        style={{ touchAction: "none" }}
      >
        <svg
          width="100%"
          height="380"
          viewBox="0 0 400 400"
          className="cursor-grab active:cursor-grabbing"
          style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
        >
          {/* Edges */}
          {positions.map((p) => (
            <line
              key={p.profile_id}
              x1={CENTER}
              y1={CENTER}
              x2={p.x}
              y2={p.y}
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="1.5"
            />
          ))}
          {/* Central node */}
          <g>
            <circle
              cx={CENTER}
              cy={CENTER}
              r={NODE_R + 2}
              fill="rgb(59 130 246)"
              className="text-blue-500"
            />
            <circle cx={CENTER} cy={CENTER} r={NODE_R} fill="rgb(37 99 235)" />
            <text
              x={CENTER}
              y={CENTER + 5}
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="600"
            >
              You
            </text>
          </g>
          {/* Connection nodes */}
          {positions.map((p) => {
            const isHover = hoverId === p.profile_id;
            return (
              <g
                key={p.profile_id}
                onMouseEnter={() => setHoverId(p.profile_id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={() => onProfileClick?.(p.profile_id)}
                className="cursor-pointer"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHover ? NODE_R + 4 : NODE_R}
                  fill={isHover ? "rgb(34 197 94)" : "rgb(148 163 184)"}
                  className="transition-all"
                />
                <text
                  x={p.x}
                  y={p.y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="9"
                  fontWeight="500"
                >
                  {p.relationship_type === "manager" ? "M" : "C"}
                </text>
                {isHover && (
                  <title>
                    {p.full_name ?? "Unknown"} ({p.relationship_type})
                    {onProfileClick ? " — Click to view profile" : ""}
                  </title>
                )}
              </g>
            );
          })}
        </svg>
        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Scroll to zoom · Hover for tooltip
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            M=Manager C=Coworker
          </span>
        </div>
      </div>
    </Card>
  );
}

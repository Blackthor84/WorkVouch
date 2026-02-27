"use client";

import { useEffect } from "react";

type Props = { message: string; onClose: () => void };

export function Toast({ message, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        background: "#111",
        color: "#fff",
        padding: "12px 16px",
        borderRadius: 6,
        zIndex: 9999,
      }}
    >
      {message}
    </div>
  );
}

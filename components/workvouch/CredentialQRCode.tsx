"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";

const QRCode = dynamic(() => import("react-qr-code").then((m) => m.default), { ssr: false });

interface CredentialQRCodeProps {
  shareUrl: string;
  size?: number;
  className?: string;
}

export function CredentialQRCode({
  shareUrl,
  size = 200,
  className = "",
}: CredentialQRCodeProps) {
  const absoluteUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      if (shareUrl.startsWith("http")) return shareUrl;
      return (window.location.origin + (shareUrl.startsWith("/") ? "" : "/") + shareUrl);
    }
    return shareUrl;
  }, [shareUrl]);

  return (
    <div className={"inline-flex items-center justify-center rounded-xl bg-white p-3 border border-slate-200 dark:border-slate-700 " + className}>
      <QRCode value={absoluteUrl} size={size} level="M" />
    </div>
  );
}

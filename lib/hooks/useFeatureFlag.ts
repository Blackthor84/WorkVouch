"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePreview } from "@/lib/preview-context";

function isPreviewAdmin(session: { user?: { role?: string } } | null): boolean {
  if (!session?.user) return false;
  const role = session.user.role;
  return role === "admin" || role === "superadmin";
}

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string | undefined, { enabled: boolean; ts: number }>();

function getCached(key: string | undefined): boolean | null {
  if (!key) return null;
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.enabled;
}

function setCached(key: string | undefined, enabled: boolean): void {
  if (key) cache.set(key, { enabled, ts: Date.now() });
}

/**
 * useFeatureFlag(featureKey)
 * Calls /api/feature-flags/check?key=... and returns { enabled, loading }.
 * Respects global flag, user assignment, and employer assignment (server-side).
 * Usage: const { enabled, loading } = useFeatureFlag("ads_system"); if (!enabled) return null;
 */
export function useFeatureFlag(featureKey: string): {
  enabled: boolean;
  loading: boolean;
} {
  const { preview } = usePreview();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const previewEnabled = Boolean(preview?.featureFlags?.includes(featureKey));

  useEffect(() => {
    const key = typeof featureKey === "string" ? featureKey.trim() : "";
    if (!key) {
      setEnabled(false);
      setLoading(false);
      return;
    }

    const cached = getCached(key);
    if (cached !== null) {
      setEnabled(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/feature-flags/check?key=${encodeURIComponent(key)}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const value = Boolean(data?.enabled);
        setEnabled(value);
        setCached(key, value);
      })
      .catch(() => {
        if (!cancelled) {
          setEnabled(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [featureKey]);

  return {
    enabled: previewEnabled || (loading ? false : enabled),
    loading: previewEnabled ? false : loading,
  };
}

/**
 * useFeatureFlagWithLoading(featureKey)
 * Returns { enabled, loading } for UI that shows loading state.
 */
export function useFeatureFlagWithLoading(featureKey: string): {
  enabled: boolean;
  loading: boolean;
} {
  const { data: session } = useSession();
  const { preview } = usePreview();
  const previewModeActive = Boolean(preview && (preview.demoActive || preview.featureFlags?.length) && isPreviewAdmin(session));
  const previewEnabled =
    previewModeActive &&
    (preview?.previewFeatures?.[featureKey] === true || (preview?.previewFeatures?.[featureKey] !== false && preview?.featureFlags?.includes(featureKey)));
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  if (previewEnabled) {
    return { enabled: true, loading: false };
  }

  useEffect(() => {
    const key = typeof featureKey === "string" ? featureKey.trim() : "";
    if (!key) {
      setEnabled(false);
      setLoading(false);
      return;
    }

    const cached = getCached(key);
    if (cached !== null) {
      setEnabled(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/feature-flags/check?key=${encodeURIComponent(key)}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          const value = Boolean(data?.enabled);
          setEnabled(value);
          setCached(key, value);
        }
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [featureKey]);

  return {
    enabled: previewEnabled || enabled,
    loading: previewEnabled ? false : loading,
  };
}


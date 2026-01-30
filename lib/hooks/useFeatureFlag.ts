"use client";

import { useState, useEffect, useRef } from "react";

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
 * Calls secure API that wraps checkFeatureAccess. Returns boolean. Caches result (1 min TTL).
 * Usage: const canUseRehire = useFeatureFlag("rehire_indicator"); if (canUseRehire) { render feature }
 */
export function useFeatureFlag(featureKey: string): boolean {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const keyRef = useRef(featureKey);

  useEffect(() => {
    const key = typeof featureKey === "string" ? featureKey.trim() : "";
    keyRef.current = key;
    if (!key) {
      setEnabled(false);
      setLoaded(true);
      return;
    }

    const cached = getCached(key);
    if (cached !== null) {
      setEnabled(cached);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    setLoaded(false);
    fetch(`/api/feature-flags/check?key=${encodeURIComponent(key)}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const value = Boolean(data?.enabled);
        setEnabled(value);
        setLoaded(true);
        setCached(key, value);
      })
      .catch(() => {
        if (!cancelled) {
          setEnabled(false);
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [featureKey]);

  return loaded ? enabled : false;
}

/**
 * useFeatureFlagWithLoading(featureKey)
 * Returns { enabled, loading } for UI that shows loading state.
 */
export function useFeatureFlagWithLoading(featureKey: string): {
  enabled: boolean;
  loading: boolean;
} {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

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

  return { enabled, loading };
}

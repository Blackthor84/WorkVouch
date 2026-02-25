"use client";

import { useState, useEffect } from "react";
import {
  getState,
  subscribe,
  engineAction,
  getDerived,
  getEngineResult,
  simulate,
  tick,
  fastForward,
  freeze,
  resume,
  getEventLog,
  hydrate,
} from "./engine";
import type { EngineActionType, SimulateOptions, TrustEventRecord } from "./types";

export function useTrustEngine() {
  const [state, setState] = useState(getState);
  const derived = getDerived();

  useEffect(() => {
    return subscribe(() => setState(getState()));
  }, []);

  const dispatch = (action: EngineActionType, userId?: string | null) =>
    engineAction(action, userId ?? null);

  return {
    state,
    derived,
    engineAction: dispatch,
    getEngineResult,
    simulate: (opts: SimulateOptions) => simulate(opts),
    tick,
    fastForward,
    freeze,
    resume,
    getEventLog,
    hydrate: (events: TrustEventRecord[]) => hydrate(events),
  };
}

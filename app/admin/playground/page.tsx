"use client";

import { EnterpriseGate } from "@/components/playground/EnterpriseGate";
import PlaygroundClient from "./PlaygroundClient";

export default function AdminPlayground() {
  return (
    <EnterpriseGate>
      <PlaygroundClient />
    </EnterpriseGate>
  );
}

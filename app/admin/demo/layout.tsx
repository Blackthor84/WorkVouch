"use client";

import { DemoSimulatorProvider } from "./DemoSimulatorProvider";

export default function AdminDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DemoSimulatorProvider>{children}</DemoSimulatorProvider>;
}

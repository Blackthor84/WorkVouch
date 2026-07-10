import type { Metadata } from "next";
import EmployerDemoClient from "@/components/sales-demo/EmployerDemoClient";

export const metadata: Metadata = {
  title: "Employer Experience Demo — WorkVouch",
  description:
    "Walk through the WorkVouch employer journey: candidate search, trust profiles, analytics, and hiring with confidence.",
};

export default function EmployerExperiencePage() {
  return <EmployerDemoClient />;
}

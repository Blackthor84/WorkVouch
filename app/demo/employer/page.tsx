import type { Metadata } from "next";
import EmployerFlow from "@/components/demo-center/EmployerFlow";

export const metadata: Metadata = {
  title: "Employer Demo — WorkVouch Live Demo",
  description:
    "Walk through the WorkVouch employer journey: hiring dashboard, candidate search, trust profiles, AI insights, and ROI.",
};

export default function DemoEmployerPage() {
  return <EmployerFlow />;
}

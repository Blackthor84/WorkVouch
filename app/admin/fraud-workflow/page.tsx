import type { Metadata } from "next";
import FraudWorkflowClient from "./FraudWorkflowClient";

export const metadata: Metadata = {
  title: "Fraud Workflow | Admin | WorkVouch",
  description: "Internal fraud investigation workflow. Admin only.",
};

export default function FraudWorkflowPage() {
  return <FraudWorkflowClient />;
}

import type { Metadata } from "next";
import EmployeeDemoClient from "@/components/sales-demo/EmployeeDemoClient";

export const metadata: Metadata = {
  title: "Employee Experience Demo — WorkVouch",
  description:
    "Walk through the WorkVouch employee journey: coworker matching, verified reviews, trust score, and portable reputation.",
};

export default function EmployeeExperiencePage() {
  return <EmployeeDemoClient />;
}

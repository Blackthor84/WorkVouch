import type { Metadata } from "next";
import EmployeeFlow from "@/components/demo-center/EmployeeFlow";

export const metadata: Metadata = {
  title: "Employee Demo — WorkVouch Live Demo",
  description:
    "Walk through the WorkVouch employee journey: profile creation, coworker matching, verified reviews, trust score, and career timeline.",
};

export default function DemoEmployeePage() {
  return <EmployeeFlow />;
}

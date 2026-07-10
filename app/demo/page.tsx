import type { Metadata } from "next";
import DemoLanding from "@/components/demo-center/DemoLanding";

export const metadata: Metadata = {
  title: "WorkVouch Live Demo — Interactive Product Experience",
  description:
    "Explore the full WorkVouch experience for workers and employers. No signup required — fully interactive demo with realistic sample data.",
};

export default function DemoPage() {
  return <DemoLanding />;
}

import type { Metadata } from "next";
import SalesDemoLanding from "@/components/sales-demo/SalesDemoLanding";

export const metadata: Metadata = {
  title: "WorkVouch Interactive Demo — Trust Built by Coworkers",
  description:
    "Explore the full WorkVouch experience for workers and employers. No signup required — interactive sales demo with realistic sample data.",
};

export default function ExperiencePage() {
  return <SalesDemoLanding />;
}

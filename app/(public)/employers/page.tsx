import type { Metadata } from "next";
import Footer from "@/components/Footer";
import BadHireCalculator from "@/components/marketing/BadHireCalculator";
import { EmployerLandingPage } from "@/components/marketing/EmployerLandingPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "For employers | Hire verified workers | WorkVouch",
  description:
    "See which candidates are verified by real coworkers. Request access to WorkVouch for employers.",
};

export default function EmployersPage() {
  return (
    <>
      <EmployerLandingPage afterHero={<BadHireCalculator />} />
      <Footer />
    </>
  );
}

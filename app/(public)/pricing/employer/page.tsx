export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import EmployerLandingClient from "./EmployerLandingClient";

export const metadata: Metadata = {
  title: "For Employers | WorkVouch",
  description:
    "Access verified employment overlap, peer-validated references, reputation scores, and rehire eligibility — one structured dashboard for high-trust hiring.",
};

export default function EmployerPricingPage() {
  return <EmployerLandingClient />;
}

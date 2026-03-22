import type { Metadata } from "next";
import GetVouchedHomePage from "@/components/marketing/GetVouchedHomePage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Get verified by coworkers | WorkVouch",
  description:
    "Stop relying on resumes. Prove you're legit with real coworker confirmation. Add your job, invite coworkers, get verified.",
};

export default function Home() {
  return <GetVouchedHomePage />;
}

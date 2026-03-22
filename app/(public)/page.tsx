import type { Metadata } from "next";
import GetVouchedHomePage from "@/components/marketing/GetVouchedHomePage";
import { getUser } from "@/lib/auth/getUser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Get verified by coworkers | WorkVouch",
  description:
    "Stop relying on resumes. Prove you're legit with real coworker confirmation. Add your job, invite coworkers, get verified.",
};

export default async function Home() {
  const user = await getUser();
  return <GetVouchedHomePage showMinimalNav={!user} />;
}

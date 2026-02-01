import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function JobsPage() {
  return (
    <div className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 lg:py-16 bg-background dark:bg-[#0D1117]">
      <div className="w-full max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
          Trust &amp; verification first
        </h1>
        <p className="text-grey-medium dark:text-gray-400 mt-2 mb-6">
          WorkVouch verifies work history and references so employers can hire with confidence. We do not operate a job board.
        </p>
        <Card className="p-8">
          <p className="text-grey-dark dark:text-gray-200 mb-4">
            Build your verified profile and let employers request verification when they find you.
          </p>
          <Button asChild>
            <Link href="/auth/signup">Get started</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}

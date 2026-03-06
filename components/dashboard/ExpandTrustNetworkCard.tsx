import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ExpandTrustNetworkCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expand Your Trust Network</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Invite coworkers, managers, or clients to confirm your work history and strengthen your
          verified professional network. Send by email, text message, or both.
        </p>
        <Button href="/verify/request" className="mt-4">
          Send Verification Request
        </Button>
      </CardContent>
    </Card>
  );
}

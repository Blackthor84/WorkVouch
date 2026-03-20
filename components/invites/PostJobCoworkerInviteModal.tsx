"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CoworkerInvitePanel } from "@/components/invites/CoworkerInvitePanel";

export function PostJobCoworkerInviteModal({
  open,
  onOpenChange,
  companyName,
  jobId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  jobId?: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Find coworkers from {companyName || "your workplace"}
          </DialogTitle>
          <p className="text-base text-slate-600 dark:text-slate-300 pt-2">
            Coworkers who join through your invite strengthen your network, unlock matches faster, and boost trust for
            both of you when you overlap at the same company.
          </p>
        </DialogHeader>
        <div className="pt-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <span aria-hidden>👉</span> Invite coworkers
          </p>
          <CoworkerInvitePanel companyName={companyName} jobId={jobId} />
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Maybe later
        </button>
      </DialogContent>
    </Dialog>
  );
}

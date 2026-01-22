"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@heroicons/react/24/outline";
import { AddJobModal } from "./add-job-modal";

export function AddJobButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <PlusIcon className="h-5 w-5 mr-2" />
        Add Job
      </Button>
      <AddJobModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

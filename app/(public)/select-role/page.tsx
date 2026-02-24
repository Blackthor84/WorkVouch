import { Suspense } from "react";
import SelectRoleClient from "./SelectRoleClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SelectRoleClient />
    </Suspense>
  );
}

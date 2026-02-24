import { Suspense } from "react";
import BetaLoginClient from "./BetaLoginClient";

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <BetaLoginClient />
    </Suspense>
  );
}

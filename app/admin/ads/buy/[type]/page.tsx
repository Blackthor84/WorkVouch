import { Suspense } from "react";
import BuyAdClient from "./BuyAdClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <BuyAdClient />
    </Suspense>
  );
}

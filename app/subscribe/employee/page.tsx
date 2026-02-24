import { Suspense } from "react";
import EmployeeSubscribeClient from "./EmployeeSubscribeClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmployeeSubscribeClient />
    </Suspense>
  );
}

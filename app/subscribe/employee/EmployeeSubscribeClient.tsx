"use client";

import { useSearchParams } from "next/navigation";

export default function EmployeeSubscribeClient() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");

  return (
    <div>
      <h1>Employee Subscription</h1>
      {plan && <p>Selected plan: {plan}</p>}
    </div>
  );
}

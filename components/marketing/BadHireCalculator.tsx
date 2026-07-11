"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { WvCard, WvButton, WvInput } from "@/components/wv";

export default function BadHireCalculator() {
  const router = useRouter();
  const [salary, setSalary] = useState(70000);

  const cost = Math.round(salary * 0.25);

  return (
    <section className="mt-12 flex justify-center" aria-labelledby="bad-hire-heading">
      <WvCard glow padding="lg" className="max-w-xl w-full text-center">
        <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-4" aria-hidden />

        <h2 id="bad-hire-heading" className="text-2xl font-bold text-wv-foreground sm:text-3xl mb-3">
          A bad hire is more expensive than you think.
        </h2>

        <p className="text-wv-muted mb-6 text-sm sm:text-base">
          See how much a hiring mistake could cost your business in seconds.
        </p>

        <div className="mb-6 text-left">
          <WvInput
            label="Annual Salary"
            id="bad-hire-salary"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={salary === 0 ? "" : salary.toLocaleString("en-US")}
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              const number = parseInt(raw, 10);
              setSalary(Number.isFinite(number) && number >= 0 ? number : 0);
            }}
            className="text-center text-lg font-semibold pl-8"
          />
        </div>

        <p className="text-wv-subtle text-sm">A bad hire could cost you:</p>

        <div className="text-4xl sm:text-5xl font-bold text-red-400 my-3 tabular-nums">
          ${cost.toLocaleString()}
        </div>

        <p className="text-wv-subtle text-sm mb-6">
          Based on training, lost productivity, and rehiring costs.
        </p>

        <WvButton
          type="button"
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => {
            try {
              localStorage.setItem("badHireCost", cost.toString());
              localStorage.setItem("badHireCalculatorSalary", salary.toString());
            } catch {
              /* ignore quota / private mode */
            }
            router.push("/signup?source=calculator");
          }}
        >
          Reduce hiring risk with verified coworkers
        </WvButton>
      </WvCard>
    </section>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BadHireCalculator() {
  const router = useRouter();
  const [salary, setSalary] = useState(70000);

  const cost = Math.round(salary * 0.25);

  return (
    <section className="bg-gray-50 py-20 px-6 flex justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-xl w-full text-center">

        <h2 className="text-3xl font-bold mb-3">
          A bad hire is more expensive than you think.
        </h2>

        <p className="text-gray-600 mb-6">
          See how much a hiring mistake could cost your business in seconds.
        </p>

        <div className="mb-6 text-left">
          <label
            htmlFor="bad-hire-salary"
            className="block text-sm font-medium text-gray-600 mb-2"
          >
            Annual Salary
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
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
              className="w-full pl-8 pr-4 py-4 border rounded-xl text-lg font-semibold text-center"
            />
          </div>
        </div>

        <p className="text-gray-500 text-sm">A bad hire could cost you:</p>

        <div className="text-5xl font-bold text-red-500 my-3">
          ${cost.toLocaleString()}
        </div>

        <p className="text-gray-500 text-sm mb-6">
          Based on training, lost productivity, and rehiring costs.
        </p>

        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem("badHireCost", cost.toString());
              localStorage.setItem("badHireCalculatorSalary", salary.toString());
            } catch {
              /* ignore quota / private mode */
            }
            router.push("/signup?source=calculator");
          }}
          className="bg-black text-white px-6 py-3 rounded-lg hover:opacity-90"
        >
          Reduce hiring risk with verified coworkers
        </button>

      </div>
    </section>
  );
}

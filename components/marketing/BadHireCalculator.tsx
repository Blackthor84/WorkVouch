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

        <input
          type="number"
          value={salary}
          onChange={(e) => setSalary(Number(e.target.value))}
          className="w-full p-3 border rounded-lg mb-6 text-center text-lg"
        />

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

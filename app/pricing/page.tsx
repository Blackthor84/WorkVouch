"use client";
import { useState } from "react";

export default function Pricing() {
  const [tab, setTab] = useState("employee");

  return (
    <div className="bg-gray-50 min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-blue-700 mb-10">
          WorkVouch Pricing
        </h1>

        <div className="flex justify-center mb-10">
          <button
            onClick={() => setTab("employee")}
            className={`px-6 py-2 rounded-l-md border ${
              tab === "employee"
                ? "bg-blue-700 text-white"
                : "bg-white text-blue-700"
            }`}
          >
            Employees
          </button>

          <button
            onClick={() => setTab("employer")}
            className={`px-6 py-2 rounded-r-md border ${
              tab === "employer"
                ? "bg-blue-700 text-white"
                : "bg-white text-blue-700"
            }`}
          >
            Employers
          </button>
        </div>

        {tab === "employee" && (
          <div className="bg-white shadow-md p-8 rounded-xl">
            <h2 className="text-3xl font-semibold text-blue-700 mb-4">
              Employees
            </h2>
            <p className="text-gray-700 mb-6">
              Build a verified work history.
            </p>
            <ul className="space-y-3 text-gray-700">
              <li>✔ Verified employment records</li>
              <li>✔ Performance notes</li>
              <li>✔ Better job opportunities</li>
            </ul>
          </div>
        )}

        {tab === "employer" && (
          <div className="bg-white shadow-md p-8 rounded-xl">
            <h2 className="text-3xl font-semibold text-blue-700 mb-4">
              Employers
            </h2>
            <p className="text-gray-700 mb-6">
              Hire faster with verified employee history.
            </p>
            <ul className="space-y-3 text-gray-700">
              <li>✔ Unlimited employee lookups</li>
              <li>✔ Conduct & performance tracking</li>
              <li>✔ HR management tools</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

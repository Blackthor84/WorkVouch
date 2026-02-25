"use client";

import { useState } from "react";

export default function ScenarioBuilder() {
  const [title, setTitle] = useState("");
  const [delta, setDelta] = useState(0);

  async function save() {
    await fetch("/api/sandbox/create-scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        title,
        trustDelta: delta,
      }),
    });
    alert("Scenario added (mock)");
  }

  return (
    <div className="border rounded p-4 space-y-2">
      <h3 className="font-semibold">Create Scenario</h3>
      <input className="border p-1 w-full" placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
      <input className="border p-1 w-full" type="number" placeholder="Trust delta" onChange={(e) => setDelta(Number(e.target.value))} />
      <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={save}>
        Save
      </button>
    </div>
  );
}

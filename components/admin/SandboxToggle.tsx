"use client";

export function SandboxToggle({ enabled }: { enabled: boolean }) {
  async function toggleSandbox() {
    await fetch("/api/admin/sandbox/toggle", { method: "POST" });
    window.location.reload();
  }

  return (
    <button
      onClick={toggleSandbox}
      className={`px-4 py-2 rounded text-sm font-medium ${
        enabled
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-gray-200 text-gray-900 hover:bg-gray-300"
      }`}
    >
      {enabled ? "Exit Sandbox Mode" : "Enter Sandbox Mode"}
    </button>
  );
}

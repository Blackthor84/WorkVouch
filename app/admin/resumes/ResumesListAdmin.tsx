"use client";

import { useEffect, useState } from "react";

type ResumeRow = {
  id: string;
  user_id: string;
  organization_id: string | null;
  file_path: string;
  status: string;
  parsed_data?: { employment?: unknown[] } | null;
  parsing_error?: string | null;
  created_at: string;
};

export function ResumesListAdmin() {
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [orgId, setOrgId] = useState("");
  const [inspecting, setInspecting] = useState<ResumeRow | null>(null);

  const fetchList = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
    if (orgId) params.set("organizationId", orgId);
    fetch(`/api/admin/resumes?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setResumes(Array.isArray(d.resumes) ? d.resumes : []))
      .catch(() => setResumes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="User ID (optional)"
          className="border rounded px-2 py-1 text-sm w-48"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <input
          type="text"
          placeholder="Organization ID (optional)"
          className="border rounded px-2 py-1 text-sm w-48"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
        />
        <button
          type="button"
          onClick={fetchList}
          className="px-3 py-1 bg-slate-200 rounded text-sm hover:bg-slate-300"
        >
          Search
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="border rounded overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Org</th>
                <th className="px-3 py-2 text-left">Path</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resumes.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{r.id.slice(0, 8)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.user_id.slice(0, 8)}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.organization_id ? r.organization_id.slice(0, 8) : "—"}
                  </td>
                  <td className="px-3 py-2 truncate max-w-[120px]">{r.file_path}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setInspecting(r)}
                      className="text-blue-600 hover:underline"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {resumes.length === 0 && !loading && (
        <p className="text-sm text-slate-500">No resumes found. Run migration to create resumes table.</p>
      )}
      {inspecting && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setInspecting(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-2">Parsed data</h3>
            <pre className="text-xs bg-slate-100 p-3 rounded overflow-auto">
              {JSON.stringify(inspecting.parsed_data ?? inspecting.parsing_error ?? "—", null, 2)}
            </pre>
            <button
              type="button"
              onClick={() => setInspecting(null)}
              className="mt-2 px-3 py-1 bg-slate-200 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Audit Log — Admin" }] }),
  component: AuditPage,
});

function AuditPage() {
  const [search, setSearch] = useState("");
  const { data: auditLogs } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => (await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500)).data ?? [],
    refetchInterval: 15000,
  });

  const filtered = (auditLogs ?? []).filter((l: any) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const code = (l.details && (l.details.code || l.details.access_code)) || "";
    return (
      (l.actor_id ?? "").toLowerCase().includes(q) ||
      (l.target_id ?? "").toLowerCase().includes(q) ||
      String(code).toLowerCase().includes(q) ||
      (l.action ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Access-code redemptions and contact-reveal attempts (refreshes every 15s).</p>
        </div>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user ID, job ID, code, or action…" className="sm:w-96 h-9"/>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">Action</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Target</th>
              <th className="p-3">Result</th>
              <th className="p-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l: any) => (
              <tr key={l.id} className="border-t border-border">
                <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                <td className="p-3 font-medium">{l.action}</td>
                <td className="p-3 font-mono text-xs">{l.actor_id ? l.actor_id.slice(0, 8) : "—"}</td>
                <td className="p-3 font-mono text-xs">{l.target_type ?? "—"}{l.target_id ? `:${l.target_id.slice(0, 8)}` : ""}</td>
                <td className="p-3"><Badge variant={l.success ? "default" : "destructive"}>{l.success ? "OK" : "DENIED"}</Badge></td>
                <td className="p-3 text-xs text-muted-foreground">{l.reason ?? "—"}</td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">{search ? "No matching events." : "No activity yet."}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

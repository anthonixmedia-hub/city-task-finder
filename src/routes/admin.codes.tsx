import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/codes")({
  head: () => ({ meta: [{ title: "Access Codes — Admin" }] }),
  component: CodesPage,
});

function CodesPage() {
  const [planForNew, setPlanForNew] = useState<"premium" | "professional">("premium");
  const [bulk, setBulk] = useState(1);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const { data: codes, refetch } = useQuery({
    queryKey: ["admin-codes"],
    queryFn: async () => (await supabase.from("access_codes").select("*").order("created_at", { ascending: false }).limit(500)).data ?? [],
  });

  async function issueCodes() {
    setCreating(true);
    try {
      const start = 100001 + (codes?.length ?? 0);
      const rows = Array.from({ length: Math.max(1, Math.min(50, bulk)) }, (_, i) => ({
        code: `MCR-${start + i}`,
        plan: planForNew,
      }));
      const { error } = await supabase.from("access_codes").insert(rows);
      if (error) throw error;
      toast.success(`Issued ${rows.length} code${rows.length > 1 ? "s" : ""}`);
      refetch();
    } catch (err: any) {
      toast.error(err.message ?? "Could not issue codes");
    } finally { setCreating(false); }
  }

  const filtered = (codes ?? []).filter((c: any) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.code.toLowerCase().includes(q) || (c.assigned_to ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Access Codes</h1>
          <p className="text-sm text-muted-foreground">Issue codes that workers redeem to unlock contact details.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code or user ID…" className="w-48 h-9"/>
          <select value={planForNew} onChange={(e) => setPlanForNew(e.target.value as any)} className="h-9 rounded-md border border-input px-2 text-sm bg-background">
            <option value="premium">Premium</option>
            <option value="professional">Professional</option>
          </select>
          <Input type="number" min={1} max={50} value={bulk} onChange={(e) => setBulk(parseInt(e.target.value || "1"))} className="w-20 h-9"/>
          <Button size="sm" onClick={issueCodes} disabled={creating}><Plus className="h-4 w-4 mr-1"/>Issue</Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr><th className="p-3">Code</th><th className="p-3">Plan</th><th className="p-3">Status</th><th className="p-3">Assigned to</th><th className="p-3">Used at</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {filtered.map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3 capitalize">{c.plan}</td>
                <td className="p-3">{c.used ? <Badge variant="secondary">Used</Badge> : <Badge>Available</Badge>}</td>
                <td className="p-3 text-xs font-mono text-muted-foreground">{c.assigned_to ? c.assigned_to.slice(0, 12) + "…" : "—"}</td>
                <td className="p-3 text-xs text-muted-foreground">{c.used_at ? new Date(c.used_at).toLocaleString() : "—"}</td>
                <td className="p-3"><Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Copied"); }}><Copy className="h-4 w-4"/></Button></td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No codes.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

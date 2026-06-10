import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2, Star, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/admin/jobs")({
  head: () => ({ meta: [{ title: "Jobs — Admin" }] }),
  component: JobsPage,
});

function JobsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data: jobs, refetch } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => (await supabase.from("jobs").select("*").order("created_at", { ascending: false }).limit(500)).data ?? [],
  });

  async function setJobStatus(id: string, value: "active" | "closed" | "completed") {
    const { error } = await supabase.from("jobs").update({ status: value }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); refetch(); }
  }
  async function toggleUrgent(id: string, value: boolean) {
    const { error } = await supabase.from("jobs").update({ urgent: !value }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(!value ? "Marked urgent" : "Unmarked"); refetch(); }
  }
  async function deleteJob(id: string) {
    if (!confirm("Delete this job permanently?")) return;
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); refetch(); }
  }

  const filtered = (jobs ?? []).filter((j: any) => {
    if (status !== "all" && j.status !== status) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [j.title, j.city, j.area, j.category_slug, j.id].some((v: any) => (v ?? "").toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-muted-foreground">Moderate every posted job. Edits override owner controls.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, city, ID…" className="w-56 h-9"/>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border border-input px-2 text-sm bg-background">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Location</th>
              <th className="p-3">Status</th>
              <th className="p-3">Posted</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((j: any) => (
              <tr key={j.id} className="border-t border-border align-top">
                <td className="p-3">
                  <div className="font-medium flex items-center gap-2">
                    {j.title}
                    {j.urgent && <Badge variant="destructive" className="h-5">Urgent</Badge>}
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{j.id.slice(0, 8)}</div>
                </td>
                <td className="p-3 capitalize">{j.category_slug?.replace(/-/g, " ")}</td>
                <td className="p-3">{j.city}{j.area ? `, ${j.area}` : ""}</td>
                <td className="p-3"><Badge variant={j.status === "active" ? "default" : "outline"} className="capitalize">{j.status}</Badge></td>
                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(j.created_at)}</td>
                <td className="p-3">
                  <div className="flex justify-end items-center gap-1">
                    <Link to="/jobs/$id" params={{ id: j.id }}><Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4"/></Button></Link>
                    <Button size="sm" variant="ghost" title="Toggle urgent" onClick={() => toggleUrgent(j.id, j.urgent)}>
                      <Star className={`h-4 w-4 ${j.urgent ? "fill-yellow-500 text-yellow-500" : ""}`}/>
                    </Button>
                    {j.status === "active" ? (
                      <Button size="sm" variant="ghost" title="Close" onClick={() => setJobStatus(j.id, "closed")}>
                        <CheckCircle2 className="h-4 w-4"/>
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" title="Reopen" onClick={() => setJobStatus(j.id, "active")}>
                        Reopen
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" title="Delete" onClick={() => deleteJob(j.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No jobs match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

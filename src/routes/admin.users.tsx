import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: UsersPage,
});

function UsersPage() {
  const [search, setSearch] = useState("");

  const { data: users, refetch } = useQuery({
    queryKey: ["admin-users-all"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500)).data ?? [],
  });

  const { data: adminRoles, refetch: refetchRoles } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => (await supabase.from("user_roles").select("user_id, role").eq("role", "admin")).data ?? [],
  });
  const adminSet = new Set((adminRoles ?? []).map((r: any) => r.user_id));

  async function setPlan(id: string, plan: string) {
    const { error } = await supabase.from("profiles").update({ plan, access_unlocked: plan !== "free" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Plan updated"); refetch(); }
  }
  async function toggleVerified(id: string, value: boolean) {
    const { error } = await supabase.from("profiles").update({ verified: !value }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(!value ? "Verified" : "Unverified"); refetch(); }
  }
  async function toggleAdmin(id: string, isAdmin: boolean) {
    if (isAdmin) {
      if (!confirm("Revoke admin role from this user?")) return;
      const { error } = await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin");
      if (error) return toast.error(error.message);
    } else {
      if (!confirm("Grant admin role to this user?")) return;
      const { error } = await supabase.from("user_roles").insert({ user_id: id, role: "admin" });
      if (error) return toast.error(error.message);
    }
    toast.success("Role updated");
    refetchRoles();
  }

  const filtered = (users ?? []).filter((u: any) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [u.full_name, u.email, u.mobile, u.city, u.id].some((v: any) => (v ?? "").toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage all registered users. Plan and verification changes apply immediately.</p>
        </div>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, mobile, ID…" className="sm:w-80 h-9"/>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Name / Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Verified</th>
              <th className="p-3">City</th>
              <th className="p-3">Mobile</th>
              <th className="p-3">Joined</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u: any) => {
              const isAdmin = adminSet.has(u.id);
              return (
                <tr key={u.id} className="border-t border-border align-top">
                  <td className="p-3">
                    <div className="font-medium flex items-center gap-2">
                      {u.full_name || "—"}
                      {isAdmin && <Badge variant="secondary" className="h-5">Admin</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.email ?? "—"}</div>
                  </td>
                  <td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3">
                    <select value={u.plan} onChange={(e) => setPlan(u.id, e.target.value)} className="h-8 rounded-md border border-input px-2 text-xs bg-background capitalize">
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                      <option value="professional">Professional</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <Badge variant={u.verified ? "default" : "outline"}>{u.verified ? "Yes" : "No"}</Badge>
                  </td>
                  <td className="p-3">{u.city}</td>
                  <td className="p-3">{u.mobile ?? "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{timeAgo(u.created_at)}</td>
                  <td className="p-3">
                    <div className="flex justify-end items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => toggleVerified(u.id, u.verified)} title="Toggle verified">
                        {u.verified ? <ShieldOff className="h-4 w-4"/> : <ShieldCheck className="h-4 w-4"/>}
                      </Button>
                      <Button size="sm" variant={isAdmin ? "outline" : "secondary"} onClick={() => toggleAdmin(u.id, isAdmin)}>
                        {isAdmin ? "Revoke admin" : "Make admin"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && <tr><td colSpan={8} className="p-6 text-center text-sm text-muted-foreground">No users.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, KeyRound, Users, Briefcase, Plus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — MyCityRozgar.in" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user, loading, navigate]);

  if (loading || isAdmin === null) {
    return <PageShell><div className="container-app py-10">Loading…</div></PageShell>;
  }
  if (!isAdmin) {
    return (
      <PageShell>
        <div className="container-app py-12 max-w-md text-center">
          <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground"/>
          <h1 className="text-2xl font-bold mt-3">Admins only</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            This area is restricted. If you are an admin, ask the team to grant you the admin role in the database.
          </p>
        </div>
      </PageShell>
    );
  }

  return <AdminContent/>;
}

function AdminContent() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [users, jobs, codes] = await Promise.all([
        supabase.from("profiles").select("id, plan, role"),
        supabase.from("jobs").select("id, status"),
        supabase.from("access_codes").select("id, used"),
      ]);
      const profiles = users.data ?? [];
      return {
        totalUsers: profiles.length,
        customers: profiles.filter(p => p.role === "customer").length,
        workers: profiles.filter(p => p.role === "worker").length,
        premium: profiles.filter(p => p.plan === "premium").length,
        pro: profiles.filter(p => p.plan === "professional").length,
        totalJobs: jobs.data?.length ?? 0,
        activeJobs: jobs.data?.filter(j => j.status === "active").length ?? 0,
        codesIssued: codes.data?.length ?? 0,
        codesUsed: codes.data?.filter(c => c.used).length ?? 0,
      };
    },
  });

  const { data: codes, refetch: refetchCodes } = useQuery({
    queryKey: ["admin-codes"],
    queryFn: async () => (await supabase.from("access_codes").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  const { data: recentUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(20)).data ?? [],
  });

  const { data: recentJobs } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => (await supabase.from("jobs").select("id,customer_id,title,category_slug,city,area,status,urgent,responses_count,created_at").order("created_at", { ascending: false }).limit(20)).data ?? [],
  });

  const [planForNew, setPlanForNew] = useState<"premium" | "professional">("premium");
  const [creating, setCreating] = useState(false);

  async function issueCode() {
    setCreating(true);
    try {
      // generate next code MCR-NNNNNN
      const seq = 100001 + (codes?.length ?? 0);
      const code = `MCR-${seq}`;
      const { error } = await supabase.from("access_codes").insert({ code, plan: planForNew });
      if (error) throw error;
      toast.success(`Access code ${code} issued`);
      refetchCodes();
    } catch (err: any) {
      toast.error(err.message ?? "Could not issue code");
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageShell>
      <div className="container-app py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-sm">Manage users, jobs, and access codes.</p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <S icon={Users} label="Users" value={stats?.totalUsers ?? 0}/>
          <S icon={Briefcase} label="Jobs" value={stats?.totalJobs ?? 0}/>
          <S icon={ShieldCheck} label="Premium / Pro" value={`${stats?.premium ?? 0} / ${stats?.pro ?? 0}`}/>
          <S icon={KeyRound} label="Codes Used / Issued" value={`${stats?.codesUsed ?? 0} / ${stats?.codesIssued ?? 0}`}/>
        </div>

        {/* Access codes */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Access Codes</h2>
            <div className="flex items-center gap-2">
              <select value={planForNew} onChange={e => setPlanForNew(e.target.value as any)} className="h-9 rounded-md border border-input px-2 text-sm">
                <option value="premium">Premium</option>
                <option value="professional">Professional</option>
              </select>
              <Button size="sm" onClick={issueCode} disabled={creating}><Plus className="h-4 w-4 mr-1"/>Issue Code</Button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr><th className="p-3">Code</th><th className="p-3">Plan</th><th className="p-3">Status</th><th className="p-3">Assigned</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {codes?.map(c => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="p-3 font-mono">{c.code}</td>
                    <td className="p-3 capitalize">{c.plan}</td>
                    <td className="p-3">{c.used ? <Badge variant="secondary">Used</Badge> : <Badge>Available</Badge>}</td>
                    <td className="p-3 text-xs text-muted-foreground">{c.assigned_to ?? "—"}</td>
                    <td className="p-3"><Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Copied"); }}><Copy className="h-4 w-4"/></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Users */}
        <section className="mt-8">
          <h2 className="text-lg font-bold mb-3">Recent Users</h2>
          <div className="rounded-2xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Plan</th><th className="p-3">City</th><th className="p-3">Mobile</th><th className="p-3">Joined</th></tr>
              </thead>
              <tbody>
                {recentUsers?.map(u => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="p-3 font-medium">{u.full_name || "—"}</td>
                    <td className="p-3 capitalize">{u.role}</td>
                    <td className="p-3 capitalize">{u.plan}</td>
                    <td className="p-3">{u.city}</td>
                    <td className="p-3">{u.mobile ?? "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground">{timeAgo(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Jobs */}
        <section className="mt-8">
          <h2 className="text-lg font-bold mb-3">Recent Jobs</h2>
          <div className="rounded-2xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr><th className="p-3">Title</th><th className="p-3">Category</th><th className="p-3">City</th><th className="p-3">Status</th><th className="p-3">Posted</th></tr>
              </thead>
              <tbody>
                {recentJobs?.map(j => (
                  <tr key={j.id} className="border-t border-border">
                    <td className="p-3 font-medium">{j.title}</td>
                    <td className="p-3 capitalize">{j.category_slug.replace(/-/g," ")}</td>
                    <td className="p-3">{j.city}</td>
                    <td className="p-3"><Badge variant={j.status === "active" ? "default" : "outline"} className="capitalize">{j.status}</Badge></td>
                    <td className="p-3 text-xs text-muted-foreground">{timeAgo(j.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function S({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className="h-5 w-5 text-primary"/>
      <div className="text-xl font-bold mt-2">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

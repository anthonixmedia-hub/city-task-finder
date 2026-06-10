import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Briefcase, ShieldCheck, KeyRound, Tags, ScrollText, Settings, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Admin — MyCityRozgar.in" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
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
        customers: profiles.filter((p: any) => p.role === "customer").length,
        workers: profiles.filter((p: any) => p.role === "worker").length,
        premium: profiles.filter((p: any) => p.plan === "premium").length,
        pro: profiles.filter((p: any) => p.plan === "professional").length,
        totalJobs: jobs.data?.length ?? 0,
        activeJobs: jobs.data?.filter((j: any) => j.status === "active").length ?? 0,
        codesIssued: codes.data?.length ?? 0,
        codesUsed: codes.data?.filter((c: any) => c.used).length ?? 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your marketplace.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} sub={`${stats?.customers ?? 0} customers · ${stats?.workers ?? 0} workers`}/>
        <Stat icon={Briefcase} label="Jobs" value={stats?.totalJobs ?? 0} sub={`${stats?.activeJobs ?? 0} active`}/>
        <Stat icon={ShieldCheck} label="Premium / Pro" value={`${stats?.premium ?? 0} / ${stats?.pro ?? 0}`}/>
        <Stat icon={KeyRound} label="Codes" value={`${stats?.codesUsed ?? 0} / ${stats?.codesIssued ?? 0}`} sub="used / issued"/>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Manage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickCard to="/admin/jobs" icon={Briefcase} title="Jobs" desc="Edit, feature, close, or delete any job."/>
          <QuickCard to="/admin/users" icon={Users} title="Users" desc="Change plans, verify, assign admin role."/>
          <QuickCard to="/admin/categories" icon={Tags} title="Categories" desc="Add, edit, or remove job categories."/>
          <QuickCard to="/admin/codes" icon={KeyRound} title="Access Codes" desc="Issue codes for paid plans."/>
          <QuickCard to="/admin/audit" icon={ScrollText} title="Audit Log" desc="Track redemptions and contact reveals."/>
          <QuickCard to="/admin/settings" icon={Settings} title="Site Settings" desc="Edit homepage, plans, contact, footer."/>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className="h-5 w-5 text-primary"/>
      <div className="text-2xl font-bold mt-2">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function QuickCard({ to, icon: Icon, title, desc }: any) {
  return (
    <Link to={to} className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-soft transition-all flex items-start gap-3">
      <div className="h-10 w-10 rounded-xl bg-accent grid place-items-center shrink-0">
        <Icon className="h-5 w-5 text-primary"/>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold flex items-center gap-1">{title} <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity"/></div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </Link>
  );
}

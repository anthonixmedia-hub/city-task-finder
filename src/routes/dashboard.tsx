import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase, CheckCircle2, KeyRound, Sparkles, Star, Trash2,
  Eye, Plus, MapPin, Clock, ShieldCheck, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { timeAgo, formatBudget } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MyCityRozgar.in" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user || !profile) {
    return <PageShell><div className="container-app py-10">Loading…</div></PageShell>;
  }

  return (
    <PageShell>
      <div className="container-app py-6 md:py-8">
        <ProfileBanner/>
        {profile.role === "customer" ? <CustomerDash/> : <WorkerDash/>}
      </div>
    </PageShell>
  );
}

function ProfileBanner() {
  const { profile } = useAuth();
  if (!profile) return null;
  const isPro = profile.plan === "professional";
  return (
    <div className="rounded-3xl border border-border bg-card p-5 md:p-6 shadow-soft mb-6">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center text-xl font-bold text-accent-foreground shrink-0">
          {profile.full_name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold">{profile.full_name || "Welcome"}</h1>
            {isPro && <span className="badge-pro"><Star className="h-3 w-3"/>Professional Worker</span>}
            {profile.access_unlocked && <Badge variant="secondary"><CheckCircle2 className="h-3 w-3 mr-1"/>Unlocked</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
            <span className="capitalize">{profile.role}</span>
            <span>·</span>
            <span><MapPin className="h-3 w-3 inline mr-0.5"/>{profile.area ? `${profile.area}, ` : ""}{profile.city}</span>
            <span>·</span>
            <span>Plan: <strong className="capitalize text-foreground">{profile.plan}</strong></span>
          </p>
        </div>
        {!profile.access_unlocked && (
          <div className="flex gap-2">
            <Link to="/access-code"><Button size="sm" variant="outline"><KeyRound className="h-4 w-4 mr-1"/>Access Code</Button></Link>
            <Link to="/plans"><Button size="sm"><Sparkles className="h-4 w-4 mr-1"/>Upgrade</Button></Link>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomerDash() {
  const { user } = useAuth();
  const { data: jobs, refetch } = useQuery({
    queryKey: ["my-jobs", user?.id],
    queryFn: async () => (await supabase.from("jobs").select("*").eq("customer_id", user!.id).order("created_at", { ascending: false })).data ?? [],
    enabled: !!user,
  });

  const active = jobs?.filter(j => j.status === "active") ?? [];
  const closed = jobs?.filter(j => j.status !== "active") ?? [];

  async function close(id: string) {
    await supabase.from("jobs").update({ status: "closed" }).eq("id", id);
    refetch();
    toast.success("Job closed");
  }
  async function del(id: string) {
    if (!confirm("Delete this job?")) return;
    await supabase.from("jobs").delete().eq("id", id);
    refetch();
    toast.success("Job deleted");
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat icon={Briefcase} label="Total Jobs" value={jobs?.length ?? 0}/>
        <Stat icon={Eye} label="Active" value={active.length}/>
        <Stat icon={CheckCircle2} label="Closed" value={closed.length}/>
        <Stat icon={ShieldCheck} label="Responses" value={jobs?.reduce((s, j) => s + (j.responses_count ?? 0), 0) ?? 0}/>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">My Jobs</h2>
        <Link to="/post-job"><Button size="sm"><Plus className="h-4 w-4 mr-1"/>Post Job</Button></Link>
      </div>

      {jobs && jobs.length === 0 ? (
        <EmptyState
          title="No jobs posted yet"
          desc="Post your first job and get connected with local workers."
          cta={<Link to="/post-job"><Button><Plus className="h-4 w-4 mr-1"/>Post a Job</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {jobs?.map(j => (
            <div key={j.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="capitalize text-xs">{j.category_slug.replace(/-/g," ")}</Badge>
                    {j.urgent && <Badge className="bg-warning text-warning-foreground text-xs">Urgent</Badge>}
                    <Badge variant={j.status === "active" ? "default" : "outline"} className="capitalize text-xs">{j.status}</Badge>
                  </div>
                  <Link to="/jobs/$id" params={{ id: j.id }} className="font-semibold hover:underline">{j.title}</Link>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                    <span><Clock className="h-3 w-3 inline mr-0.5"/>{timeAgo(j.created_at)}</span>
                    <span>{formatBudget(j.budget_min, j.budget_max)}</span>
                    <span>{j.responses_count ?? 0} responses</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {j.status === "active" && <Button size="sm" variant="outline" onClick={() => close(j.id)}>Close</Button>}
                  <Button size="sm" variant="ghost" onClick={() => del(j.id)}><Trash2 className="h-4 w-4"/></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function WorkerDash() {
  const { profile } = useAuth();
  const { data: jobs } = useQuery({
    queryKey: ["worker-feed", profile?.city],
    queryFn: async () => {
      let q = supabase.from("jobs").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(30);
      if (profile?.city) q = q.eq("city", profile.city);
      return (await q).data ?? [];
    },
    enabled: !!profile,
  });

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat icon={Briefcase} label="Jobs Nearby" value={jobs?.length ?? 0}/>
        <Stat icon={CheckCircle2} label="Plan" value={profile?.plan === "free" ? "Free" : profile?.plan === "premium" ? "Premium" : "Pro"}/>
        <Stat icon={KeyRound} label="Access" value={profile?.access_unlocked ? "Unlocked" : "Locked"}/>
        <Stat icon={ShieldCheck} label="Verified" value={profile?.verified ? "Yes" : "Pending"}/>
      </div>

      {!profile?.access_unlocked && (
        <div className="rounded-2xl bg-accent p-5 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5"/>
          <div className="flex-1">
            <div className="font-semibold text-accent-foreground">Unlock contact details</div>
            <p className="text-sm text-accent-foreground/80 mt-0.5">Upgrade to Premium (₹99) or Professional (₹449) to message and call customers directly.</p>
            <div className="mt-3 flex gap-2">
              <Link to="/plans"><Button size="sm">View Plans</Button></Link>
              <Link to="/access-code"><Button size="sm" variant="outline">I have a code</Button></Link>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold mb-3">Jobs in {profile?.city ?? "your city"}</h2>
      {jobs && jobs.length === 0 ? (
        <EmptyState title="No jobs available right now" desc="New jobs are posted every day. Check back soon!" cta={<Link to="/jobs"><Button variant="outline">Browse All Cities</Button></Link>}/>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {jobs?.map(j => (
            <Link key={j.id} to="/jobs/$id" params={{ id: j.id }} className="rounded-2xl border border-border bg-card p-4 hover:shadow-soft transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs capitalize">{j.category_slug.replace(/-/g," ")}</Badge>
                {j.urgent && <Badge className="bg-warning text-warning-foreground text-xs">Urgent</Badge>}
              </div>
              <div className="font-semibold">{j.title}</div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{j.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground"><MapPin className="h-3 w-3 inline"/> {j.area ?? j.city}</span>
                <span className="font-semibold">{formatBudget(j.budget_min, j.budget_max)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className="h-5 w-5 text-primary"/>
      <div className="text-xl font-bold mt-2">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function EmptyState({ title, desc, cta }: { title: string; desc: string; cta: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      <div className="mt-4 flex justify-center">{cta}</div>
    </div>
  );
}

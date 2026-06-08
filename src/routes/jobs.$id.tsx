import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, MapPin, Clock, Lock, Phone, MessageCircle, User,
  CheckCircle2, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout";
import { UnlockDialog } from "@/components/unlock-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { timeAgo, formatBudget } from "@/lib/format";

export const Route = createFileRoute("/jobs/$id")({
  head: () => ({ meta: [{ title: "Job Details — MyCityRozgar.in" }] }),
  component: JobDetail,
});

function JobDetail() {
  const { id } = Route.useParams();
  const { profile } = useAuth();
  const [unlockOpen, setUnlockOpen] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: customer } = useQuery({
    queryKey: ["job-customer", job?.customer_id],
    queryFn: async () => {
      if (!job) return null;
      return (await supabase.from("profiles").select("full_name,city").eq("id", job.customer_id).maybeSingle()).data;
    },
    enabled: !!job,
  });

  const unlocked = !!profile?.access_unlocked || profile?.plan === "premium" || profile?.plan === "professional";

  if (isLoading) return <PageShell><div className="container-app py-10">Loading…</div></PageShell>;
  if (!job) return <PageShell><div className="container-app py-10">Job not found.</div></PageShell>;

  function tryContact() {
    if (!unlocked) setUnlockOpen(true);
  }

  return (
    <PageShell>
      <div className="container-app py-6 md:py-8 max-w-3xl">
        <Link to="/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1"/> Back to jobs
        </Link>

        <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="secondary" className="capitalize">{job.category_slug.replace(/-/g," ")}</Badge>
            {job.urgent && <Badge className="bg-warning text-warning-foreground"><AlertTriangle className="h-3 w-3 mr-1"/>Urgent</Badge>}
            <Badge variant="outline" className="capitalize">{job.status}</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{job.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4"/>{job.area ? `${job.area}, ${job.city}` : job.city}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4"/>{timeAgo(job.created_at)}</span>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <Stat label="Budget" value={formatBudget(job.budget_min, job.budget_max)}/>
            <Stat label="Preferred Time" value={job.preferred_time ?? "Flexible"}/>
          </div>

          <div className="mt-6">
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">{job.description}</p>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <h2 className="font-semibold mb-3">Customer</h2>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center font-bold text-accent-foreground">
                {customer?.full_name?.[0]?.toUpperCase() ?? <User className="h-5 w-5"/>}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{customer?.full_name ?? "Customer"}</div>
                <div className="text-xs text-muted-foreground">{customer?.city ?? job.city}</div>
              </div>
              {unlocked && <Badge className="badge-pro"><CheckCircle2 className="h-3 w-3"/>Unlocked</Badge>}
            </div>

            {unlocked ? (
              <div className="mt-4 grid sm:grid-cols-2 gap-2">
                <a href={`tel:${job.phone}`}><Button className="w-full" size="lg"><Phone className="mr-2 h-4 w-4"/>{job.phone}</Button></a>
                <a href={`https://wa.me/${job.phone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full" size="lg"><MessageCircle className="mr-2 h-4 w-4"/>WhatsApp</Button>
                </a>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-muted p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <Lock className="h-4 w-4 text-accent-foreground"/>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Contact details are locked</div>
                    <p className="text-xs text-muted-foreground mt-0.5">Unlock with an Access Code or upgrade to Premium.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" onClick={tryContact}>Unlock Now</Button>
                      <Link to="/plans"><Button size="sm" variant="outline">View Plans</Button></Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <UnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen}/>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}

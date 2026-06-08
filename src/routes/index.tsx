import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  ArrowRight, Briefcase, CheckCircle2, MapPin, ShieldCheck, Sparkles,
  Users, Zap, Search, Star, Trophy, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo, formatBudget } from "@/lib/format";

const homeData = queryOptions({
  queryKey: ["home-data"],
  queryFn: async () => {
    const [cats, jobs] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order").limit(12),
      supabase.from("jobs").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(6),
    ]);
    return { categories: cats.data ?? [], jobs: jobs.data ?? [] };
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyCityRozgar.in — Local Jobs & Services Marketplace in Dumka" },
      { name: "description", content: "Hire trusted local workers or find jobs near you. Cleaning, electrician, plumber, driver, computer work — all in one place." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeData),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(homeData);
  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="container-app py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Badge className="mb-4 bg-accent text-accent-foreground hover:bg-accent">
              <Sparkles className="h-3 w-3 mr-1" /> Trusted local marketplace
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.1] tracking-tight">
              Find <span className="text-primary">local workers</span><br/>
              or <span className="text-primary">post a job</span> in minutes.
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-lg">
              From house cleaning to electricians, plumbers, drivers and computer work —
              MyCityRozgar connects you with verified workers in your city.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/post-job"><Button size="lg" className="h-12 px-6"><Briefcase className="mr-2 h-5 w-5"/>Post a Job</Button></Link>
              <Link to="/jobs"><Button size="lg" variant="outline" className="h-12 px-6"><Search className="mr-2 h-5 w-5"/>Find Jobs</Button></Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/auth"><Button variant="ghost" size="sm">Register as Worker <ArrowRight className="ml-1 h-3 w-3"/></Button></Link>
              <Link to="/plans"><Button variant="ghost" size="sm">View Plans <ArrowRight className="ml-1 h-3 w-3"/></Button></Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-sm">
              <Stat icon={Users} value="5,000+" label="Local workers"/>
              <Stat icon={MapPin} value="Dumka" label="& nearby cities"/>
              <Stat icon={ShieldCheck} value="Verified" label="ID & documents"/>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl bg-card shadow-elevated p-6 border border-border">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center font-bold text-accent-foreground">RK</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Ramesh Kumar</div>
                  <div className="text-xs text-muted-foreground">Electrician · 8 yrs experience</div>
                </div>
                <span className="badge-pro"><CheckCircle2 className="h-3 w-3"/>Pro</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <Mini label="Jobs done" value="142"/>
                <Mini label="Rating" value="4.9★"/>
                <Mini label="Response" value="< 1hr"/>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted text-sm">
                <div className="font-medium">Bathroom Tap Fix</div>
                <div className="text-xs text-muted-foreground mt-0.5">Posted 12 min ago · Dumka · ₹500</div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" className="flex-1">Contact</Button>
                  <Button size="sm" variant="outline" className="flex-1">WhatsApp</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-app py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Popular Categories</h2>
            <p className="text-muted-foreground text-sm mt-1">Browse jobs by what you do best</p>
          </div>
          <Link to="/jobs" className="text-sm text-primary font-medium hidden md:flex items-center">
            View all <ArrowRight className="h-3 w-3 ml-1"/>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {data.categories.map((c) => (
            <Link
              key={c.id}
              to="/jobs"
              search={{ category: c.slug }}
              className="group rounded-2xl border border-border bg-card p-4 hover:border-primary hover:shadow-soft transition-all"
            >
              <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Briefcase className="h-5 w-5"/>
              </div>
              <div className="font-semibold text-sm">{c.name}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Zap className="h-3 w-3"/> Active jobs
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Active jobs */}
      <section className="bg-muted/40 py-12">
        <div className="container-app">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Most Active Jobs</h2>
              <p className="text-muted-foreground text-sm mt-1">Latest opportunities posted in your area</p>
            </div>
            <Link to="/jobs"><Button variant="outline" size="sm">See all jobs</Button></Link>
          </div>
          {data.jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-muted-foreground">No jobs posted yet. Be the first!</p>
              <Link to="/post-job"><Button className="mt-4"><Briefcase className="mr-2 h-4 w-4"/>Post a Job</Button></Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.jobs.map((j) => (
                <Link key={j.id} to="/jobs/$id" params={{ id: j.id }} className="rounded-2xl border border-border bg-card p-5 hover:shadow-elevated transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="capitalize">{j.category_slug.replace(/-/g, " ")}</Badge>
                    {j.urgent && <Badge className="bg-warning text-warning-foreground hover:bg-warning">Urgent</Badge>}
                  </div>
                  <h3 className="mt-3 font-semibold text-base line-clamp-1">{j.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{j.description}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/>{j.area ?? j.city}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{timeAgo(j.created_at)}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="font-semibold text-sm">{formatBudget(j.budget_min, j.budget_max)}</span>
                    <span className="text-xs text-primary font-medium">View →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="container-app py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center">How it works</h2>
        <p className="text-muted-foreground text-center text-sm mt-1">Simple steps to get the right help — or the right job</p>
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            { icon: Users, title: "1. Register Free", desc: "Sign up as a Customer or Worker. Add your city and area." },
            { icon: Briefcase, title: "2. Post or Browse", desc: "Customers post jobs in minutes. Workers browse jobs nearby." },
            { icon: ShieldCheck, title: "3. Unlock & Connect", desc: "Workers unlock contact with Access Code and connect directly." },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl bg-card border border-border p-6">
              <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center text-accent-foreground">
                <s.icon className="h-6 w-6"/>
              </div>
              <h3 className="mt-4 font-semibold text-lg">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="bg-muted/40 py-10">
        <div className="container-app grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { icon: ShieldCheck, label: "Mobile Verified" },
            { icon: CheckCircle2, label: "Document Verified" },
            { icon: Trophy, label: "Top Rated Workers" },
            { icon: Star, label: "Professional Badge" },
          ].map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                <t.icon className="h-6 w-6 text-accent-foreground"/>
              </div>
              <div className="text-sm font-medium">{t.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pro promo */}
      <section className="container-app py-12">
        <div className="rounded-3xl p-8 md:p-10 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <span className="badge-pro"><CheckCircle2 className="h-3 w-3"/>Professional Worker</span>
              <h2 className="text-2xl md:text-3xl font-bold mt-3">Get hired faster as a Professional Worker</h2>
              <p className="mt-2 text-primary-foreground/90 text-sm md:text-base">
                Featured profile, green trust badge, customer search priority, and unlimited contact unlocks — all for just ₹449.
              </p>
              <Link to="/plans"><Button size="lg" variant="secondary" className="mt-5">View Pro Benefits <ArrowRight className="ml-2 h-4 w-4"/></Button></Link>
            </div>
            <ul className="space-y-2 text-sm">
              {["Green verified badge on your profile","Higher visibility in customer search","Featured listing in your category","Unlimited customer contact unlocks","Priority approval & support"].map(b => (
                <li key={b} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0"/>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Stat({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-9 w-9 rounded-full bg-card border border-border flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary"/>
      </div>
      <div className="leading-tight">
        <div className="font-semibold text-sm">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted py-2">
      <div className="font-bold text-sm">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

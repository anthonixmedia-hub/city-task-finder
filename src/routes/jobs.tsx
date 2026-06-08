import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Clock, Lock, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo, formatBudget } from "@/lib/format";
import { z } from "zod";

const searchSchema = z.object({
  category: z.string().optional(),
  city: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/jobs")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Browse Jobs — MyCityRozgar.in" }] }),
  component: JobsList,
});

function JobsList() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("name,slug").order("sort_order")).data ?? [],
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs", search.category, search.city, q],
    queryFn: async () => {
      let query = supabase.from("jobs").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(50);
      if (search.category) query = query.eq("category_slug", search.category);
      if (search.city) query = query.ilike("city", `%${search.city}%`);
      if (q) query = query.ilike("title", `%${q}%`);
      return (await query).data ?? [];
    },
  });

  return (
    <PageShell>
      <div className="container-app py-6 md:py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Browse Jobs</h1>
            <p className="text-muted-foreground text-sm">Find work near you. Unlock contact details with Access Code.</p>
          </div>
          <Link to="/post-job"><Button>Post a Job</Button></Link>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search jobs..." className="pl-9"/>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 mb-4 no-scrollbar">
          <Link to="/jobs">
            <Badge variant={!search.category ? "default" : "outline"} className="cursor-pointer whitespace-nowrap">All</Badge>
          </Link>
          {cats?.map(c => (
            <Link key={c.slug} to="/jobs" search={{ category: c.slug }}>
              <Badge variant={search.category === c.slug ? "default" : "outline"} className="cursor-pointer whitespace-nowrap">{c.name}</Badge>
            </Link>
          ))}
        </div>

        {(search.category || search.city) && (
          <div className="flex items-center gap-2 text-sm mb-4">
            <Filter className="h-4 w-4 text-muted-foreground"/>
            <span className="text-muted-foreground">Filtered:</span>
            {search.category && <Badge variant="secondary" className="capitalize">{search.category.replace(/-/g," ")}</Badge>}
            <Link to="/jobs"><Button variant="ghost" size="sm" className="h-6 px-2"><X className="h-3 w-3 mr-1"/>Clear</Button></Link>
          </div>
        )}

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : jobs && jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No jobs match your filters yet.</p>
            <Link to="/post-job"><Button className="mt-4">Post the first job</Button></Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs?.map(j => (
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
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3"/>Unlock contact</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

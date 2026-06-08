import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageShell } from "@/components/layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/post-job")({
  head: () => ({ meta: [{ title: "Post a Job — MyCityRozgar.in" }] }),
  component: PostJob,
});

function PostJob() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category_slug: "",
    description: "",
    budget_min: "",
    budget_max: "",
    city: "Dumka",
    area: "",
    phone: "",
    preferred_time: "",
    urgent: false,
  });

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("name,slug").order("sort_order")).data ?? [],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { navigate({ to: "/auth" }); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("jobs").insert({
        customer_id: user.id,
        title: form.title,
        category_slug: form.category_slug,
        description: form.description,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        city: form.city,
        area: form.area || null,
        phone: form.phone,
        preferred_time: form.preferred_time || null,
        urgent: form.urgent,
      });
      if (error) throw error;
      toast.success("Job posted! Workers can now see it.");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Could not post job");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <PageShell>
        <div className="container-app py-12 max-w-md text-center">
          <Briefcase className="h-12 w-12 mx-auto text-primary mb-3"/>
          <h1 className="text-2xl font-bold">Sign in to post a job</h1>
          <p className="text-muted-foreground text-sm mt-2">Create a free account to post jobs and find local workers.</p>
          <Link to="/auth"><Button className="mt-5" size="lg">Sign in or Register</Button></Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container-app py-6 md:py-10 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold">Post a Job</h1>
        <p className="text-muted-foreground text-sm mt-1">Tell us what work you need and workers will reach out.</p>

        <form onSubmit={handleSubmit} className="mt-6 rounded-3xl border border-border bg-card p-6 md:p-8 space-y-4 shadow-soft">
          <div>
            <Label>Job Title *</Label>
            <Input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Bathroom tap leakage repair" className="mt-1.5"/>
          </div>

          <div>
            <Label>Category *</Label>
            <Select value={form.category_slug} onValueChange={(v) => setForm({...form, category_slug: v})}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a category"/></SelectTrigger>
              <SelectContent>
                {cats?.map(c => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea required rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Describe the work in detail..." className="mt-1.5"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Min Budget (₹)</Label>
              <Input type="number" min="0" value={form.budget_min} onChange={e => setForm({...form, budget_min: e.target.value})} className="mt-1.5"/>
            </div>
            <div>
              <Label>Max Budget (₹)</Label>
              <Input type="number" min="0" value={form.budget_max} onChange={e => setForm({...form, budget_max: e.target.value})} className="mt-1.5"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City *</Label>
              <Input required value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="mt-1.5"/>
            </div>
            <div>
              <Label>Area / Locality</Label>
              <Input value={form.area} onChange={e => setForm({...form, area: e.target.value})} placeholder="e.g. SP College Road" className="mt-1.5"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone Number *</Label>
              <Input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91 9XXXXXXXXX" className="mt-1.5"/>
            </div>
            <div>
              <Label>Preferred Time</Label>
              <Input value={form.preferred_time} onChange={e => setForm({...form, preferred_time: e.target.value})} placeholder="Morning / Evening" className="mt-1.5"/>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-4 bg-muted/40">
            <div>
              <Label className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning"/>Mark as Urgent</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Urgent jobs get a highlighted badge</p>
            </div>
            <Switch checked={form.urgent} onCheckedChange={(v) => setForm({...form, urgent: v})}/>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11" size="lg">
            {loading ? "Posting…" : "Post Job"}
          </Button>
        </form>
      </div>
    </PageShell>
  );
}

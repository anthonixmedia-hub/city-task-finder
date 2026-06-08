import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Sparkles, Crown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/plans")({
  head: () => ({ meta: [{ title: "Plans & Pricing — MyCityRozgar.in" }] }),
  component: Plans,
});

const PLANS = [
  {
    id: "free", name: "Free", price: "₹0", icon: Sparkles, popular: false,
    desc: "Get started and explore the marketplace",
    features: ["Browse all jobs", "View job categories", "Create profile", "Post jobs (customers)"],
    locked: ["Contact customers", "WhatsApp & chat", "Unlock phone numbers"],
    cta: "Continue Free",
  },
  {
    id: "premium", name: "Premium", price: "₹99", icon: Crown, popular: true,
    desc: "Unlock contact details for all jobs",
    features: ["Everything in Free", "Unlock customer phone numbers", "Direct WhatsApp contact", "Unlimited contact access", "Apply to unlimited jobs"],
    locked: [],
    cta: "Get Premium",
  },
  {
    id: "professional", name: "Professional Worker", price: "₹449", icon: Star, popular: false,
    desc: "Be visible. Be trusted. Get hired faster.",
    features: ["Everything in Premium", "🟢 Professional Worker badge", "Featured profile listing", "Customer search priority", "Document verification", "Priority support"],
    locked: [],
    cta: "Become a Pro",
  },
];

function Plans() {
  const { user } = useAuth();
  const navigate = useNavigate();

  function choose(planId: string) {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (planId === "free") { navigate({ to: "/dashboard" }); return; }
    navigate({ to: "/whatsapp-approval", search: { plan: planId } });
  }

  return (
    <PageShell>
      <div className="container-app py-8 md:py-12">
        <div className="text-center max-w-2xl mx-auto">
          <Badge className="mb-3 bg-accent text-accent-foreground hover:bg-accent">Choose Your Plan</Badge>
          <h1 className="text-3xl md:text-4xl font-bold">Simple, honest pricing</h1>
          <p className="text-muted-foreground mt-2">Start free. Upgrade when you want to contact customers directly.</p>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {PLANS.map((p) => (
            <div key={p.id} className={`relative rounded-3xl border bg-card p-6 md:p-7 ${p.popular ? "border-primary shadow-elevated md:scale-105" : "border-border shadow-soft"}`}>
              {p.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3">Most Popular</Badge>
              )}
              <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center text-accent-foreground">
                <p.icon className="h-6 w-6"/>
              </div>
              <h3 className="mt-4 text-xl font-bold">{p.name}</h3>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{p.price}</span>
                {p.id !== "free" && <span className="text-sm text-muted-foreground">/ one-time</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>

              <Button onClick={() => choose(p.id)} className="w-full mt-5" variant={p.popular ? "default" : "outline"} size="lg">
                {p.cta}
              </Button>

              <ul className="mt-5 space-y-2 text-sm">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5"/><span>{f}</span>
                  </li>
                ))}
                {p.locked.map(f => (
                  <li key={f} className="flex items-start gap-2 text-muted-foreground">
                    <span className="h-4 w-4 shrink-0 mt-0.5">✕</span><span className="line-through">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-muted/40 p-6 max-w-3xl mx-auto text-center">
          <h3 className="font-semibold">How payment works</h3>
          <p className="text-sm text-muted-foreground mt-2">
            After choosing a paid plan, you'll be guided to send your registration details via WhatsApp.
            Our team verifies your payment (UPI) and issues your unique <strong>Access Code</strong>.
            Enter the code on the site to unlock customer contacts permanently.
          </p>
          <Link to="/access-code"><Button variant="outline" className="mt-4">I already have an Access Code</Button></Link>
        </div>
      </div>
    </PageShell>
  );
}

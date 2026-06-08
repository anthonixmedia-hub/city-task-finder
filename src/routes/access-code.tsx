import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/access-code")({
  head: () => ({ meta: [{ title: "Enter Access Code — MyCityRozgar.in" }] }),
  component: AccessCodePage,
});

function AccessCodePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { navigate({ to: "/auth" }); return; }
    setLoading(true);
    try {
      const normalized = code.trim().toUpperCase();
      const { data: ac, error } = await supabase
        .from("access_codes").select("*").eq("code", normalized).maybeSingle();
      if (error) throw error;
      if (!ac) { toast.error("Invalid Access Code. Please check and try again."); return; }
      if (ac.used && ac.assigned_to !== user.id) { toast.error("This code has already been used."); return; }

      // Mark code used + bind to user
      await supabase.from("access_codes").update({
        used: true, used_at: new Date().toISOString(), assigned_to: user.id,
      }).eq("id", ac.id);

      // Update profile
      await supabase.from("profiles").update({
        access_unlocked: true,
        plan: ac.plan,
        verified: true,
      }).eq("id", user.id);

      await refreshProfile();
      toast.success("Access unlocked! You can now contact customers.");
      navigate({ to: "/jobs" });
    } catch (err: any) {
      toast.error(err.message ?? "Could not validate code");
    } finally {
      setLoading(false);
    }
  }

  if (profile?.access_unlocked) {
    return (
      <PageShell>
        <div className="container-app py-12 max-w-md text-center">
          <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-primary"/>
          </div>
          <h1 className="text-2xl font-bold mt-4">Access already unlocked</h1>
          <p className="text-muted-foreground mt-2">Your plan: <strong className="capitalize text-foreground">{profile.plan}</strong></p>
          <Link to="/jobs"><Button className="mt-5" size="lg">Browse Jobs</Button></Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="container-app py-8 max-w-md">
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft">
          <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <KeyRound className="h-7 w-7 text-primary"/>
          </div>
          <h1 className="text-2xl font-bold">Enter your Access Code</h1>
          <p className="text-sm text-muted-foreground mt-1">
            We sent your code via WhatsApp after payment verification. It looks like <code>MCR-100001</code>.
          </p>

          <form onSubmit={redeem} className="mt-6 space-y-4">
            <div>
              <Label>Access Code</Label>
              <Input
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="MCR-XXXXXX"
                className="mt-1.5 text-center font-mono tracking-wider text-lg h-12"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11" size="lg">
              {loading ? "Verifying…" : "Unlock Access"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center text-sm">
            <p className="text-muted-foreground">Don't have a code yet?</p>
            <Link to="/plans" className="text-primary font-medium">View Plans →</Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

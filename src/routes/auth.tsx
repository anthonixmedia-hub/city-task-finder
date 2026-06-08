import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, User, MapPin, Briefcase, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in or Register — MyCityRozgar.in" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "register">("register");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    mobile: "",
    city: "Dumka",
    area: "",
    role: "customer" as "customer" | "worker",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const redirect = typeof window !== "undefined" ? window.location.origin : undefined;
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: redirect,
            data: {
              full_name: form.full_name,
              mobile: form.mobile,
              city: form.city,
              area: form.area,
              role: form.role,
            },
          },
        });
        if (error) throw error;
        toast.success("Registration successful! Choose your plan next.");
        navigate({ to: "/plans" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <div className="container-app py-8 md:py-12 max-w-md">
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-soft">
          <div className="flex rounded-lg bg-muted p-1 text-sm font-medium mb-6">
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded-md transition-colors ${mode === "register" ? "bg-card shadow-soft" : "text-muted-foreground"}`}
            >Register</button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 rounded-md transition-colors ${mode === "signin" ? "bg-card shadow-soft" : "text-muted-foreground"}`}
            >Sign in</button>
          </div>

          <h1 className="text-2xl font-bold">
            {mode === "register" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "register" ? "Join MyCityRozgar in 30 seconds" : "Sign in to your dashboard"}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <>
                <Field label="Full Name" icon={User}>
                  <Input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="Ramesh Kumar" />
                </Field>
                <Field label="Mobile Number" icon={Phone}>
                  <Input required type="tel" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} placeholder="+91 9XXXXXXXXX" />
                </Field>
              </>
            )}
            <Field label="Email Address" icon={Mail}>
              <Input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <Input required type="password" minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="At least 6 characters" />
            </Field>
            {mode === "register" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" icon={MapPin}>
                    <Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                  </Field>
                  <Field label="Area / Locality">
                    <Input value={form.area} onChange={e => setForm({...form, area: e.target.value})} placeholder="e.g. SP College Road" />
                  </Field>
                </div>
                <div>
                  <Label>I am a...</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <RoleButton selected={form.role === "customer"} onClick={() => setForm({...form, role: "customer"})} icon={Briefcase} label="Customer" desc="I want to hire" />
                    <RoleButton selected={form.role === "worker"} onClick={() => setForm({...form, role: "worker"})} icon={Wrench} label="Worker" desc="I want jobs" />
                  </div>
                </div>
              </>
            )}
            <Button type="submit" disabled={loading} className="w-full h-11 text-base">
              {loading ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By continuing you agree to our Terms & Privacy Policy.
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Have an Access Code? <Link to="/access-code" className="text-primary font-medium">Enter it here</Link>
        </p>
      </div>
    </PageShell>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div>
      <Label className="flex items-center gap-1.5">{Icon && <Icon className="h-3.5 w-3.5"/>}{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function RoleButton({ selected, onClick, icon: Icon, label, desc }: any) {
  return (
    <button type="button" onClick={onClick}
      className={`text-left rounded-xl border-2 p-3 transition-colors ${selected ? "border-primary bg-accent" : "border-border hover:border-muted-foreground"}`}>
      <Icon className="h-5 w-5 text-primary"/>
      <div className="font-semibold text-sm mt-1">{label}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}

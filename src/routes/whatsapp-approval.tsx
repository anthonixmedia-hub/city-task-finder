import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { WHATSAPP_NUMBER } from "@/lib/format";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/whatsapp-approval")({
  validateSearch: z.object({ plan: z.enum(["premium", "professional"]).optional() }),
  head: () => ({ meta: [{ title: "Send WhatsApp Approval — MyCityRozgar.in" }] }),
  component: WApp,
});

function WApp() {
  const { plan = "premium" } = Route.useSearch();
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const upiId = "mycityrozgar@upi";
  const amount = plan === "professional" ? 449 : 99;
  const planLabel = plan === "professional" ? "Professional Worker (₹449)" : "Premium (₹99)";

  const message =
`Hello MyCityRozgar Team, I have completed registration and payment. Please review my application and provide my Access Code.
Name: ${profile?.full_name ?? "[Your Name]"}
Mobile: ${profile?.mobile ?? "[Your Mobile]"}
City: ${profile?.city ?? "Dumka"}
Plan: ${planLabel}`;

  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  function copyUpi() {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success("UPI ID copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <PageShell>
      <div className="container-app py-8 max-w-xl">
        <Badge variant="secondary" className="mb-2">Step 2 of 3</Badge>
        <h1 className="text-2xl md:text-3xl font-bold">Complete Payment & Get Approval</h1>
        <p className="text-muted-foreground text-sm mt-1">Pay via UPI, then send the prefilled WhatsApp message. Our team will verify and send your Access Code.</p>

        <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Selected plan</div>
              <div className="font-semibold text-lg">{planLabel}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="text-2xl font-extrabold text-primary">₹{amount}</div>
            </div>
          </div>

          <div className="mt-5 p-4 rounded-2xl bg-muted">
            <div className="text-xs text-muted-foreground">Pay to UPI ID</div>
            <div className="flex items-center gap-2 mt-1">
              <code className="font-mono text-base font-semibold flex-1">{upiId}</code>
              <Button size="sm" variant="outline" onClick={copyUpi}>
                {copied ? <CheckCircle2 className="h-4 w-4"/> : <Copy className="h-4 w-4"/>}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Open any UPI app (Google Pay, PhonePe, Paytm) → Send Money → Paste UPI ID → Pay ₹{amount}
            </p>
          </div>

          <div className="mt-5">
            <div className="text-sm font-medium mb-2">Prefilled WhatsApp message</div>
            <pre className="text-xs bg-muted p-3 rounded-lg whitespace-pre-wrap font-sans border border-border">{message}</pre>
          </div>

          <a href={waLink} target="_blank" rel="noreferrer" className="block mt-5">
            <Button size="lg" className="w-full h-12" style={{ background: "#25D366", color: "white" }}>
              <MessageCircle className="mr-2 h-5 w-5"/>Send via WhatsApp
            </Button>
          </a>

          <p className="text-xs text-muted-foreground text-center mt-3">
            Once your payment is verified (usually within a few hours), you'll receive your Access Code on WhatsApp.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/access-code" className="text-sm text-primary font-medium">I have my Access Code →</Link>
        </div>
      </div>
    </PageShell>
  );
}

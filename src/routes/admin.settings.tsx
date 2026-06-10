import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Site Settings — Admin" }] }),
  component: SettingsPage,
});

type SettingRow = { key: string; value: any };

function SettingsPage() {
  const { data: rows, refetch } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => (await supabase.from("site_settings").select("*")).data as SettingRow[] | null,
  });

  const map = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value])) as Record<string, any>;

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <p className="text-sm text-muted-foreground">Update text shown across the site. Changes apply immediately.</p>
      </div>

      <Tabs defaultValue="homepage">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>
        <TabsContent value="homepage" className="mt-4">
          <SettingForm sKey="homepage" initial={map.homepage} fields={[
            { name: "hero_title", label: "Hero title" },
            { name: "hero_subtitle", label: "Hero subtitle", multiline: true },
            { name: "cta_primary", label: "Primary button text" },
            { name: "cta_secondary", label: "Secondary button text" },
          ]} onSaved={refetch}/>
        </TabsContent>
        <TabsContent value="plans" className="mt-4">
          <SettingForm sKey="plans" initial={map.plans} fields={[
            { name: "premium_label", label: "Premium label" },
            { name: "premium_price", label: "Premium price (₹)", type: "number" },
            { name: "professional_label", label: "Professional label" },
            { name: "professional_price", label: "Professional price (₹)", type: "number" },
            { name: "note", label: "Note shown on plans page", multiline: true },
          ]} onSaved={refetch}/>
        </TabsContent>
        <TabsContent value="contact" className="mt-4">
          <SettingForm sKey="contact" initial={map.contact} fields={[
            { name: "whatsapp", label: "WhatsApp number (with country code)" },
            { name: "email", label: "Support email" },
            { name: "upi_id", label: "UPI ID for payments" },
          ]} onSaved={refetch}/>
        </TabsContent>
        <TabsContent value="footer" className="mt-4">
          <SettingForm sKey="footer" initial={map.footer} fields={[
            { name: "tagline", label: "Footer tagline" },
            { name: "copyright", label: "Copyright text" },
          ]} onSaved={refetch}/>
        </TabsContent>
      </Tabs>
    </div>
  );
}

type FieldDef = { name: string; label: string; multiline?: boolean; type?: string };

function SettingForm({ sKey, initial, fields, onSaved }: { sKey: string; initial: any; fields: FieldDef[]; onSaved: () => void }) {
  const [values, setValues] = useState<Record<string, any>>(initial ?? {});
  const [saving, setSaving] = useState(false);
  useEffect(() => { setValues(initial ?? {}); }, [initial]);

  async function save() {
    setSaving(true);
    try {
      const { error } = await supabase.from("site_settings").upsert({ key: sKey, value: values }, { onConflict: "key" });
      if (error) throw error;
      toast.success("Saved");
      onSaved();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      {fields.map((f) => (
        <div key={f.name}>
          <Label>{f.label}</Label>
          {f.multiline ? (
            <Textarea
              value={values[f.name] ?? ""}
              onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              className="mt-1.5"
              rows={3}
            />
          ) : (
            <Input
              type={f.type ?? "text"}
              value={values[f.name] ?? ""}
              onChange={(e) => setValues({ ...values, [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value })}
              className="mt-1.5 h-10"
            />
          )}
        </div>
      ))}
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1"/>{saving ? "Saving…" : "Save changes"}</Button>
      </div>
    </div>
  );
}

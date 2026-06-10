import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "Categories — Admin" }] }),
  component: CategoriesPage,
});

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function CategoriesPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: cats, refetch } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order").order("name")).data ?? [],
  });

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const finalSlug = slug.trim() || slugify(name);
      const { error } = await supabase.from("categories").insert({
        name: name.trim(), slug: finalSlug, icon: icon.trim() || null, sort_order: (cats?.length ?? 0) + 1,
      });
      if (error) throw error;
      toast.success("Category added");
      setName(""); setSlug(""); setIcon("");
      refetch();
    } catch (err: any) { toast.error(err.message); }
    finally { setCreating(false); }
  }

  async function updateCat(id: string, patch: any) {
    const { error } = await supabase.from("categories").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Saved"); refetch(); }
  }
  async function deleteCat(id: string) {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); refetch(); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-muted-foreground">Job categories shown across the site.</p>
      </div>

      <form onSubmit={addCategory} className="rounded-2xl border border-border bg-card p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <Label>Name</Label>
          <Input required value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }} className="mt-1.5 h-9"/>
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="auto" className="mt-1.5 h-9 font-mono"/>
        </div>
        <div>
          <Label>Icon (emoji or name)</Label>
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="mt-1.5 h-9"/>
        </div>
        <Button type="submit" disabled={creating}><Plus className="h-4 w-4 mr-1"/>Add</Button>
      </form>

      <div className="rounded-2xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr><th className="p-3">Name</th><th className="p-3">Slug</th><th className="p-3">Icon</th><th className="p-3 w-24">Sort</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {cats?.map((c: any) => (
              <CatRow key={c.id} cat={c} onSave={updateCat} onDelete={deleteCat}/>
            ))}
            {!cats?.length && <tr><td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">No categories yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CatRow({ cat, onSave, onDelete }: any) {
  const [name, setName] = useState(cat.name);
  const [slug, setSlug] = useState(cat.slug);
  const [icon, setIcon] = useState(cat.icon ?? "");
  const [sort, setSort] = useState<number>(cat.sort_order ?? 0);
  const dirty = name !== cat.name || slug !== cat.slug || (icon ?? "") !== (cat.icon ?? "") || sort !== cat.sort_order;

  return (
    <tr className="border-t border-border align-top">
      <td className="p-2"><Input value={name} onChange={(e) => setName(e.target.value)} className="h-9"/></td>
      <td className="p-2"><Input value={slug} onChange={(e) => setSlug(e.target.value)} className="h-9 font-mono"/></td>
      <td className="p-2"><Input value={icon} onChange={(e) => setIcon(e.target.value)} className="h-9"/></td>
      <td className="p-2"><Input type="number" value={sort} onChange={(e) => setSort(parseInt(e.target.value || "0"))} className="h-9 w-20"/></td>
      <td className="p-2">
        <div className="flex justify-end gap-1">
          <Button size="sm" disabled={!dirty} onClick={() => onSave(cat.id, { name, slug, icon: icon || null, sort_order: sort })}>
            <Save className="h-4 w-4 mr-1"/>Save
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(cat.id)}>
            <Trash2 className="h-4 w-4"/>
          </Button>
        </div>
      </td>
    </tr>
  );
}

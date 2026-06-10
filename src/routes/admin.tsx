import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Briefcase, Users, Tags, KeyRound, ScrollText, Settings,
  ExternalLink, Menu, X, ShieldCheck, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import logoAsset from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — MyCityRozgar.in" }] }),
  component: AdminLayout,
});

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/codes", label: "Access Codes", icon: KeyRound },
  { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
  { to: "/admin/settings", label: "Site Settings", icon: Settings },
] as const;

function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user, loading, navigate]);

  if (loading || isAdmin === null) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading admin…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md text-center">
          <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground"/>
          <h1 className="text-2xl font-bold mt-3">Admins only</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            This area is restricted. Ask the team to grant you the admin role.
          </p>
          <Link to="/"><Button className="mt-5" variant="outline">Back to site</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex-col
          ${mobileOpen ? "flex" : "hidden md:flex"}`}
      >
        <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
          <img src={logoAsset.url} alt="MCR" className="h-8 w-8 rounded-md object-contain"/>
          <div>
            <div className="font-bold text-sm leading-tight">MyCityRozgar</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin Panel</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
                  ${active ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted text-foreground/80"}`}
              >
                <Icon className="h-4 w-4"/>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border space-y-1">
          <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted">
            <ExternalLink className="h-4 w-4"/> View site
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted text-left"
          >
            <LogOut className="h-4 w-4"/> Sign out
          </button>
        </div>
      </aside>

      {/* Overlay on mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setMobileOpen(false)}/>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 sticky top-0 z-20 bg-card border-b border-border flex items-center px-3 md:px-5 gap-3">
          <button
            className="md:hidden h-9 w-9 grid place-items-center rounded-md hover:bg-muted"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
          </button>
          <div className="font-semibold text-sm truncate">
            {navItems.find((n) => n.exact ? pathname === n.to : pathname === n.to || pathname.startsWith(n.to + "/"))?.label ?? "Admin"}
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground truncate max-w-[40%]">
            <span className="hidden sm:inline">Signed in as</span>
            <span className="font-medium text-foreground truncate">{user?.email}</span>
          </div>
        </header>
        <main className="flex-1 p-3 md:p-6 min-w-0">
          <Outlet/>
        </main>
      </div>
    </div>
  );
}

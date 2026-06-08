import { Link } from "@tanstack/react-router";
import { Briefcase, Home, LayoutDashboard, Plus, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/logo.png.asset.json";

export function SiteHeader() {
  const { user, profile, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container-app flex h-14 items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            MC
          </span>
          <span className="hidden sm:inline">MyCityRozgar<span className="text-primary">.in</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link to="/jobs" className="px-3 py-2 rounded-md hover:bg-muted">Browse Jobs</Link>
          <Link to="/post-job" className="px-3 py-2 rounded-md hover:bg-muted">Post a Job</Link>
          <Link to="/plans" className="px-3 py-2 rounded-md hover:bg-muted">Plans</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/dashboard" className="hidden sm:block">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Button size="sm" variant="outline" onClick={signOut} className="hidden sm:inline-flex">
                Sign out
              </Button>
              <Link to="/dashboard" className="sm:hidden">
                <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-semibold">
                  {profile?.full_name?.[0]?.toUpperCase() ?? "U"}
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link to="/auth" className="hidden sm:block">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const { user } = useAuth();
  const items = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/jobs", icon: Briefcase, label: "Jobs" },
    { to: "/post-job", icon: Plus, label: "Post", highlight: true },
    { to: user ? "/dashboard" : "/auth", icon: LayoutDashboard, label: "Dashboard" },
    { to: user ? "/dashboard" : "/auth", icon: User, label: user ? "Me" : "Sign in" },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <ul className="grid grid-cols-5">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              to={it.to}
              className="flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: it.to === "/" }}
            >
              <span
                className={
                  it.highlight
                    ? "h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center -mt-3 shadow-elevated"
                    : "h-6 w-6 flex items-center justify-center"
                }
              >
                <it.icon className={it.highlight ? "h-5 w-5" : "h-5 w-5"} />
              </span>
              <span>{it.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/40">
      <div className="container-app py-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="font-display font-bold text-lg">
            MyCityRozgar<span className="text-primary">.in</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Local Jobs & Services Marketplace — trusted by your neighborhood.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-sm">Platform</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li><Link to="/jobs" className="hover:text-foreground">Browse Jobs</Link></li>
            <li><Link to="/post-job" className="hover:text-foreground">Post a Job</Link></li>
            <li><Link to="/plans" className="hover:text-foreground">Plans & Pricing</Link></li>
            <li><Link to="/access-code" className="hover:text-foreground">Enter Access Code</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-sm">Company</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>About Us</li>
            <li>Contact Us</li>
            <li>Privacy Policy</li>
            <li>Terms & Conditions</li>
            <li>Refund Policy</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-sm">Contact</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>📧 mycityrozgar@gmail.com</li>
            <li>📞 +91 6287 585752</li>
            <li>📍 Near Central Bank, Rashikpur, Sonwadangal, SP College Road, Dumka 814101</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MyCityRozgar.in — All rights reserved.
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}

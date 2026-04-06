import { NavLink as RouterNavLink, Outlet } from "react-router-dom";
import { Calendar, CheckSquare, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Calendar, label: "Kalendář" },
  { to: "/todo", icon: CheckSquare, label: "Úkoly" },
  { to: "/shopping", icon: ShoppingCart, label: "Nákupy" },
];

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Subtle gradient background overlay */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(265_80%_65%/0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(200_70%_60%/0.05),transparent_50%)]" />

      <header className="sticky top-0 z-50 glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-[hsl(200,70%,60%)] bg-clip-text text-transparent">
              Bambuls Universe
            </span>
          </h1>
          <div className="flex items-center gap-1">
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <RouterNavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300",
                      isActive
                        ? "bg-primary/15 text-primary glow-primary shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </RouterNavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;

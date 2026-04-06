import { NavLink as RouterNavLink, Outlet } from "react-router-dom";
import { Calendar, CheckSquare, ShoppingCart, Sun, Moon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", icon: Calendar, label: "Kalendář" },
  { to: "/todo", icon: CheckSquare, label: "Úkoly" },
  { to: "/shopping", icon: ShoppingCart, label: "Nákupy" },
];

const AppLayout = () => {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") !== "light";
    }
    return true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Cosmic background layers */}
      <div className="fixed inset-0 -z-10 cosmic-bg" />
      <div className="fixed inset-0 -z-10 stars animate-twinkle" />

      <header className="sticky top-0 z-50 glass-strong">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-twinkle" />
            <span className="bg-gradient-to-r from-primary via-[hsl(280,60%,70%)] to-[hsl(200,70%,60%)] bg-clip-text text-transparent">
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
                        ? "glass bg-primary/15 text-primary glow-primary"
                        : "text-muted-foreground hover:text-foreground hover:glass-subtle"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </RouterNavLink>
              ))}
            </nav>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark((d) => !d)}
              className="ml-2 rounded-xl hover:glass-subtle"
              aria-label="Přepnout tmavý/světlý režim"
            >
              {dark ? <Sun className="h-4 w-4 text-cosmic-star" /> : <Moon className="h-4 w-4" />}
            </Button>
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

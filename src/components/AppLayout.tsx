import { NavLink as RouterNavLink, Outlet } from "react-router-dom";
import { Calendar, CheckSquare, ShoppingCart, Sun, Moon } from "lucide-react";
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
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            <span className="text-primary">Bambuls Universe</span>
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
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
              className="ml-2"
              aria-label="Přepnout tmavý/světlý režim"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;

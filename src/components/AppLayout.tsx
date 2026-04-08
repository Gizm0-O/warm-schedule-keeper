import { NavLink as RouterNavLink, Outlet } from "react-router-dom";
import { Calendar, CheckSquare, ShoppingCart, Sun, Moon, Orbit } from "lucide-react";
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated gradient blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Large purple blob - top left */}
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-70 dark:opacity-50 blur-3xl"
          style={{
            background: "hsl(var(--blob-1))",
            animation: "blob-float-1 20s ease-in-out infinite",
          }}
        />
        {/* Blue blob - top right */}
        <div
          className="absolute -top-20 right-0 w-[400px] h-[400px] rounded-full opacity-60 dark:opacity-40 blur-3xl"
          style={{
            background: "hsl(var(--blob-2))",
            animation: "blob-float-2 25s ease-in-out infinite",
          }}
        />
        {/* Orange/coral blob - bottom right */}
        <div
          className="absolute bottom-0 right-20 w-[450px] h-[450px] rounded-full opacity-60 dark:opacity-40 blur-3xl"
          style={{
            background: "hsl(var(--blob-3))",
            animation: "blob-float-3 22s ease-in-out infinite",
          }}
        />
        {/* Pink blob - bottom left */}
        <div
          className="absolute bottom-20 -left-20 w-[350px] h-[350px] rounded-full opacity-50 dark:opacity-35 blur-3xl"
          style={{
            background: "hsl(var(--blob-4))",
            animation: "blob-float-4 18s ease-in-out infinite",
          }}
        />
        {/* Center subtle nebula */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 dark:opacity-15 blur-3xl"
          style={{
            background: "hsl(var(--cosmic-nebula))",
            animation: "blob-float-2 30s ease-in-out infinite",
          }}
        />
      </div>

      <header className="sticky top-0 z-50 glass-strong">
        <div className="mx-auto flex h-16 max-w-[1800px] 2xl:max-w-[2200px] items-center justify-between px-4 2xl:px-8">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Orbit className="h-5 w-5 text-primary animate-twinkle" />
            <span className="bg-gradient-to-r from-[hsl(280,90%,65%)] via-[hsl(265,80%,65%)] to-[hsl(200,90%,55%)] bg-clip-text text-transparent">
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
                        ? "glass text-primary glow-primary"
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
              className="ml-2 rounded-xl hover:glass-subtle transition-all duration-300"
              aria-label="Přepnout tmavý/světlý režim"
            >
              {dark ? <Sun className="h-4 w-4 text-cosmic-star" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 animate-fade-in relative z-10">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;

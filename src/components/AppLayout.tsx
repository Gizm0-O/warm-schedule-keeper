import { NavLink as RouterNavLink, Outlet } from "react-router-dom";
import { Calendar, CheckSquare, ShoppingCart, Sun, Moon, Orbit, ListChecks, Gift, Lightbulb, Wallet, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import AdminToggle from "@/components/AdminToggle";
import NotificationsBell from "@/components/NotificationsBell";
import VouchersButton from "@/components/VouchersButton";
import UserMenu from "@/components/UserMenu";
import OfflineIndicator from "@/components/OfflineIndicator";
import bgImage from "@/assets/bckg_malkovice.asset.json";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

const navItems = [
  { to: "/", icon: Calendar, label: "Kalendář" },
  { to: "/todo", icon: CheckSquare, label: "Úkoly" },
  { to: "/shopping", icon: ShoppingCart, label: "Nákupy" },
  { to: "/finance", icon: Wallet, label: "Finance" },
  { to: "/gifts", icon: Gift, label: "Dárečky" },
  { to: "/ideas", icon: Lightbulb, label: "Nápady" },
  { to: "/changelog", icon: ListChecks, label: "Změny" },
];

const AppLayout = () => {
  useStoriesReminder();

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

  const reducedMotion = useReducedMotion();
  const animate = (name: string, duration: string) =>
    reducedMotion ? undefined : `${name} ${duration} ease-in-out infinite`;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <OfflineIndicator />
      {/* Background image (Malkovice) - fixed to viewport */}
      <div
        className="fixed inset-0 pointer-events-none bg-center bg-cover bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${bgImage.url})`, zIndex: 0 }}
        aria-hidden="true"
      />
      {/* Animated gradient blobs (reduced count for perf, disabled on reduced-motion) */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-70 dark:opacity-50 blur-3xl"
          style={{ background: "hsl(var(--blob-1))", animation: animate("blob-float-1", "20s") }}
        />
        <div
          className="absolute -top-20 right-0 w-[400px] h-[400px] rounded-full opacity-60 dark:opacity-40 blur-3xl"
          style={{ background: "hsl(var(--blob-2))", animation: animate("blob-float-2", "25s") }}
        />
        <div
          className="absolute bottom-0 right-20 w-[450px] h-[450px] rounded-full opacity-60 dark:opacity-40 blur-3xl"
          style={{ background: "hsl(var(--blob-3))", animation: animate("blob-float-3", "22s") }}
        />
      </div>


      <header className="group/header fixed inset-x-0 top-0 z-50 glass-strong">
        <div className="relative mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-2 px-3 sm:px-6">
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-xl hover:glass-subtle shrink-0"
                aria-label="Otevřít menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-left">Navigace</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-2">
                {navItems.map((item) => (
                  <RouterNavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "glass text-primary glow-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </RouterNavLink>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <RouterNavLink to="/" className="hover:opacity-80 transition-opacity cursor-pointer shrink-0 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 min-w-0">
              <Orbit className="h-5 w-5 text-primary animate-twinkle shrink-0" />
              <span className="bg-gradient-to-r from-[hsl(280,90%,65%)] via-[hsl(265,80%,65%)] to-[hsl(200,90%,55%)] bg-clip-text text-transparent truncate">
                Bambuls Universe
              </span>
            </h1>
          </RouterNavLink>
          <AdminToggle />
        </div>
        <div className="flex items-center gap-1">
            <nav className="hidden md:flex gap-1">
              {navItems.map((item) => (
                <RouterNavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  title={item.label}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-xl px-2.5 lg:px-4 py-2 text-sm font-medium transition-transform transition-colors duration-200",
                      isActive
                        ? "glass text-primary glow-primary"
                        : "text-muted-foreground hover:text-foreground hover:scale-105 hover:bg-secondary/50"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </RouterNavLink>
              ))}
            </nav>
            <VouchersButton />
            <NotificationsBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark((d) => !d)}
              className="ml-1 rounded-xl hover:glass-subtle transition-all duration-300"
              aria-label="Přepnout tmavý/světlý režim"
            >
              {dark ? <Sun className="h-4 w-4 text-cosmic-star" /> : <Moon className="h-4 w-4" />}
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 pb-6 pt-20 animate-fade-in relative z-10">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;

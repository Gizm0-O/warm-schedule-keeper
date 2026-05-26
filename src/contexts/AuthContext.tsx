import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type ProfileStatus = "pending" | "approved" | "rejected";

interface Profile {
  user_id: string;
  display_name: string;
  email: string;
  status: ProfileStatus;
  username?: string | null;
  avatar_url?: string | null;
}

interface AuthCtx {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isApproved: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = async (uid: string) => {
    setProfileLoading(true);
    try {
      const [{ data: p }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("user_id,display_name,email,status,username,avatar_url").eq("user_id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      setProfile(p as Profile | null);
      setIsAdmin(!!roles?.some((r: any) => r.role === "admin"));
    } finally {
      setProfileLoading(false);
    }
  };

  const refresh = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setProfileLoading(true);
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("adminMode");
    localStorage.removeItem("adminModePersist");
  };

  return (
    <Ctx.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      isAdmin,
      isApproved: profile?.status === "approved",
      loading,
      signOut,
      refresh,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}

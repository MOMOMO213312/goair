import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "./supabase";

// RPC functions still take a p_access_token parameter for backward
// compatibility with the old static-token system. Once a real Supabase Auth
// session is confirmed, we no longer need that string for anything — the
// database resolves the agency from auth.uid() instead — so we just send
// this placeholder.
export const AGENCY_RPC_TOKEN = "session-auth";

type AgencySessionState = "loading" | "signed-out" | "not-agency" | "authorized";

type AgencySessionContextValue = {
  state: AgencySessionState;
  signOut: () => Promise<void>;
};

const AgencySessionContext = createContext<AgencySessionContextValue | null>(null);

export function AgencySessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AgencySessionState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) setState("signed-out");
        return;
      }

      const { data, error } = await supabase.rpc("agency_check_session");
      if (cancelled) return;

      if (error || !data) {
        setState("not-agency");
        return;
      }

      setState("authorized");
    }

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkSession();
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setState("signed-out");
  };

  return (
    <AgencySessionContext.Provider value={{ state, signOut }}>{children}</AgencySessionContext.Provider>
  );
}

export function useAgencySession() {
  const ctx = useContext(AgencySessionContext);
  if (!ctx) throw new Error("useAgencySession must be used inside AgencySessionProvider");
  return ctx;
}

// Child dashboard pages import this instead of reading a token from the URL.
export function useAgencyToken() {
  return AGENCY_RPC_TOKEN;
}

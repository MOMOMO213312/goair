import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "./supabase";

// RPC functions still take a p_access_token parameter for backward
// compatibility with the old static-token system. Once a real Supabase Auth
// session is confirmed, we no longer need that string for anything — the
// database resolves the partner from auth.uid() instead — so we just send
// this placeholder.
export const PARTNER_RPC_TOKEN = "session-auth";

type PartnerSessionState = "loading" | "signed-out" | "not-partner" | "authorized";

type PartnerSessionContextValue = {
  state: PartnerSessionState;
  signOut: () => Promise<void>;
};

const PartnerSessionContext = createContext<PartnerSessionContextValue | null>(null);

export function PartnerSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PartnerSessionState>("loading");

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

      const { data, error } = await supabase.rpc("partner_check_session");
      if (cancelled) return;

      if (error || !data) {
        setState("not-partner");
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
    <PartnerSessionContext.Provider value={{ state, signOut }}>{children}</PartnerSessionContext.Provider>
  );
}

export function usePartnerSession() {
  const ctx = useContext(PartnerSessionContext);
  if (!ctx) throw new Error("usePartnerSession must be used inside PartnerSessionProvider");
  return ctx;
}

// Child dashboard pages import this instead of reading a token from the URL.
export function usePartnerToken() {
  return PARTNER_RPC_TOKEN;
}

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "./supabase";

// RPC functions still take a p_access_token parameter for backward
// compatibility with the old static-token system. Once a real Supabase Auth
// session is confirmed, we no longer need that string for anything — the
// database resolves the ground handling partner from auth.uid() instead — so
// we just send this placeholder.
export const GROUND_HANDLING_RPC_TOKEN = "session-auth";

type GroundHandlingSessionState = "loading" | "signed-out" | "not-ground-handling" | "authorized";

type GroundHandlingSessionContextValue = {
  state: GroundHandlingSessionState;
  signOut: () => Promise<void>;
};

const GroundHandlingSessionContext = createContext<GroundHandlingSessionContextValue | null>(null);

export function GroundHandlingSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GroundHandlingSessionState>("loading");

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

      const { data, error } = await supabase.rpc("ground_handling_check_session");
      if (cancelled) return;

      if (error || !data) {
        setState("not-ground-handling");
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
    <GroundHandlingSessionContext.Provider value={{ state, signOut }}>
      {children}
    </GroundHandlingSessionContext.Provider>
  );
}

export function useGroundHandlingSession() {
  const ctx = useContext(GroundHandlingSessionContext);
  if (!ctx) throw new Error("useGroundHandlingSession must be used inside GroundHandlingSessionProvider");
  return ctx;
}

// Child dashboard pages import this instead of reading a token from the URL.
export function useGroundHandlingToken() {
  return GROUND_HANDLING_RPC_TOKEN;
}

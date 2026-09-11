import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "./supabase";
import {
  GROUND_HANDLING_RPC_TOKEN,
  clearGroundHandlingToken,
  getGroundHandlingDashboard,
  getStoredGroundHandlingToken,
  storeGroundHandlingToken,
} from "./ground-handling";

type GroundHandlingSessionState = "loading" | "signed-out" | "invalid" | "authorized";

type GroundHandlingSessionContextValue = {
  state: GroundHandlingSessionState;
  token: string | null;
  signIn: (token: string) => void;
  signOut: () => Promise<void>;
};

const GroundHandlingSessionContext = createContext<GroundHandlingSessionContextValue | null>(null);

export function GroundHandlingSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GroundHandlingSessionState>("loading");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      // Prefer a real Supabase Auth session (email + password login).
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const { data, error } = await supabase.rpc("ground_handling_check_session");
        if (cancelled) return;
        if (!error && data) {
          setToken(GROUND_HANDLING_RPC_TOKEN);
          setState("authorized");
          return;
        }
      }

      // Fall back to the legacy static-token login.
      const stored = getStoredGroundHandlingToken();
      if (!stored) {
        if (!cancelled) setState("signed-out");
        return;
      }
      try {
        await getGroundHandlingDashboard(stored);
        if (cancelled) return;
        setToken(stored);
        setState("authorized");
      } catch {
        if (cancelled) return;
        clearGroundHandlingToken();
        setState(session ? "signed-out" : "invalid");
      }
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

  function signIn(newToken: string) {
    storeGroundHandlingToken(newToken);
    setToken(newToken);
    setState("authorized");
  }

  async function signOut() {
    await supabase.auth.signOut();
    clearGroundHandlingToken();
    setToken(null);
    setState("signed-out");
  }

  return (
    <GroundHandlingSessionContext.Provider value={{ state, token, signIn, signOut }}>
      {children}
    </GroundHandlingSessionContext.Provider>
  );
}

export function useGroundHandlingSession() {
  const ctx = useContext(GroundHandlingSessionContext);
  if (!ctx) throw new Error("useGroundHandlingSession must be used inside GroundHandlingSessionProvider");
  return ctx;
}

// Child dashboard pages import this instead of threading the token through props.
export function useGroundHandlingToken() {
  const ctx = useContext(GroundHandlingSessionContext);
  if (!ctx) throw new Error("useGroundHandlingToken must be used inside GroundHandlingSessionProvider");
  return ctx.token;
}

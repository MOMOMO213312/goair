import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "./supabase";

// RPC functions still take a p_access_token parameter for backward
// compatibility with the old static-token system. Once a real Supabase Auth
// session is confirmed, we no longer need that string for anything — the
// database resolves the operator from auth.uid() instead — so we just send
// this placeholder.
export const OPERATOR_RPC_TOKEN = "session-auth";

type OperatorSessionState = "loading" | "signed-out" | "not-operator" | "authorized";

type OperatorSessionContextValue = {
  state: OperatorSessionState;
  signOut: () => Promise<void>;
};

const OperatorSessionContext = createContext<OperatorSessionContextValue | null>(null);

export function OperatorSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OperatorSessionState>("loading");

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

      const { data, error } = await supabase.rpc("operator_check_session");
      if (cancelled) return;

      if (error || !data) {
        setState("not-operator");
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
    <OperatorSessionContext.Provider value={{ state, signOut }}>{children}</OperatorSessionContext.Provider>
  );
}

export function useOperatorSession() {
  const ctx = useContext(OperatorSessionContext);
  if (!ctx) throw new Error("useOperatorSession must be used inside OperatorSessionProvider");
  return ctx;
}

// Child dashboard pages import this instead of reading a token from the URL.
export function useOperatorToken() {
  return OPERATOR_RPC_TOKEN;
}

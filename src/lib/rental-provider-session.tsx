import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "./supabase";

// RPC functions still take a p_access_token parameter for backward
// compatibility with the old static-token system. Once a real Supabase Auth
// session is confirmed, we no longer need that string for anything — the
// database resolves the provider from auth.uid() instead — so we just send
// this placeholder.
export const RENTAL_PROVIDER_RPC_TOKEN = "session-auth";

type RentalProviderSessionState = "loading" | "signed-out" | "not-provider" | "authorized";

type RentalProviderSessionContextValue = {
  state: RentalProviderSessionState;
  signOut: () => Promise<void>;
};

const RentalProviderSessionContext = createContext<RentalProviderSessionContextValue | null>(null);

export function RentalProviderSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RentalProviderSessionState>("loading");

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

      const { data, error } = await supabase.rpc("rental_partner_check_session");
      if (cancelled) return;

      if (error || !data) {
        setState("not-provider");
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
    <RentalProviderSessionContext.Provider value={{ state, signOut }}>
      {children}
    </RentalProviderSessionContext.Provider>
  );
}

export function useRentalProviderSession() {
  const ctx = useContext(RentalProviderSessionContext);
  if (!ctx) throw new Error("useRentalProviderSession must be used inside RentalProviderSessionProvider");
  return ctx;
}

// Child dashboard pages import this instead of reading a token from the URL.
export function useRentalProviderToken() {
  return RENTAL_PROVIDER_RPC_TOKEN;
}

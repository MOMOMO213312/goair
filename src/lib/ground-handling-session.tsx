import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import {
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
  signOut: () => void;
};

const GroundHandlingSessionContext = createContext<GroundHandlingSessionContextValue | null>(null);

export function GroundHandlingSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GroundHandlingSessionState>("loading");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredGroundHandlingToken();
    if (!stored) {
      setState("signed-out");
      return;
    }
    let cancelled = false;
    getGroundHandlingDashboard(stored)
      .then(() => {
        if (cancelled) return;
        setToken(stored);
        setState("authorized");
      })
      .catch(() => {
        if (cancelled) return;
        clearGroundHandlingToken();
        setState("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function signIn(newToken: string) {
    storeGroundHandlingToken(newToken);
    setToken(newToken);
    setState("authorized");
  }

  function signOut() {
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

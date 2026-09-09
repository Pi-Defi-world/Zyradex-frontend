"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

/**
 * Hub Mode Context
 *
 * Controls whether the app uses Hub contracts or legacy Stellar native AMM.
 * Stored in localStorage for persistence.
 */

interface HubModeContextType {
  /** Whether Hub mode is enabled */
  hubMode: boolean;
  /** Whether Hub contracts are available on the network */
  hubAvailable: boolean;
  /** Toggle Hub mode on/off */
  toggleHubMode: () => void;
  /** Set Hub mode explicitly */
  setHubMode: (enabled: boolean) => void;
}

const HubModeContext = createContext<HubModeContextType>({
  hubMode: false,
  hubAvailable: false,
  toggleHubMode: () => {},
  setHubMode: () => {},
});

export function useHubMode() {
  return useContext(HubModeContext);
}

interface HubModeProviderProps {
  children: ReactNode;
}

export function HubModeProvider({ children }: HubModeProviderProps) {
  const [hubMode, setHubModeState] = useState<boolean>(false);
  const [hubAvailable, setHubAvailable] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("zyradex-hub-mode");
    if (stored === "true") {
      setHubModeState(true);
    }
  }, []);

  // Check Hub availability on mount
  useEffect(() => {
    async function checkHub() {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
        if (!API_BASE_URL) return;

        const res = await fetch(`${API_BASE_URL}/v1/hub/status`);
        const data = await res.json();
        setHubAvailable(data.available === true);
      } catch {
        setHubAvailable(false);
      }
    }
    checkHub();
  }, []);

  const toggleHubMode = () => {
    setHubModeState((prev) => {
      const next = !prev;
      localStorage.setItem("zyradex-hub-mode", String(next));
      return next;
    });
  };

  const setHubMode = (enabled: boolean) => {
    setHubModeState(enabled);
    localStorage.setItem("zyradex-hub-mode", String(enabled));
  };

  return (
    <HubModeContext.Provider
      value={{ hubMode, hubAvailable, toggleHubMode, setHubMode }}
    >
      {children}
    </HubModeContext.Provider>
  );
}

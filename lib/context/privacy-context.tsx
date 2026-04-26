"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface PrivacyContextValue {
  isPrivate: boolean;
  togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue>({
  isPrivate: false,
  togglePrivacy: () => {},
});

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    setIsPrivate(localStorage.getItem("privacy-mode") === "true");
  }, []);

  function togglePrivacy() {
    setIsPrivate((prev) => {
      localStorage.setItem("privacy-mode", String(!prev));
      return !prev;
    });
  }

  return (
    <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}

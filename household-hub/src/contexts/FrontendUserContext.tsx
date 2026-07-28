"use client";

import { createContext, useContext } from "react";

export type FrontendUserState = {
  /** Frontend login is required by Admin → Access */
  loginRequired: boolean;
  signedIn: boolean;
  email: string | null;
  /** Access user name / email local-part — null when login off or unsigned */
  displayName: string | null;
};

const FrontendUserContext = createContext<FrontendUserState>({
  loginRequired: false,
  signedIn: false,
  email: null,
  displayName: null,
});

export function FrontendUserProvider({
  value,
  children,
}: {
  value: FrontendUserState;
  children: React.ReactNode;
}) {
  return (
    <FrontendUserContext.Provider value={value}>
      {children}
    </FrontendUserContext.Provider>
  );
}

export function useFrontendUser(): FrontendUserState {
  return useContext(FrontendUserContext);
}

/** Name for greetings / UI — logged-in Access name, else household helperName. */
export function useMemberDisplayName(fallbackHelperName: string): string {
  const { displayName, signedIn, loginRequired } = useFrontendUser();
  if (loginRequired && signedIn && displayName) return displayName;
  return fallbackHelperName || "Friend";
}

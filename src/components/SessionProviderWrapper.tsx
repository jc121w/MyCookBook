"use client";

import { SessionProvider } from "next-auth/react";

const SessionProviderWrapper: React.FC<{
  children: React.ReactNode;
  session?: any;
}> = ({ children }) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default SessionProviderWrapper;

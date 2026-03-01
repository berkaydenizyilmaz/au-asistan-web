"use client";

import { useAuthListener } from "../hooks/use-auth-listener";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  useAuthListener();
  return <>{children}</>;
}

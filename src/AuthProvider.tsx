"use client";
import { ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Temporarily return children without KindeProvider 
  // until Kinde Auth is fully compatible with React 18
  return (
    <>
      {children}
    </>
  );
};
"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { AppwriteSessionProvider } from "@/components/AppwriteSessionProvider";

export function Providers({ children }) {
  return (
    <AppwriteSessionProvider>
      <AuthProvider>{children}</AuthProvider>
    </AppwriteSessionProvider>
  );
}

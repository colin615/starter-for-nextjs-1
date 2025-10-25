"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { CrispChat } from "@/components/CrispChat";

export function Providers({ children }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
        <CrispChat />
      </NotificationProvider>
    </AuthProvider>
  );
}

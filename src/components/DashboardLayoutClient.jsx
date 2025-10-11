"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export function DashboardLayoutClient({ children }) {
  useKeyboardShortcuts();
  
  return <>{children}</>;
}

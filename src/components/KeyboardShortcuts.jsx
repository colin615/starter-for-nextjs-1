"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export function KeyboardShortcuts() {
  useKeyboardShortcuts();
  return null; // This component doesn't render anything, just handles keyboard events
}

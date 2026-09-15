"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "theme";

function readStored(): Theme {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
}

/**
 * Per-device theme, remembered in localStorage. Dark is the default (the
 * all-dark design); light is an opt-in re-skin. The pre-paint script in the root
 * layout sets the initial attribute, so this hook just syncs React state and
 * writes changes back. Shared by the team and facilitator views.
 */
export function useTheme(): { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>("dark");

  // Sync from storage on mount (the pre-paint script already applied the class).
  useEffect(() => {
    setThemeState(readStored());
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode / storage disabled: theme still applies for this session.
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(readStored() === "light" ? "dark" : "light");
  }, [setTheme]);

  return { theme, toggle, setTheme };
}

/**
 * True when the dark theme is active. Presentational components that hardcode
 * on-dark colours (SVG grid strokes, ribbon fills) take an `onDark` prop from
 * callers written for the all-dark UI; combine it with this so those colours
 * flip correctly in light mode: `const dark = onDark && useIsDark()`.
 */
export function useIsDark(): boolean {
  return useTheme().theme === "dark";
}

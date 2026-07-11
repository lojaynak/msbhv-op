"use client";

import * as React from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "msbhv-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initial value is read from the DOM class set by the anti-flash inline
  // script in layout.tsx (see head script), so this never mismatches
  // what was already painted.
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.classList.contains("light") ? "light" : "dark";
  });

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/**
 * Blocking inline script — reads localStorage before first paint and sets
 * the theme class synchronously, so there's no flash of the wrong theme
 * and no hydration mismatch. Rendered via <script dangerouslySetInnerHTML>
 * in the root layout's <head>, same pattern next-themes uses.
 */
export const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.classList.add(theme);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

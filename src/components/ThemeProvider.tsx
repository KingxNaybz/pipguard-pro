import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "cyber" | "stealth" | "light" | "gold" | "matrix";

export const THEMES: { id: Theme; name: string; desc: string }[] = [
  { id: "cyber", name: "Cyber Dark", desc: "Deep navy · cyan neon" },
  { id: "stealth", name: "Stealth", desc: "Pure black · red accents" },
  { id: "light", name: "Light Mode", desc: "Clean · professional" },
  { id: "gold", name: "Gold Rush", desc: "PipGold luxury" },
  { id: "matrix", name: "Matrix", desc: "Hacker terminal" },
];

const STORAGE_KEY = "pipgold-theme";

type Ctx = { theme: Theme; setTheme: (t: Theme) => void };
const ThemeCtx = createContext<Ctx>({ theme: "cyber", setTheme: () => {} });

export const useTheme = () => useContext(ThemeCtx);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "cyber";
    return (localStorage.getItem(STORAGE_KEY) as Theme) || "cyber";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return <ThemeCtx.Provider value={{ theme, setTheme: setThemeState }}>{children}</ThemeCtx.Provider>;
};

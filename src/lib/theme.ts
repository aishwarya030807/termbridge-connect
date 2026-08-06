const KEY = "intermed.theme";
export type Theme = "light" | "dark";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return (window.localStorage.getItem(KEY) as Theme) ?? "light";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(KEY, theme);
}
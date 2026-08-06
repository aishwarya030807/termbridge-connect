const TOKEN_KEY = "intermed.token";
const USER_KEY = "intermed.user";

export function signIn(username: string, remember: boolean) {
  const token = `intermed-demo-${Math.random().toString(36).slice(2)}`;
  const store = remember ? window.localStorage : window.sessionStorage;
  store.setItem(TOKEN_KEY, token);
  store.setItem(USER_KEY, username);
  return token;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
}

export function getUser(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(USER_KEY) ?? window.sessionStorage.getItem(USER_KEY);
}

export function signOut() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
}
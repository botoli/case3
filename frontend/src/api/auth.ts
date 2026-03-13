import { clearAuthToken, setAuthToken } from "./client";

export interface User {
  id: string | number;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

/** Учебный проект: авторизация только в localStorage, без бэкенда */
export function login(email: string, password: string): Promise<LoginResponse> {
  const trimmed = email.trim();
  if (!trimmed) return Promise.reject(new Error("Введите email"));
  if (!password) return Promise.reject(new Error("Введите пароль"));

  const user: User = { id: String(Date.now()), email: trimmed };
  const token = "local-" + Date.now();
  setAuthToken(token);
  return Promise.resolve({ token, user });
}

export function logout(): void {
  clearAuthToken();
}

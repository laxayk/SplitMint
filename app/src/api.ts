import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Expo Secure Store has no web implementation; localStorage is the web fallback
// (web is used for previews and tests, not the shipped app).
const store = {
  async get(k: string) {
    return Platform.OS === 'web' ? window.localStorage.getItem(k) : SecureStore.getItemAsync(k);
  },
  async set(k: string, v: string) {
    if (Platform.OS === 'web') window.localStorage.setItem(k, v);
    else await SecureStore.setItemAsync(k, v);
  },
  async del(k: string) {
    if (Platform.OS === 'web') window.localStorage.removeItem(k);
    else await SecureStore.deleteItemAsync(k);
  },
};

const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:8080';

const TOKEN_KEY = 'splitmint.jwt';
const USER_KEY = 'splitmint.userId';

export async function saveToken(token: string, userId?: string) {
  await store.set(TOKEN_KEY, token);
  if (userId) await store.set(USER_KEY, userId);
}

export async function loadUserId() {
  return store.get(USER_KEY);
}

export async function loadToken(): Promise<string | null> {
  return store.get(TOKEN_KEY);
}

export async function clearToken() {
  await store.del(TOKEN_KEY);
  await store.del(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** One fetch wrapper: attaches the token, surfaces the server's error message. */
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await loadToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

/** Client-generated idempotency key for one logical save. */
export function newRequestId(): string {
  return `rn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

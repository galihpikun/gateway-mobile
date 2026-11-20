/**
 * Gateway Mobile — Secure Token Storage
 * Uses expo-secure-store on iOS/Android, and localStorage with memory fallback on Web.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'gateway_token';

let memoryToken: string | null = null;

export async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(TOKEN_KEY);
      }
      return memoryToken;
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return memoryToken;
  }
}

export async function setToken(token: string): Promise<void> {
  memoryToken = token;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, token);
      }
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // Silently fail
  }
}

export async function removeToken(): Promise<void> {
  memoryToken = null;
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
      }
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Ignore
  }
}

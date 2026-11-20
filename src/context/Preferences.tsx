import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors, LightColors } from '../lib/theme';

type Language = 'id' | 'en';
type Theme = 'dark' | 'light';
const key = 'gateway_preferences';
const defaults = { language: 'id' as Language, theme: 'dark' as Theme };
const Context = createContext({ ...defaults, setLanguage: (_: Language) => {}, setTheme: (_: Theme) => {} });

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaults);
  useEffect(() => {
    let active = true;
    async function read() {
      try {
        const raw = Platform.OS === 'web' ? window.localStorage.getItem(key) : await SecureStore.getItemAsync(key);
        if (raw && active) {
          const saved = JSON.parse(raw);
          setSettings({ language: saved.language === 'en' ? 'en' : 'id', theme: saved.theme === 'light' ? 'light' : 'dark' });
        }
      } catch {}
    }
    void read();
    return () => { active = false; };
  }, []);
  function save(next: typeof settings) {
    setSettings(next);
    const raw = JSON.stringify(next);
    if (Platform.OS === 'web') {
      try { window.localStorage.setItem(key, raw); } catch {}
    } else void SecureStore.setItemAsync(key, raw).catch(() => {});
  }
  return <Context.Provider value={{ ...settings, setLanguage: language => save({ ...settings, language }), setTheme: theme => save({ ...settings, theme }) }}>{children}</Context.Provider>;
}

export function usePreferences() {
  const options = useContext(Context);
  return { ...options, tr: (id: string, en: string) => options.language === 'id' ? id : en };
}

export function useColors() {
  return useContext(Context).theme === 'light' ? LightColors : Colors;
}

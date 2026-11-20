import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const localHost = (host: string) => ['localhost', '127.0.0.1', '[::1]'].includes(host);
const metroHost = () => {
  try {
    const uri = Constants.expoConfig?.hostUri;
    if (!uri) return null;
    const host = new URL('http://' + uri).hostname;
    return localHost(host) || host.endsWith('.exp.direct') ? null : host;
  } catch {
    return null;
  }
};

export function backendUrl() {
  const candidate = configuredUrl ? new URL(configuredUrl) : new URL('http://localhost:3001');
  if (!['http:', 'https:'].includes(candidate.protocol) || candidate.username || candidate.password) {
    throw new Error('EXPO_PUBLIC_API_URL must be an HTTP or HTTPS backend address.');
  }
  if (localHost(candidate.hostname)) {
    if (Platform.OS === 'android' && !Device.isDevice) candidate.hostname = '10.0.2.2';
    else if (Platform.OS !== 'web' && Device.isDevice) {
      const host = metroHost();
      if (!host) throw new Error('Set EXPO_PUBLIC_API_URL to the backend LAN address or HTTPS URL for this device.');
      candidate.hostname = host;
    } else if (Platform.OS === 'web' && typeof window !== 'undefined' && !localHost(window.location.hostname)) {
      if (!__DEV__ && !configuredUrl) throw new Error('Configure EXPO_PUBLIC_API_URL for the deployed app.');
      candidate.hostname = window.location.hostname;
    }
  }
  const prefix = candidate.pathname.replace(/\/+$/, '').replace(/\/api$/, '');
  return candidate.origin + prefix + '/api';
}

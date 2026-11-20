/**
 * Gateway Mobile — Auth Stack Layout
 * Guards: authenticated users are redirected to tabs.
 */
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#101415' },
        animation: 'slide_from_right',
      }}
    />
  );
}

/**
 * Gateway Mobile — Auth Stack Layout
 * Guards: authenticated users are redirected to tabs.
 */
import { Stack, Redirect } from 'expo-router';
import { useColors } from '../../context/Preferences';
import { useAuth } from '../../context/AuthContext';

export default function AuthLayout() {
  const colors = useColors();
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
        animation: 'slide_from_right',
      }}
    />
  );
}

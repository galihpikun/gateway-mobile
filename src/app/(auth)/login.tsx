import { mobileLabels } from '../../lib/mobileLabels';
/**
 * Gateway Mobile — Login Screen
 * Based on gateway-fe/src/app/login/page.tsx
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { GatewayLogo } from '../../components/GatewayLogo';
import { ApiError } from '../../lib/api';
import { usePreferences, useColors } from '../../context/Preferences';

export default function LoginScreen() {
  const { language: uiLanguage } = usePreferences();
  const ui = (label: string) => uiLanguage === 'id' ? mobileLabels[label] ?? label : label;
  const Colors = useColors();
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError(ui('Please enter your email and password.'));
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : ui('Failed to sign in. Please verify your credentials.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: Colors.canvas }}
      className="flex-1 bg-canvas"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        <View className="flex-1 justify-center px-5 py-10 w-full max-w-[480px] self-center">
          {/* Logo / Brand */}
          <View className="items-center mb-10">
            <GatewayLogo size={48} />
            <Text
              style={{ color: Colors.inkPrimary }}
              className="text-ink-primary font-bold text-3xl tracking-tighter mt-3"
            >
              Gateway
            </Text>
          </View>

          {/* Auth Panel */}
          <View
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.line,
              borderWidth: 1,
            }}
            className="bg-surface border border-line rounded-xl p-5"
          >
            <View
              style={{ borderBottomColor: Colors.edge + '33', borderBottomWidth: 1 }}
              className="pb-4 mb-5 border-b border-edge/20"
            >
              <Text
                style={{ color: Colors.inkPrimary }}
                className="text-ink-primary font-bold text-2xl tracking-tight"
              >{ui("Sign In to Gateway")}</Text>
            </View>

            {/* Error */}
            {error && (
              <View
                style={{
                  backgroundColor: Colors.terracotta + '1A',
                  borderColor: Colors.terracotta,
                  borderWidth: 1,
                }}
                className="mb-5 p-3 border border-terracotta bg-terracotta/10 rounded-sm"
              >
                <Text
                  style={{ color: Colors.danger }}
                  className="text-danger text-sm font-mono"
                >
                  {error}
                </Text>
              </View>
            )}

            {/* Email */}
            <View className="mb-4">
              <Text
                style={{ color: Colors.inkPrimary }}
                className="text-ink-primary font-mono text-xs uppercase tracking-widest font-bold mb-2"
              >{ui("Email Address")}</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="user@example.com"
                placeholderTextColor={Colors.inkSecondary + '99'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                style={{
                  backgroundColor: Colors.field,
                  borderColor: Colors.edge,
                  borderWidth: 1,
                  color: Colors.inkPrimary,
                }}
                className="bg-field border border-edge text-ink-primary text-xs font-mono px-3 py-3 rounded-sm"
              />
            </View>

            {/* Password */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  style={{ color: Colors.inkPrimary }}
                  className="text-ink-primary font-mono text-xs uppercase tracking-widest font-bold"
                >{ui("Password")}</Text>
                <Link
                  href="/(auth)/forgot-password"
                  style={{ color: Colors.inkSecondary }}
                  className="text-ink-secondary text-xs font-mono underline"
                >{ui("Forgot?")}{" "}</Link>
              </View>
              <View className="relative">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••••••"
                  placeholderTextColor={Colors.inkSecondary + '99'}
                  secureTextEntry={!showPassword}
                  autoComplete="current-password"
                  style={{
                    backgroundColor: Colors.field,
                    borderColor: Colors.edge,
                    borderWidth: 1,
                    color: Colors.inkPrimary,
                  }}
                  className="bg-field border border-edge text-ink-primary text-xs font-mono px-3 py-3 rounded-sm pr-14"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-0 bottom-0 justify-center px-1"
                >
                  <Text
                    style={{ color: Colors.inkSecondary }}
                    className="text-ink-secondary text-xs font-mono"
                  >
                    {showPassword ? ui('HIDE') : ui('SHOW')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={{ backgroundColor: Colors.gold }}
              className="bg-gold py-3.5 items-center justify-center rounded-sm flex-row gap-2"
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#101415" />
              ) : null}
              <Text
                style={{ color: Colors.canvas }}
                className="text-canvas font-bold text-sm uppercase tracking-widest"
              >
                {loading ? ui('AUTHENTICATING...') : ui('SIGN IN')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer link */}
          <View className="mt-5 items-center flex-row justify-center gap-1">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="text-ink-secondary text-xs font-mono"
            >{ui("Don't have an account?")}</Text>
            <Link
              href="/(auth)/register"
              style={{ color: Colors.inkPrimary }}
              className="text-ink-primary text-xs font-mono font-bold underline"
            >{ui("Create account")}{" "}</Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

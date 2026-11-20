/**
 * Gateway Mobile — Register Screen
 * Based on gateway-fe/src/app/register/page.tsx
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
import { authApi, ApiError } from '../../lib/api';
import { GatewayLogo } from '../../components/GatewayLogo';
import { Colors } from '../../lib/theme';

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await authApi.register(fullName.trim(), email.trim(), password);
      router.replace({
        pathname: '/(auth)/login',
        params: { registered: 'true', email: email.trim().toLowerCase() },
      });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to create account. Please check your inputs.';
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
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo */}
          <View className="items-center mb-10">
            <GatewayLogo size={48} />
            <Text
              style={{ color: Colors.inkPrimary }}
              className="text-ink-primary font-bold text-3xl tracking-tighter mt-3"
            >
              GATEWAY
            </Text>
            <Text
              style={{ color: Colors.inkSecondary }}
              className="text-ink-secondary text-xs tracking-widest uppercase font-mono mt-1"
            >
              The Live Experience
            </Text>
          </View>

          {/* Auth Panel */}
          <View
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.line,
              borderWidth: 1,
            }}
            className="bg-surface border border-line rounded-sm p-6"
          >
            <View
              style={{ borderBottomColor: Colors.edge + '33', borderBottomWidth: 1 }}
              className="pb-4 mb-5 border-b border-edge/20"
            >
              <Text
                style={{ color: Colors.inkPrimary }}
                className="text-ink-primary font-bold text-2xl tracking-tight"
              >
                Register with Gateway
              </Text>
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

            {/* Full Name */}
            <View className="mb-4">
              <Text
                style={{ color: Colors.inkPrimary }}
                className="text-ink-primary font-mono text-xs uppercase tracking-widest font-bold mb-2"
              >
                Legal Full Name
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Galih Pratama"
                placeholderTextColor={Colors.inkSecondary + '99'}
                autoCapitalize="words"
                autoComplete="name"
                style={{
                  backgroundColor: Colors.field,
                  borderColor: Colors.edge,
                  borderWidth: 1,
                  color: Colors.inkPrimary,
                }}
                className="bg-field border border-edge text-ink-primary text-xs font-mono px-3 py-3 rounded-sm"
              />
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text
                style={{ color: Colors.inkPrimary }}
                className="text-ink-primary font-mono text-xs uppercase tracking-widest font-bold mb-2"
              >
                Email Address
              </Text>
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
            <View className="mb-4">
              <Text
                style={{ color: Colors.inkPrimary }}
                className="text-ink-primary font-mono text-xs uppercase tracking-widest font-bold mb-2"
              >
                Create Password
              </Text>
              <View className="relative">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={Colors.inkSecondary + '99'}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
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
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View className="mb-6">
              <Text
                style={{ color: Colors.inkPrimary }}
                className="text-ink-primary font-mono text-xs uppercase tracking-widest font-bold mb-2"
              >
                Confirm Password
              </Text>
              <View className="relative">
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter password"
                  placeholderTextColor={Colors.inkSecondary + '99'}
                  secureTextEntry={!showConfirm}
                  autoComplete="new-password"
                  style={{
                    backgroundColor: Colors.field,
                    borderColor: Colors.edge,
                    borderWidth: 1,
                    color: Colors.inkPrimary,
                  }}
                  className="bg-field border border-edge text-ink-primary text-xs font-mono px-3 py-3 rounded-sm pr-14"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-0 bottom-0 justify-center px-1"
                >
                  <Text
                    style={{ color: Colors.inkSecondary }}
                    className="text-ink-secondary text-xs font-mono"
                  >
                    {showConfirm ? 'HIDE' : 'SHOW'}
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
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="mt-5 items-center flex-row justify-center gap-1">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="text-ink-secondary text-xs font-mono"
            >
              Already have an account?
            </Text>
            <Link
              href="/(auth)/login"
              style={{ color: Colors.inkPrimary }}
              className="text-ink-primary text-xs font-mono font-bold underline"
            >
              Sign In
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

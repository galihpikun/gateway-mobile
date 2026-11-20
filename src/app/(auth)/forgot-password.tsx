/**
 * Gateway Mobile — Forgot Password Screen
 * Step 1: Enter email
 * Step 2: Enter OTP code
 * Step 3: Set new password
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
import { useRouter } from 'expo-router';
import { authApi, ApiError } from '../../lib/api';
import { GatewayLogo } from '../../components/GatewayLogo';
import { Colors } from '../../lib/theme';

type Step = 'email' | 'otp' | 'reset' | 'done';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSuccess('OTP code has been sent to your email.');
      setStep('otp');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Failed to send OTP. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!code.trim()) {
      setError('Please enter the OTP code.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.verifyForgotPassword(email.trim().toLowerCase(), code.trim());
      setSuccess('OTP verified. Set your new password.');
      setStep('reset');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Invalid or expired OTP.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.resetPassword(email.trim().toLowerCase(), code.trim(), newPassword);
      setStep('done');
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to reset password.',
      );
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
          <View className="items-center mb-10">
            <GatewayLogo size={48} />
            <Text
              style={{ color: Colors.inkPrimary }}
              className="text-ink-primary font-bold text-3xl tracking-tighter mt-3"
            >
              GATEWAY
            </Text>
          </View>

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
                {step === 'done' ? 'Password Reset' : 'Forgot Password'}
              </Text>
              <Text
                style={{ color: Colors.inkSecondary }}
                className="text-ink-secondary text-xs font-mono mt-1"
              >
                {step === 'email' && 'Enter your email to receive an OTP code.'}
                {step === 'otp' && 'Enter the 6-digit code sent to your email.'}
                {step === 'reset' && 'Set your new password.'}
                {step === 'done' && 'Your password has been reset successfully.'}
              </Text>
            </View>

            {error && (
              <View
                style={{
                  backgroundColor: Colors.terracotta + '1A',
                  borderColor: Colors.terracotta,
                  borderWidth: 1,
                }}
                className="mb-4 p-3 border border-terracotta bg-terracotta/10 rounded-sm"
              >
                <Text
                  style={{ color: Colors.danger }}
                  className="text-danger text-sm font-mono"
                >
                  {error}
                </Text>
              </View>
            )}
            {success && step !== 'email' && (
              <View
                style={{
                  backgroundColor: Colors.gold + '1A',
                  borderColor: Colors.gold,
                  borderWidth: 1,
                }}
                className="mb-4 p-3 border border-gold bg-gold/10 rounded-sm"
              >
                <Text
                  style={{ color: Colors.gold }}
                  className="text-gold text-sm font-mono"
                >
                  {success}
                </Text>
              </View>
            )}

            {step === 'email' && (
              <>
                <View className="mb-5">
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
                    style={{
                      backgroundColor: Colors.field,
                      borderColor: Colors.edge,
                      borderWidth: 1,
                      color: Colors.inkPrimary,
                    }}
                    className="bg-field border border-edge text-ink-primary text-xs font-mono px-3 py-3 rounded-sm"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSendCode}
                  disabled={loading}
                  style={{ backgroundColor: Colors.gold }}
                  className="bg-gold py-3.5 items-center rounded-sm"
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#101415" />
                  ) : (
                    <Text
                      style={{ color: Colors.canvas }}
                      className="text-canvas font-bold text-sm uppercase tracking-widest"
                    >
                      SEND OTP CODE
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 'otp' && (
              <>
                <View className="mb-5">
                  <Text
                    style={{ color: Colors.inkPrimary }}
                    className="text-ink-primary font-mono text-xs uppercase tracking-widest font-bold mb-2"
                  >
                    OTP Code
                  </Text>
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="123456"
                    placeholderTextColor={Colors.inkSecondary + '99'}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={{
                      backgroundColor: Colors.field,
                      borderColor: Colors.edge,
                      borderWidth: 1,
                      color: Colors.inkPrimary,
                    }}
                    className="bg-field border border-edge text-ink-primary text-xs font-mono px-3 py-3 rounded-sm tracking-widest"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  style={{ backgroundColor: Colors.gold }}
                  className="bg-gold py-3.5 items-center rounded-sm"
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#101415" />
                  ) : (
                    <Text
                      style={{ color: Colors.canvas }}
                      className="text-canvas font-bold text-sm uppercase tracking-widest"
                    >
                      VERIFY CODE
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 'reset' && (
              <>
                <View className="mb-4">
                  <Text
                    style={{ color: Colors.inkPrimary }}
                    className="text-ink-primary font-mono text-xs uppercase tracking-widest font-bold mb-2"
                  >
                    New Password
                  </Text>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Minimum 6 characters"
                    placeholderTextColor={Colors.inkSecondary + '99'}
                    secureTextEntry
                    style={{
                      backgroundColor: Colors.field,
                      borderColor: Colors.edge,
                      borderWidth: 1,
                      color: Colors.inkPrimary,
                    }}
                    className="bg-field border border-edge text-ink-primary text-xs font-mono px-3 py-3 rounded-sm"
                  />
                </View>
                <View className="mb-5">
                  <Text
                    style={{ color: Colors.inkPrimary }}
                    className="text-ink-primary font-mono text-xs uppercase tracking-widest font-bold mb-2"
                  >
                    Confirm Password
                  </Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter password"
                    placeholderTextColor={Colors.inkSecondary + '99'}
                    secureTextEntry
                    style={{
                      backgroundColor: Colors.field,
                      borderColor: Colors.edge,
                      borderWidth: 1,
                      color: Colors.inkPrimary,
                    }}
                    className="bg-field border border-edge text-ink-primary text-xs font-mono px-3 py-3 rounded-sm"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={loading}
                  style={{ backgroundColor: Colors.gold }}
                  className="bg-gold py-3.5 items-center rounded-sm"
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#101415" />
                  ) : (
                    <Text
                      style={{ color: Colors.canvas }}
                      className="text-canvas font-bold text-sm uppercase tracking-widest"
                    >
                      RESET PASSWORD
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 'done' && (
              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login')}
                style={{ backgroundColor: Colors.gold }}
                className="bg-gold py-3.5 items-center rounded-sm"
                activeOpacity={0.85}
              >
                <Text
                  style={{ color: Colors.canvas }}
                  className="text-canvas font-bold text-sm uppercase tracking-widest"
                >
                  SIGN IN NOW
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="mt-5 items-center">
            <TouchableOpacity onPress={() => router.back()}>
              <Text
                style={{ color: Colors.inkSecondary }}
                className="text-ink-secondary text-xs font-mono underline"
              >
                ← Back to Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

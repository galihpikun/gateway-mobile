import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useColors, usePreferences } from '../context/Preferences';

export const message = (error: unknown) => error instanceof Error ? error.message : 'Gateway tidak dapat memproses permintaan.';
export const rupiah = (value: number | string) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value));

export function useResource<T>(fetcher: () => Promise<T>, enabled = true) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(enabled);
  const [revision, setRevision] = useState(0);
  useFocusEffect(useCallback(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);
    setError('');
    fetcher().then(result => { if (active) setData(result); })
      .catch(failure => { if (active) setError(message(failure)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // Reloading changes the focus effect identity and repeats the request.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetcher, revision]));
  return { data, error, loading, reload: () => setRevision(previous => previous + 1) };
}

export function Screen({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  const { tr } = usePreferences();
  return <SafeAreaView className="flex-1 bg-canvas">
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: 40, gap: 14, width: '100%', maxWidth: 760, alignSelf: 'center' }}>
      <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} className="min-h-[44px] justify-center">
        <Text className="text-gold font-bold">{tr('‹ Kembali', '‹ Back')}</Text>
      </Pressable>
      <Text accessibilityRole="header" className="text-ink-primary text-3xl font-bold" style={{ marginBottom: 6 }}>{title}</Text>
      {children}
    </ScrollView>
  </SafeAreaView>;
}

export function Panel({ children }: { children: ReactNode }) {
  return <View className="bg-surface border border-line rounded-md p-4 gap-3">{children}</View>;
}

export function Copy({ children, bold = false }: { children: ReactNode; bold?: boolean }) {
  return <Text className={bold ? 'font-bold text-base text-ink-primary' : 'text-sm text-ink-secondary leading-5'}>{children}</Text>;
}

export function Action({ label, onPress, disabled, quiet }: { label: string; onPress: () => void; disabled?: boolean; quiet?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    className={(quiet ? 'bg-panel border border-edge' : 'bg-gold') + ' min-h-[46px] rounded-sm px-3 py-2 items-center justify-center' + (disabled ? ' opacity-50' : '')}>
    <Text className={quiet ? 'text-ink-primary font-bold text-center' : 'text-action-ink font-bold text-center'}>{label}</Text>
  </Pressable>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const colors = useColors();
  return <View className="gap-1">
    <Text className="text-ink-primary text-sm font-semibold">{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={colors.inkSecondary} {...props}
      className="bg-field border border-edge text-ink-primary text-base rounded-sm min-h-[46px] px-3 py-2" />
  </View>;
}

export function Feedback({ busy, error }: { busy?: boolean; error?: string }) {
  const colors = useColors();
  return <>{busy && <ActivityIndicator color={colors.gold} />}{!!error && <Text accessibilityRole="alert" className="text-danger text-sm">{error}</Text>}</>;
}

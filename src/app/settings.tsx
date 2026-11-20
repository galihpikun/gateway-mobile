import { Pressable, ScrollView, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useColors, usePreferences } from '../context/Preferences';
import { Icon, type IconName } from '../components/Icon';

type Option<Value extends string> = { value: Value; label: string; icon: IconName };

function SettingGroup<Value extends string>({ title, options, value, onChange }: {
  title: string;
  options: Option<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}) {
  const colors = useColors();
  return (
    <View className="gap-2.5">
      <Text accessibilityRole="header" className="text-ink-primary text-lg font-bold">{title}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={title} className="bg-surface border border-line rounded-xl overflow-hidden">
        {options.map((option, index) => {
          const selected = option.value === value;
          return (
            <Pressable key={option.value} accessibilityRole="radio" aria-checked={selected}
              onPress={() => onChange(option.value)}
              className={'flex-row items-center gap-3 min-h-16 px-4 py-3' + (index ? ' border-t border-line' : '')}
              style={({ pressed }) => ({ backgroundColor: pressed || selected ? colors.highlight : colors.surface })}>
              <Icon name={option.icon} color={selected ? colors.gold : colors.inkSecondary} />
              <Text className="flex-1 text-ink-primary text-base font-semibold">{option.label}</Text>
              <View className="w-5 h-5 rounded-full border items-center justify-center"
                style={{ borderColor: selected ? colors.gold : colors.edge }}>
                {selected && <View className="w-2.5 h-2.5 rounded-full bg-gold" />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme, language, setLanguage, setTheme, tr } = usePreferences();
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScrollView contentContainerStyle={{ width: '100%', maxWidth: 600, alignSelf: 'center', gap: 22, paddingHorizontal: 20, paddingBottom: 32 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('Kembali ke profil', 'Back to profile')}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/profile')}
          className="min-h-12 self-start flex-row items-center gap-1">
          <Icon name="back" size={19} />
          <Text className="text-ink-secondary text-sm font-semibold">{tr('Profil', 'Profile')}</Text>
        </Pressable>
        <Text accessibilityRole="header" className="text-ink-primary text-3xl font-bold tracking-tight">{tr('Pengaturan', 'Settings')}</Text>
        <SettingGroup title={tr('Bahasa', 'Language')} value={language} onChange={setLanguage}
          options={[{ value: 'id', label: 'Bahasa Indonesia', icon: 'globe' }, { value: 'en', label: 'English', icon: 'globe' }]} />
        <SettingGroup title={tr('Tema', 'Theme')} value={theme} onChange={setTheme}
          options={[{ value: 'light', label: tr('Terang', 'Light'), icon: 'sun' }, { value: 'dark', label: tr('Gelap', 'Dark'), icon: 'moon' }]} />
      </ScrollView>
    </SafeAreaView>
  );
}

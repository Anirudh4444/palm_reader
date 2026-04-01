import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await login(email.trim(), password);
    setIsLoading(false);
    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || 'Login failed');
    }
  };

  return (
    <LinearGradient colors={['#0A0415', '#12082A', '#1A0D35']} style={styles.container}>
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={Colors.dark.textSecondary} />
            </Pressable>
          </Animated.View>

          {/* Language selector */}
          <Animated.View entering={FadeInDown.delay(150)} style={styles.langRow}>
            {(['en', 'hi', 'te'] as const).map(lang => (
              <Pressable key={lang} onPress={() => setLanguage(lang)} style={[styles.langBtn, language === lang && styles.langBtnActive]}>
                <Text style={[styles.langBtnText, language === lang && styles.langBtnTextActive]}>
                  {lang === 'en' ? 'EN' : lang === 'hi' ? 'हि' : 'తె'}
                </Text>
              </Pressable>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.header}>
            <Text style={styles.emoji}>🖐</Text>
            <Text style={styles.title}>{t('loginTitle')}</Text>
            <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.form}>
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.dark.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('email')}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={Colors.dark.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.dark.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('password')}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.dark.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.dark.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.dark.textTertiary} />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, isLoading && styles.disabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient colors={['#C9902A', '#E8B840']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
                {isLoading
                  ? <ActivityIndicator color="#0A0415" />
                  : <Text style={styles.primaryBtnText}>{t('login')}</Text>
                }
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500)} style={styles.footer}>
            <Text style={styles.footerText}>{t('noAccount')}</Text>
            <Pressable onPress={() => router.replace('/(auth)/signup')}>
              <Text style={styles.footerLink}> {t('signup')}</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 28, flexGrow: 1 },
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: { width: 250, height: 250, top: -60, right: -60, backgroundColor: 'rgba(123,63,219,0.12)' },
  orb2: { width: 180, height: 180, bottom: 80, left: -50, backgroundColor: 'rgba(201,144,42,0.10)' },
  backBtn: { width: 44, height: 44, justifyContent: 'center', marginBottom: 8 },
  langRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  langBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.dark.borderLight },
  langBtnActive: { backgroundColor: Colors.dark.accentDim, borderColor: Colors.dark.gold },
  langBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.dark.textTertiary },
  langBtnTextActive: { color: Colors.dark.gold },
  header: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 30, fontFamily: 'Inter_700Bold', color: Colors.dark.text, marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, textAlign: 'center' },
  form: { gap: 20 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(232,85,85,0.12)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(232,85,85,0.3)' },
  errorText: { color: Colors.dark.error, fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.dark.textSecondary, letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.inputBackground, borderRadius: 14, borderWidth: 1, borderColor: Colors.dark.border, paddingHorizontal: 14, height: 56 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.dark.text },
  inputFlex: { flex: 1 },
  eyeBtn: { padding: 4 },
  primaryButton: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  gradientBtn: { paddingVertical: 18, alignItems: 'center', borderRadius: 16 },
  primaryBtnText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#0A0415' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary },
  footerLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.dark.gold },
});

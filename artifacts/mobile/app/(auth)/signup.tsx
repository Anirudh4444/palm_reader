import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
import { ALL_LANGUAGES, useLanguage } from '@/context/LanguageContext';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { signup } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLangModal, setShowLangModal] = useState(false);

  const selectedLang = ALL_LANGUAGES.find(l => l.code === language) ?? ALL_LANGUAGES[0];

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await signup(name.trim(), email.trim(), password, dob, gender);
    setIsLoading(false);
    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || 'Signup failed');
    }
  };

  return (
    <LinearGradient colors={['#0A0415', '#12082A', '#1A0D35']} style={styles.container}>
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={Colors.dark.textSecondary} />
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150)} style={styles.langRow}>
            <Pressable
              style={styles.langPickerBtn}
              onPress={() => setShowLangModal(true)}
            >
              <Text style={styles.langFlag}>{selectedLang.flag}</Text>
              <Text style={styles.langNative}>{selectedLang.native}</Text>
              <Ionicons name="chevron-down" size={14} color={Colors.dark.gold} />
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.header}>
            <Text style={styles.emoji}>✨</Text>
            <Text style={styles.title}>{t('signupTitle')}</Text>
            <Text style={styles.subtitle}>{t('signupSubtitle')}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.form}>
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.dark.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('name')} *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={Colors.dark.textTertiary} style={styles.inputIcon} />
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor={Colors.dark.textTertiary} autoCapitalize="words" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('email')} *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={Colors.dark.textTertiary} style={styles.inputIcon} />
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={Colors.dark.textTertiary} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('password')} *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.dark.textTertiary} style={styles.inputIcon} />
                <TextInput style={[styles.input, styles.inputFlex]} value={password} onChangeText={setPassword} placeholder="Min. 6 characters" placeholderTextColor={Colors.dark.textTertiary} secureTextEntry={!showPassword} autoCapitalize="none" />
                <Pressable onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.dark.textTertiary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('dob')}</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="calendar-outline" size={18} color={Colors.dark.textTertiary} style={styles.inputIcon} />
                <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="DD/MM/YYYY" placeholderTextColor={Colors.dark.textTertiary} keyboardType="numeric" maxLength={10} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('gender')}</Text>
              <View style={styles.genderRow}>
                {(['male', 'female', 'other'] as const).map(g => (
                  <Pressable key={g} onPress={() => setGender(g)} style={[styles.genderBtn, gender === g && styles.genderBtnActive]}>
                    <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>{t(g)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, isLoading && styles.disabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <LinearGradient colors={['#C9902A', '#E8B840']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtn}>
                {isLoading
                  ? <ActivityIndicator color="#0A0415" />
                  : <Text style={styles.primaryBtnText}>{t('signup')}</Text>
                }
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500)} style={styles.footer}>
            <Text style={styles.footerText}>{t('hasAccount')}</Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.footerLink}> {t('login')}</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showLangModal} animationType="slide" transparent onRequestClose={() => setShowLangModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('chooseLang')}</Text>
              <Pressable onPress={() => setShowLangModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={Colors.dark.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>{t('selectLangSubtitle')}</Text>
            <FlatList
              data={ALL_LANGUAGES}
              keyExtractor={item => item.code}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.langList}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.langItem, language === item.code && styles.langItemActive]}
                  onPress={() => {
                    setLanguage(item.code);
                    setShowLangModal(false);
                  }}
                >
                  <Text style={styles.langItemFlag}>{item.flag}</Text>
                  <View style={styles.langItemText}>
                    <Text style={[styles.langItemNative, language === item.code && styles.langItemNativeActive]}>{item.native}</Text>
                    <Text style={styles.langItemEnglish}>{item.english}</Text>
                  </View>
                  {language === item.code && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.dark.gold} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
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
  langRow: { marginBottom: 20 },
  langPickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    backgroundColor: Colors.dark.accentDim, borderWidth: 1, borderColor: Colors.dark.gold,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  langFlag: { fontSize: 18 },
  langNative: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.dark.gold },
  header: { alignItems: 'center', marginBottom: 32 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 30, fontFamily: 'Inter_700Bold', color: Colors.dark.text, marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, textAlign: 'center' },
  form: { gap: 18 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(232,85,85,0.12)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(232,85,85,0.3)' },
  errorText: { color: Colors.dark.error, fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.dark.textSecondary, letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.inputBackground, borderRadius: 14, borderWidth: 1, borderColor: Colors.dark.border, paddingHorizontal: 14, height: 56 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.dark.text },
  inputFlex: { flex: 1 },
  eyeBtn: { padding: 4 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border, alignItems: 'center', backgroundColor: Colors.dark.inputBackground },
  genderBtnActive: { backgroundColor: Colors.dark.accentDim, borderColor: Colors.dark.gold },
  genderBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.dark.textTertiary },
  genderBtnTextActive: { color: Colors.dark.gold },
  primaryButton: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  gradientBtn: { paddingVertical: 18, alignItems: 'center', borderRadius: 16 },
  primaryBtnText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#0A0415' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary },
  footerLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.dark.gold },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: {
    backgroundColor: '#12082A', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '80%', paddingTop: 16,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 4 },
  modalTitle: { flex: 1, fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.dark.text },
  modalClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  modalSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, paddingHorizontal: 24, paddingBottom: 12 },
  langList: { paddingHorizontal: 16, paddingBottom: 40 },
  langItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 14, marginBottom: 4,
  },
  langItemActive: { backgroundColor: 'rgba(201,144,42,0.12)', borderWidth: 1, borderColor: 'rgba(201,144,42,0.3)' },
  langItemFlag: { fontSize: 26 },
  langItemText: { flex: 1 },
  langItemNative: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.dark.text },
  langItemNativeActive: { color: Colors.dark.gold },
  langItemEnglish: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.dark.textTertiary },
});

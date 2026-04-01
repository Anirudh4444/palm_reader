import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading]);

  if (isLoading) return null;
  if (user) return null;

  const topPad = Platform.OS === 'web' ? 80 : (insets.top + 40);
  const bottomPad = Platform.OS === 'web' ? 50 : (insets.bottom + 40);

  return (
    <LinearGradient
      colors={['#0A0415', '#12082A', '#1A0D35']}
      style={styles.container}
    >
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPad, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.logoSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>🖐</Text>
            <View style={styles.iconGlow} />
          </View>
          <Text style={styles.appName}>{t('appName')}</Text>
          <Text style={styles.tagline}>{t('tagline')}</Text>
        </Animated.View>

        <View style={styles.featuresSection}>
          <FeatureRow icon="✦" text="Indian Mythology & Vedic Astrology" />
          <FeatureRow icon="✦" text="AI Palm Line Analysis" />
          <FeatureRow icon="✦" text="English | हिंदी | తెలుగు" />
        </View>

        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={() => router.push('/(auth)/signup')}
          >
            <LinearGradient
              colors={['#C9902A', '#E8B840']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.primaryButtonText}>{t('getStarted')}</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.secondaryButtonText}>{t('hasAccount')} <Text style={styles.loginLink}>{t('login')}</Text></Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 300,
    height: 300,
    top: -80,
    right: -80,
    backgroundColor: 'rgba(123,63,219,0.15)',
  },
  orb2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -60,
    backgroundColor: 'rgba(201,144,42,0.12)',
  },
  orb3: {
    width: 150,
    height: 150,
    top: height * 0.4,
    right: 20,
    backgroundColor: 'rgba(123,63,219,0.08)',
  },
  scrollContent: {
    paddingHorizontal: 28,
    flexGrow: 1,
    gap: 40,
  },
  logoSection: {
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconEmoji: {
    fontSize: 72,
  },
  iconGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(201,144,42,0.15)',
  },
  appName: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    color: Colors.dark.gold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  featuresSection: {
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  featureIcon: {
    fontSize: 14,
    color: Colors.dark.gold,
  },
  featureText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.dark.text,
    flex: 1,
  },
  buttons: {
    gap: 16,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: '#0A0415',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.dark.textSecondary,
  },
  loginLink: {
    color: Colors.dark.gold,
    fontFamily: 'Inter_600SemiBold',
  },
  pressed: {
    opacity: 0.85,
  },
});

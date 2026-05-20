import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useReadings } from '@/context/ReadingsContext';

const { width } = Dimensions.get('window');

const LINE_FACT_KEYS = [
  { key: 'lifeLine', icon: 'heart-pulse', color: '#E85555', descKey: 'lifeLineDesc' },
  { key: 'heartLine', icon: 'heart', color: '#E87070', descKey: 'heartLineDesc' },
  { key: 'headLine', icon: 'brain', color: '#9B5FE8', descKey: 'headLineDesc' },
  { key: 'fateLine', icon: 'star-four-points', color: '#E8B840', descKey: 'fateLineDesc' },
  { key: 'sunLine', icon: 'white-balance-sunny', color: '#E8D040', descKey: 'sunLineDesc' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { readings } = useReadings();

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <LinearGradient colors={['#0A0415', '#12082A']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: insets.bottom + 100 }}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('greeting')}</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] ?? 'Seeker'}</Text>
          </View>
          <View style={styles.headerDecor}>
            <Text style={styles.headerEmoji}>🌙</Text>
          </View>
        </Animated.View>

        {/* Main Scan Button */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.scanCard}>
          <LinearGradient
            colors={['#251350', '#3A1870']}
            style={styles.scanCardInner}
          >
            <View style={styles.scanCardOrb} />
            <View style={styles.scanIconWrap}>
              <Text style={styles.scanEmoji}>🖐</Text>
              <View style={styles.scanGlow} />
            </View>
            <Text style={styles.scanTitle}>{t('scanPalm')}</Text>
            <Text style={styles.scanSubtitle}>{t('palmInstructions')}</Text>
            <Pressable
              style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/scan');
              }}
            >
              <LinearGradient colors={['#C9902A', '#E8B840']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.scanButtonGrad}>
                <Ionicons name="camera" size={18} color="#0A0415" />
                <Text style={styles.scanButtonText}>{t('uploadPalm')}</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </Animated.View>

        {/* Recent Reading */}
        {readings.length > 0 && (
          <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('recentReading')}</Text>
            <Pressable
              style={({ pressed }) => [styles.recentCard, pressed && styles.pressed]}
              onPress={() => router.push(`/reading/${readings[0].id}`)}
            >
              <View style={styles.recentCardContent}>
                <View style={styles.recentCardLeft}>
                  <Text style={styles.recentCardEmoji}>✋</Text>
                  <View>
                    <Text style={styles.recentCardTitle}>{t('analysisTitle')}</Text>
                    <Text style={styles.recentCardDate}>
                      {new Date(readings[0].createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.dark.textTertiary} />
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Palm Lines Guide */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('palmLinesGuide')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.linesRow}>
            {LINE_FACT_KEYS.map(line => (
              <View key={line.key} style={styles.lineCard}>
                <View style={[styles.lineIconWrap, { backgroundColor: line.color + '22' }]}>
                  <MaterialCommunityIcons name={line.icon as any} size={22} color={line.color} />
                </View>
                <Text style={styles.lineTitle}>{t(line.key)}</Text>
                <Text style={styles.lineDesc}>{t(line.descKey)}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Mythology */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('mythology')}</Text>
          <View style={styles.mythCard}>
            <LinearGradient colors={['#1A0D35', '#251350']} style={styles.mythCardInner}>
              <Text style={styles.mythEmoji}>🕉️</Text>
              <Text style={styles.mythTitle}>{t('hastaMythTitle')}</Text>
              <Text style={styles.mythText}>{t('hastaMythText')}</Text>
            </LinearGradient>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
  greeting: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, letterSpacing: 1 },
  userName: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.dark.text },
  headerDecor: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.card, borderRadius: 24, borderWidth: 1, borderColor: Colors.dark.border },
  headerEmoji: { fontSize: 22 },
  scanCard: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: Colors.dark.borderLight },
  scanCardInner: { padding: 28, alignItems: 'center', gap: 12 },
  scanCardOrb: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(201,144,42,0.08)', top: -60, right: -60 },
  scanIconWrap: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  scanEmoji: { fontSize: 58 },
  scanGlow: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(201,144,42,0.12)' },
  scanTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.dark.text },
  scanSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, textAlign: 'center', lineHeight: 20 },
  scanButton: { borderRadius: 14, overflow: 'hidden', width: '100%', marginTop: 4 },
  scanButtonGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8, borderRadius: 14 },
  scanButtonText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0A0415' },
  section: { marginHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.dark.textSecondary, marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  recentCard: { backgroundColor: Colors.dark.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border },
  recentCardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  recentCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentCardEmoji: { fontSize: 28 },
  recentCardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.dark.text },
  recentCardDate: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.dark.textTertiary, marginTop: 2 },
  linesRow: { gap: 12, paddingRight: 20 },
  lineCard: { width: 140, backgroundColor: Colors.dark.card, borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: Colors.dark.border },
  lineIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lineTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.dark.text },
  lineDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, lineHeight: 16 },
  mythCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: Colors.dark.border },
  mythCardInner: { padding: 24, gap: 12 },
  mythEmoji: { fontSize: 36 },
  mythTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.dark.gold },
  mythText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, lineHeight: 22 },
  pressed: { opacity: 0.8 },
});

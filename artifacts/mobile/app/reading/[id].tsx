import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { useLanguage } from '@/context/LanguageContext';
import { useReadings } from '@/context/ReadingsContext';

type LineCardData = {
  key: string;
  icon: string;
  iconLib: 'ionicons' | 'mci';
  color: string;
  label: string;
  content: string;
};

export default function ReadingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { getReadingById } = useReadings();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const reading = getReadingById(id as string);
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  if (!reading) {
    return (
      <LinearGradient colors={['#0A0415', '#12082A']} style={styles.container}>
        <View style={[styles.centerWrap, { paddingTop: topPadding + 60 }]}>
          <Text style={styles.notFoundText}>Reading not found</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn2}>
            <Text style={styles.backBtn2Text}>Go Back</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const { analysis } = reading;

  const palmLines: LineCardData[] = [
    { key: 'lifeLine', icon: 'heart-pulse', iconLib: 'mci', color: '#E85555', label: t('lifeLine'), content: analysis.lifeLine },
    { key: 'heartLine', icon: 'heart', iconLib: 'mci', color: '#E87070', label: t('heartLine'), content: analysis.heartLine },
    { key: 'headLine', icon: 'brain', iconLib: 'mci', color: '#9B5FE8', label: t('headLine'), content: analysis.headLine },
    { key: 'fateLine', icon: 'star-four-points', iconLib: 'mci', color: '#E8B840', label: t('fateLine'), content: analysis.fateLine },
    { key: 'sunLine', icon: 'white-balance-sunny', iconLib: 'mci', color: '#E8D040', label: t('sunLine'), content: analysis.sunLine },
    { key: 'mountVenus', icon: 'planet', iconLib: 'ionicons', color: '#E84488', label: t('mountVenus'), content: analysis.mountVenus },
  ];

  const insights = [
    { key: 'personality', icon: 'person', color: '#7B3FDB', label: t('personality'), content: analysis.personality },
    { key: 'career', icon: 'briefcase', color: '#E8B840', label: t('career'), content: analysis.career },
    { key: 'love', icon: 'heart', color: '#E85555', label: t('love'), content: analysis.love },
    { key: 'health', icon: 'fitness', color: '#55C18A', label: t('health'), content: analysis.health },
    { key: 'spiritual', icon: 'sparkles', color: '#9B5FE8', label: t('spiritual'), content: analysis.spiritual },
  ];

  const toggleSection = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSection(prev => prev === key ? null : key);
  };

  return (
    <LinearGradient colors={['#0A0415', '#12082A']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: insets.bottom + 40 }}
      >
        <Animated.View entering={FadeIn.delay(100)}>
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={Colors.dark.textSecondary} />
            </Pressable>
            <Text style={styles.topTitle}>{t('analysisTitle')}</Text>
            <View style={{ width: 44 }} />
          </View>
        </Animated.View>

        {/* Palm image + overview */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.overviewCard}>
          <LinearGradient colors={['#1A0D35', '#251350']} style={styles.overviewCardInner}>
            <View style={styles.overviewTop}>
              {reading.imageUri ? (
                <Image source={{ uri: reading.imageUri }} style={styles.palmThumb} />
              ) : (
                <View style={styles.palmThumbPlaceholder}><Text style={{ fontSize: 36 }}>🖐</Text></View>
              )}
              <View style={styles.overviewMeta}>
                <View style={styles.handBadge}>
                  <Text style={styles.handBadgeText}>{reading.hand === 'left' ? t('left') : t('right')}</Text>
                </View>
                <Text style={styles.overviewDate}>
                  {new Date(reading.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
                {reading.dob && (
                  <Text style={styles.overviewDob}>Born: {reading.dob}</Text>
                )}
              </View>
            </View>
            <View style={styles.overviewDivider} />
            <Text style={styles.overviewTitle}>{t('destiny')}</Text>
            <Text style={styles.overviewText}>{analysis.overview}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Vedic + Mythology */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
          <View style={styles.twoCol}>
            <View style={styles.infoCard}>
              <LinearGradient colors={['#1A0D35', '#251350']} style={styles.infoCardInner}>
                <Text style={styles.infoEmoji}>🕉️</Text>
                <Text style={styles.infoTitle}>{t('vedic')}</Text>
                <Text style={styles.infoText}>{analysis.vedicInsight}</Text>
              </LinearGradient>
            </View>
            <View style={styles.infoCard}>
              <LinearGradient colors={['#1A0D35', '#251350']} style={styles.infoCardInner}>
                <Text style={styles.infoEmoji}>📿</Text>
                <Text style={styles.infoTitle}>{t('mythology')}</Text>
                <Text style={styles.infoText}>{analysis.mythologyInsight}</Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Lucky info */}
        <Animated.View entering={FadeInDown.delay(300)} style={[styles.section, styles.luckyCard]}>
          <LinearGradient colors={['#1A0D35', '#251350']} style={styles.luckyCardInner}>
            <View style={styles.luckyRow}>
              <View style={styles.luckyItem}>
                <Text style={styles.luckyEmoji}>🍀</Text>
                <Text style={styles.luckyLabel}>Lucky Numbers</Text>
                <Text style={styles.luckyValue}>{analysis.luckyNumbers}</Text>
              </View>
              <View style={styles.luckyDivider} />
              <View style={styles.luckyItem}>
                <Text style={styles.luckyEmoji}>🌈</Text>
                <Text style={styles.luckyLabel}>Lucky Colors</Text>
                <Text style={styles.luckyValue}>{analysis.luckyColors}</Text>
              </View>
              <View style={styles.luckyDivider} />
              <View style={styles.luckyItem}>
                <Text style={styles.luckyEmoji}>⭐</Text>
                <Text style={styles.luckyLabel}>Best Time</Text>
                <Text style={styles.luckyValue}>{analysis.favorableTime}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Palm Lines */}
        <Animated.View entering={FadeInDown.delay(350)} style={styles.section}>
          <Text style={styles.sectionTitle}>Palm Lines</Text>
          <View style={styles.linesList}>
            {palmLines.map((line, i) => (
              <Animated.View key={line.key} entering={FadeInDown.delay(400 + i * 60)}>
                <Pressable
                  style={({ pressed }) => [styles.lineCard, pressed && styles.pressed]}
                  onPress={() => toggleSection(line.key)}
                >
                  <LinearGradient colors={['#1A0D35', '#12082A']} style={styles.lineCardInner}>
                    <View style={styles.lineCardTop}>
                      <View style={[styles.lineIconWrap, { backgroundColor: line.color + '22' }]}>
                        {line.iconLib === 'mci'
                          ? <MaterialCommunityIcons name={line.icon as any} size={20} color={line.color} />
                          : <Ionicons name={line.icon as any} size={20} color={line.color} />
                        }
                      </View>
                      <Text style={styles.lineLabel}>{line.label}</Text>
                      <Ionicons
                        name={expandedSection === line.key ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={Colors.dark.textTertiary}
                      />
                    </View>
                    {expandedSection === line.key && (
                      <Text style={styles.lineContent}>{line.content}</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Insights */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Life Insights</Text>
          <View style={styles.linesList}>
            {insights.map((ins, i) => (
              <Animated.View key={ins.key} entering={FadeInDown.delay(550 + i * 60)}>
                <Pressable
                  style={({ pressed }) => [styles.lineCard, pressed && styles.pressed]}
                  onPress={() => toggleSection('ins_' + ins.key)}
                >
                  <LinearGradient colors={['#1A0D35', '#12082A']} style={styles.lineCardInner}>
                    <View style={styles.lineCardTop}>
                      <View style={[styles.lineIconWrap, { backgroundColor: ins.color + '22' }]}>
                        <Ionicons name={ins.icon as any} size={20} color={ins.color} />
                      </View>
                      <Text style={styles.lineLabel}>{ins.label}</Text>
                      <Ionicons
                        name={expandedSection === 'ins_' + ins.key ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={Colors.dark.textTertiary}
                      />
                    </View>
                    {expandedSection === 'ins_' + ins.key && (
                      <Text style={styles.lineContent}>{ins.content}</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Ask Krishna CTA */}
        <Animated.View entering={FadeInDown.delay(700)} style={styles.krishnaSection}>
          <LinearGradient colors={['#1A0D35', '#251350']} style={styles.krishnaCard}>
            <View style={styles.krishnaCardTop}>
              <View style={styles.krishnaIconWrap}>
                <Text style={styles.krishnaEmoji}>🦚</Text>
              </View>
              <View style={styles.krishnaCardText}>
                <Text style={styles.krishnaCardTitle}>Have Doubts?</Text>
                <Text style={styles.krishnaCardSub}>Seek wisdom from Lord Krishna about your reading</Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.krishnaBtn, pressed && styles.pressed]}
              onPress={() => router.push(`/chat/${reading.id}`)}
            >
              <LinearGradient colors={['#C9902A', '#E8B840']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.krishnaBtnGrad}>
                <Text style={styles.krishnaBtnEmoji}>🙏</Text>
                <Text style={styles.krishnaBtnText}>Ask Krishna</Text>
                <Ionicons name="chevron-forward" size={18} color="#0A0415" />
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },
  notFoundText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.dark.textSecondary },
  backBtn2: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.dark.card, borderRadius: 12 },
  backBtn2Text: { color: Colors.dark.gold, fontFamily: 'Inter_600SemiBold' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  topTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: Colors.dark.text },
  overviewCard: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: Colors.dark.border },
  overviewCardInner: { padding: 20, gap: 12 },
  overviewTop: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  palmThumb: { width: 80, height: 80, borderRadius: 16, backgroundColor: Colors.dark.card },
  palmThumbPlaceholder: { width: 80, height: 80, borderRadius: 16, backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center' },
  overviewMeta: { flex: 1, gap: 6 },
  handBadge: { alignSelf: 'flex-start', backgroundColor: Colors.dark.accentDim, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: Colors.dark.goldDim },
  handBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.dark.gold },
  overviewDate: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary },
  overviewDob: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.dark.textTertiary },
  overviewDivider: { height: 1, backgroundColor: Colors.dark.border },
  overviewTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.dark.gold },
  overviewText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.dark.text, lineHeight: 22 },
  section: { marginHorizontal: 20, marginBottom: 20 },
  twoCol: { flexDirection: 'row', gap: 12 },
  infoCard: { flex: 1, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: Colors.dark.border },
  infoCardInner: { padding: 16, gap: 8 },
  infoEmoji: { fontSize: 24 },
  infoTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.dark.gold },
  infoText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, lineHeight: 18 },
  luckyCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: Colors.dark.border },
  luckyCardInner: { padding: 20 },
  luckyRow: { flexDirection: 'row', alignItems: 'center' },
  luckyItem: { flex: 1, alignItems: 'center', gap: 4 },
  luckyEmoji: { fontSize: 24 },
  luckyLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.dark.textTertiary, textAlign: 'center' },
  luckyValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.dark.text, textAlign: 'center' },
  luckyDivider: { width: 1, height: 40, backgroundColor: Colors.dark.border },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.dark.textSecondary, marginBottom: 12, letterSpacing: 0.8, textTransform: 'uppercase' },
  linesList: { gap: 8 },
  lineCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.dark.border },
  lineCardInner: { padding: 16, gap: 12 },
  lineCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lineIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lineLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.dark.text },
  lineContent: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, lineHeight: 22, paddingTop: 4 },
  pressed: { opacity: 0.8 },
  krishnaSection: { marginHorizontal: 20, marginBottom: 20 },
  krishnaCard: { borderRadius: 24, padding: 20, gap: 16, borderWidth: 1, borderColor: 'rgba(201,144,42,0.3)' },
  krishnaCardTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  krishnaIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(201,144,42,0.15)', borderWidth: 1, borderColor: 'rgba(201,144,42,0.4)', alignItems: 'center', justifyContent: 'center' },
  krishnaEmoji: { fontSize: 28 },
  krishnaCardText: { flex: 1, gap: 4 },
  krishnaCardTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: Colors.dark.gold },
  krishnaCardSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, lineHeight: 18 },
  krishnaBtn: { borderRadius: 14, overflow: 'hidden' },
  krishnaBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8, borderRadius: 14 },
  krishnaBtnEmoji: { fontSize: 18 },
  krishnaBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0A0415', flex: 1, textAlign: 'center' },
});

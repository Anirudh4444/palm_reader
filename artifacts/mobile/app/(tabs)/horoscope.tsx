import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useReadings } from '@/context/ReadingsContext';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

type Horoscope = {
  rashi: string;
  rashiEn: string;
  nakshatra: string;
  overallEnergy: string;
  overallScore: number;
  love: string;
  loveScore: number;
  career: string;
  careerScore: number;
  health: string;
  healthScore: number;
  spiritual: string;
  luckyNumbers: string;
  luckyColors: string;
  luckyTime: string;
  todayMantra: string;
  vedicTip: string;
  planetInfluence: string;
  mythologyMessage: string;
  date: string;
};

const HOROSCOPE_KEY = (userId: string, date: string) => `horoscope_${userId}_${date}`;
const NOTIF_KEY = 'horoscope_notif_enabled';

const RASHI_SYMBOL: Record<string, string> = {
  Mesha: '♈', Vrishabha: '♉', Mithuna: '♊', Karka: '♋',
  Simha: '♌', Kanya: '♍', Tula: '♎', Vrishchika: '♏',
  Dhanu: '♐', Makara: '♑', Kumbha: '♒', Meena: '♓',
};

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <View style={styles.scoreBarBg}>
      <View style={[styles.scoreBarFill, { width: `${(score / 10) * 100}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function SectionCard({
  emoji, title, body, score, scoreColor,
}: { emoji: string; title: string; body: string; score?: number; scoreColor?: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{emoji}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
        {score !== undefined && (
          <Text style={[styles.scoreText, { color: scoreColor ?? '#E8B840' }]}>{score}/10</Text>
        )}
      </View>
      {score !== undefined && scoreColor && (
        <ScoreBar score={score} color={scoreColor} />
      )}
      <Text style={styles.cardBody}>{body}</Text>
    </View>
  );
}

async function scheduleDailyNotification() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌟 Your Daily Horoscope is Ready!',
      body: 'See what the stars and your palm reveal for today.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 7,
      minute: 0,
    },
  });
}

async function cancelDailyNotification() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

async function requestNotifPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export default function HoroscopeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { readings } = useReadings();
  const { language } = useLanguage();

  const [horoscope, setHoroscope] = useState<Horoscope | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_KEY).then(v => setNotifEnabled(v === 'true'));
  }, []);

  const palmSummary = React.useMemo(() => {
    if (!readings || readings.length === 0) return undefined;
    const r = readings[0];
    if (!r.analysis) return undefined;
    return [
      r.analysis.overview,
      r.analysis.personality,
      r.analysis.career,
      r.analysis.love,
      r.analysis.spiritual,
      r.analysis.vedicInsight,
    ].filter(Boolean).join(' | ');
  }, [readings]);

  const fetchHoroscope = useCallback(async (force = false) => {
    if (!user) return;
    const cacheKey = HOROSCOPE_KEY(user.id, todayStr);
    if (!force) {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setHoroscope(JSON.parse(cached));
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/horoscope/daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          dob: user.dob,
          gender: user.gender,
          language,
          palmSummary,
          date: todayStr,
        }),
      });
      const data = await resp.json();
      if (data.horoscope) {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data.horoscope));
        setHoroscope(data.horoscope);
      }
    } catch (e) {
      console.error('Horoscope fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [user, todayStr, language, palmSummary]);

  useEffect(() => { fetchHoroscope(); }, [fetchHoroscope]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHoroscope(true);
    setRefreshing(false);
  }, [fetchHoroscope]);

  const toggleNotification = useCallback(async (value: boolean) => {
    if (value) {
      const granted = await requestNotifPermission();
      if (!granted) {
        Alert.alert(t('notifPermTitle'), t('notifPermMsg'));
        return;
      }
      await scheduleDailyNotification();
    } else {
      await cancelDailyNotification();
    }
    setNotifEnabled(value);
    await AsyncStorage.setItem(NOTIF_KEY, value ? 'true' : 'false');
  }, [t]);

  if (!user?.dob) {
    return (
      <View style={[styles.root, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
        <Text style={styles.header}>{t('horoscope')}</Text>
        <View style={styles.noDobBox}>
          <Text style={styles.noDobEmoji}>🔮</Text>
          <Text style={styles.noDobTitle}>{t('horoscopeNoDob')}</Text>
          <Text style={styles.noDobSub}>{t('horoscopeNoDobSub')}</Text>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.profileBtnText}>{t('goToProfile')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const symbol = horoscope ? (RASHI_SYMBOL[horoscope.rashi] ?? '🔮') : '🔮';

  return (
    <View style={[styles.root, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.header}>{t('horoscope')}</Text>
        <View style={styles.notifRow}>
          <Text style={styles.notifLabel}>{t('dailyAlert')}</Text>
          <Switch
            value={notifEnabled}
            onValueChange={toggleNotification}
            trackColor={{ false: '#2D1F5E', true: '#7B3FDB' }}
            thumbColor={notifEnabled ? '#E8B840' : '#aaa'}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E8B840"
            colors={['#E8B840']}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#E8B840" />
            <Text style={styles.loadingText}>{t('horoscopeLoading')}</Text>
          </View>
        ) : horoscope ? (
          <>
            <LinearGradient
              colors={['#1A0B3D', '#2D1260', '#0A0415']}
              style={styles.rashiCard}
            >
              <Text style={styles.rashiSymbol}>{symbol}</Text>
              <Text style={styles.rashiName}>{horoscope.rashi}</Text>
              <Text style={styles.rashiEn}>{horoscope.rashiEn}</Text>
              <Text style={styles.nakshatraText}>{horoscope.nakshatra}</Text>
              <Text style={styles.dateText}>
                {new Date(horoscope.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
              <View style={styles.overallScore}>
                <Text style={styles.overallScoreLabel}>{t('overallEnergy')}</Text>
                <Text style={styles.overallScoreNum}>{horoscope.overallScore}/10</Text>
              </View>
              <ScoreBar score={horoscope.overallScore} color="#E8B840" />
              <Text style={styles.overallText}>{horoscope.overallEnergy}</Text>
            </LinearGradient>

            <SectionCard emoji="💕" title={t('love')} body={horoscope.love} score={horoscope.loveScore} scoreColor="#FF6B9D" />
            <SectionCard emoji="💼" title={t('career')} body={horoscope.career} score={horoscope.careerScore} scoreColor="#4ECDC4" />
            <SectionCard emoji="🌿" title={t('health')} body={horoscope.health} score={horoscope.healthScore} scoreColor="#95E77A" />
            <SectionCard emoji="🕉️" title={t('spiritual')} body={horoscope.spiritual} />

            <View style={styles.luckyGrid}>
              <View style={styles.luckyItem}>
                <Text style={styles.luckyEmoji}>🔢</Text>
                <Text style={styles.luckyLabel}>{t('luckyNumbersLabel')}</Text>
                <Text style={styles.luckyValue}>{horoscope.luckyNumbers}</Text>
              </View>
              <View style={styles.luckyItem}>
                <Text style={styles.luckyEmoji}>🎨</Text>
                <Text style={styles.luckyLabel}>{t('luckyColorsLabel')}</Text>
                <Text style={styles.luckyValue}>{horoscope.luckyColors}</Text>
              </View>
              <View style={styles.luckyItem}>
                <Text style={styles.luckyEmoji}>⏰</Text>
                <Text style={styles.luckyLabel}>{t('bestTimeLabel')}</Text>
                <Text style={styles.luckyValue}>{horoscope.luckyTime}</Text>
              </View>
            </View>

            <View style={styles.mantraCard}>
              <Text style={styles.mantraTitle}>🙏 {t('todayMantra')}</Text>
              <Text style={styles.mantraText}>{horoscope.todayMantra}</Text>
            </View>

            <SectionCard emoji="🪐" title={t('planetInfluence')} body={horoscope.planetInfluence} />
            <SectionCard emoji="📖" title={t('mythologyMessage')} body={horoscope.mythologyMessage} />

            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>✨ {t('vedicTip')}</Text>
              <Text style={styles.tipText}>{horoscope.vedicTip}</Text>
            </View>

            <Text style={styles.refreshHint}>{t('pullToRefresh')}</Text>
          </>
        ) : (
          <View style={styles.loadingBox}>
            <Text style={styles.noDobEmoji}>⚠️</Text>
            <Text style={styles.noDobTitle}>{t('horoscopeError')}</Text>
            <TouchableOpacity style={styles.profileBtn} onPress={() => fetchHoroscope(true)}>
              <Text style={styles.profileBtnText}>{t('tryAgain')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0415' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  header: { fontSize: 24, fontWeight: '700', color: '#E8B840', fontFamily: 'Inter_700Bold' },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifLabel: { fontSize: 12, color: '#A89CC8', fontFamily: 'Inter_400Regular' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },

  loadingBox: { alignItems: 'center', paddingTop: 80, gap: 16 },
  loadingText: { color: '#A89CC8', fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center' },

  rashiCard: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(232,184,64,0.3)' },
  rashiSymbol: { fontSize: 60, marginBottom: 8 },
  rashiName: { fontSize: 28, fontWeight: '700', color: '#E8B840', fontFamily: 'Inter_700Bold' },
  rashiEn: { fontSize: 16, color: '#C9902A', fontFamily: 'Inter_500Medium', marginTop: 2 },
  nakshatraText: { fontSize: 13, color: '#A89CC8', fontFamily: 'Inter_400Regular', marginTop: 6, textAlign: 'center' },
  dateText: { fontSize: 13, color: '#7B6A9E', fontFamily: 'Inter_400Regular', marginTop: 4, marginBottom: 16 },
  overallScore: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 6 },
  overallScoreLabel: { fontSize: 13, color: '#A89CC8', fontFamily: 'Inter_500Medium' },
  overallScoreNum: { fontSize: 13, color: '#E8B840', fontFamily: 'Inter_700Bold' },
  overallText: { fontSize: 14, color: '#D4C8F0', fontFamily: 'Inter_400Regular', lineHeight: 22, marginTop: 12, textAlign: 'center' },

  card: { backgroundColor: '#150D35', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(123,63,219,0.2)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  cardEmoji: { fontSize: 20 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#D4C8F0', fontFamily: 'Inter_600SemiBold', flex: 1 },
  scoreText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  cardBody: { fontSize: 14, color: '#A89CC8', fontFamily: 'Inter_400Regular', lineHeight: 22, marginTop: 8 },

  scoreBarBg: { height: 6, backgroundColor: '#2D1F5E', borderRadius: 3, overflow: 'hidden', marginBottom: 4, width: '100%' },
  scoreBarFill: { height: '100%', borderRadius: 3 },

  luckyGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  luckyItem: { flex: 1, backgroundColor: '#150D35', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(123,63,219,0.2)' },
  luckyEmoji: { fontSize: 22, marginBottom: 6 },
  luckyLabel: { fontSize: 11, color: '#7B6A9E', fontFamily: 'Inter_500Medium', textAlign: 'center', marginBottom: 4 },
  luckyValue: { fontSize: 13, color: '#E8B840', fontFamily: 'Inter_700Bold', textAlign: 'center' },

  mantraCard: { backgroundColor: '#1F0A3D', borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(232,184,64,0.3)', alignItems: 'center' },
  mantraTitle: { fontSize: 14, color: '#A89CC8', fontFamily: 'Inter_500Medium', marginBottom: 10 },
  mantraText: { fontSize: 18, color: '#E8B840', fontFamily: 'Inter_600SemiBold', textAlign: 'center', lineHeight: 28 },

  tipCard: { backgroundColor: '#0D1F2D', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(78,205,196,0.2)' },
  tipTitle: { fontSize: 14, color: '#4ECDC4', fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  tipText: { fontSize: 14, color: '#A89CC8', fontFamily: 'Inter_400Regular', lineHeight: 22 },

  refreshHint: { textAlign: 'center', color: '#4D3F7A', fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 8 },

  noDobBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  noDobEmoji: { fontSize: 60, marginBottom: 16 },
  noDobTitle: { fontSize: 20, fontWeight: '700', color: '#D4C8F0', fontFamily: 'Inter_700Bold', textAlign: 'center', marginBottom: 10 },
  noDobSub: { fontSize: 14, color: '#A89CC8', fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  profileBtn: { backgroundColor: '#7B3FDB', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  profileBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  goToProfileText: { color: '#E8B840', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});

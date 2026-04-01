import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { useCredits } from '@/context/CreditContext';
import { useLanguage } from '@/context/LanguageContext';

const UPI_ID = 'hastrekha@upi';
const AMOUNT = '49';
const NAME = 'HastRekha';
const NOTE = '20 credits for Krishna AI';

const UPI_APPS = [
  {
    id: 'phonepe',
    name: 'PhonePe',
    emoji: '💜',
    color: '#5F259F',
    scheme: `phonepe://pay?pa=${UPI_ID}&pn=${encodeURIComponent(NAME)}&am=${AMOUNT}&tn=${encodeURIComponent(NOTE)}&cu=INR`,
    webUrl: `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(NAME)}&am=${AMOUNT}&tn=${encodeURIComponent(NOTE)}&cu=INR`,
  },
  {
    id: 'gpay',
    name: 'Google Pay',
    emoji: '🔵',
    color: '#4285F4',
    scheme: `tez://upi/pay?pa=${UPI_ID}&pn=${encodeURIComponent(NAME)}&am=${AMOUNT}&tn=${encodeURIComponent(NOTE)}&cu=INR`,
    webUrl: `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(NAME)}&am=${AMOUNT}&tn=${encodeURIComponent(NOTE)}&cu=INR`,
  },
  {
    id: 'paytm',
    name: 'Paytm',
    emoji: '💙',
    color: '#00BAF2',
    scheme: `paytmmp://pay?pa=${UPI_ID}&pn=${encodeURIComponent(NAME)}&am=${AMOUNT}&tn=${encodeURIComponent(NOTE)}&cu=INR`,
    webUrl: `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(NAME)}&am=${AMOUNT}&tn=${encodeURIComponent(NOTE)}&cu=INR`,
  },
];

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { addCredits } = useCredits();
  const [step, setStep] = useState<'choose' | 'pending' | 'success' | 'test'>('choose');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 32 : insets.bottom;

  const openUPIApp = async (app: typeof UPI_APPS[0]) => {
    setSelectedApp(app.id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (Platform.OS === 'web') {
      setStep('pending');
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(app.scheme);
      if (canOpen) {
        await Linking.openURL(app.scheme);
        setStep('pending');
      } else {
        const canOpenGeneric = await Linking.canOpenURL(app.webUrl);
        if (canOpenGeneric) {
          await Linking.openURL(app.webUrl);
          setStep('pending');
        } else {
          setStep('pending');
        }
      }
    } catch {
      setStep('pending');
    }
  };

  const verifyPayment = async () => {
    setIsProcessing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise(r => setTimeout(r, 1500));
    await addCredits(20);
    setIsProcessing(false);
    setStep('success');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const simulateTestPayment = async () => {
    setIsProcessing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise(r => setTimeout(r, 1800));
    await addCredits(20);
    setIsProcessing(false);
    setStep('success');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleClose = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <LinearGradient colors={['#0A0415', '#12082A', '#1A0D35']} style={styles.container}>
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={handleClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('buyCredits')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {step === 'success' ? (
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>✨</Text>
            <Text style={styles.successTitle}>{t('paymentSuccess')}</Text>
            <Text style={styles.successMsg}>{t('paymentSuccessMsg')}</Text>
            <Pressable
              style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}
              onPress={handleClose}
            >
              <LinearGradient colors={['#C9902A', '#E8B840']} style={styles.doneBtnGrad}>
                <Text style={styles.doneBtnText}>Continue</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.productCard}>
              <View style={styles.productIcon}>
                <Text style={styles.productEmoji}>🦚</Text>
              </View>
              <Text style={styles.productTitle}>{t('buyCreditsTitle')}</Text>
              <Text style={styles.productSubtitle}>{t('buyCreditsSubtitle')}</Text>
              <View style={styles.priceTag}>
                <Text style={styles.priceText}>{t('buyCreditsPrice')}</Text>
              </View>
              <View style={styles.featureList}>
                {['20 credits included', '10 divine replies with Krishna', 'Valid forever (no expiry)', 'Supports all 23 languages'].map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.dark.gold} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>

            {step === 'pending' ? (
              <View style={styles.pendingCard}>
                <Text style={styles.pendingTitle}>Complete your payment</Text>
                <Text style={styles.pendingMsg}>
                  {selectedApp ? `Complete the ₹49 payment in your UPI app. UPI ID: ` : 'Complete the ₹49 payment in your UPI app. UPI ID: '}
                  <Text style={styles.upiId}>{UPI_ID}</Text>
                </Text>
                <Text style={styles.pendingNote}>After paying, tap the button below to add your credits.</Text>

                {isProcessing ? (
                  <View style={styles.processingRow}>
                    <ActivityIndicator color={Colors.dark.gold} />
                    <Text style={styles.processingText}>Verifying payment...</Text>
                  </View>
                ) : (
                  <>
                    <Pressable
                      style={({ pressed }) => [styles.verifyBtn, pressed && styles.pressed]}
                      onPress={verifyPayment}
                    >
                      <LinearGradient colors={['#C9902A', '#E8B840']} style={styles.verifyBtnGrad}>
                        <Ionicons name="checkmark-circle" size={18} color="#0A0415" />
                        <Text style={styles.verifyBtnText}>{t('verifyPayment')}</Text>
                      </LinearGradient>
                    </Pressable>

                    <Pressable onPress={() => setStep('choose')} style={styles.backLink}>
                      <Text style={styles.backLinkText}>← Choose different app</Text>
                    </Pressable>
                  </>
                )}
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>{t('chooseUPIApp')}</Text>

                <View style={styles.appGrid}>
                  {UPI_APPS.map(app => (
                    <Pressable
                      key={app.id}
                      style={({ pressed }) => [styles.appCard, pressed && styles.pressed]}
                      onPress={() => openUPIApp(app)}
                    >
                      <View style={[styles.appIcon, { backgroundColor: `${app.color}22` }]}>
                        <Text style={styles.appEmoji}>{app.emoji}</Text>
                      </View>
                      <Text style={styles.appName}>{app.name}</Text>
                      <Text style={styles.appAmount}>₹{AMOUNT}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.divider} />
                </View>

                <Pressable
                  style={({ pressed }) => [styles.testBtn, pressed && styles.pressed]}
                  onPress={simulateTestPayment}
                >
                  {isProcessing ? (
                    <View style={styles.testBtnInner}>
                      <ActivityIndicator color={Colors.dark.gold} size="small" />
                      <Text style={styles.testBtnText}>Processing...</Text>
                    </View>
                  ) : (
                    <View style={styles.testBtnInner}>
                      <Ionicons name="flask-outline" size={18} color={Colors.dark.gold} />
                      <Text style={styles.testBtnText}>{t('testPayment')}</Text>
                    </View>
                  )}
                </Pressable>

                <Text style={styles.testNote}>
                  Test mode adds 20 credits immediately for demo purposes. Remove before production.
                </Text>
              </>
            )}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: { width: 220, height: 220, top: -60, right: -40, backgroundColor: 'rgba(201,144,42,0.10)' },
  orb2: { width: 160, height: 160, bottom: 100, left: -50, backgroundColor: 'rgba(123,63,219,0.10)' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  closeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'Inter_700Bold', color: Colors.dark.text },
  scroll: { paddingHorizontal: 24, paddingTop: 24, gap: 20 },
  productCard: {
    backgroundColor: Colors.dark.card, borderRadius: 24, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(201,144,42,0.3)',
  },
  productIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(201,144,42,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: Colors.dark.goldDim,
  },
  productEmoji: { fontSize: 40 },
  productTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.dark.text, textAlign: 'center', marginBottom: 6 },
  productSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, textAlign: 'center', marginBottom: 16 },
  priceTag: {
    backgroundColor: 'rgba(201,144,42,0.15)', borderWidth: 1, borderColor: Colors.dark.gold,
    borderRadius: 20, paddingHorizontal: 24, paddingVertical: 8, marginBottom: 20,
  },
  priceText: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.dark.gold },
  featureList: { gap: 8, width: '100%' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary },
  sectionLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.dark.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
  appGrid: { flexDirection: 'row', gap: 12 },
  appCard: {
    flex: 1, backgroundColor: Colors.dark.card, borderRadius: 18, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.border, gap: 8,
  },
  appIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  appEmoji: { fontSize: 28 },
  appName: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.dark.text, textAlign: 'center' },
  appAmount: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.dark.gold },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: Colors.dark.border },
  dividerText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.dark.textTertiary },
  testBtn: {
    backgroundColor: Colors.dark.card, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.dark.gold, padding: 16,
  },
  testBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  testBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.dark.gold },
  testNote: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.dark.textTertiary, textAlign: 'center', lineHeight: 16 },
  pendingCard: {
    backgroundColor: Colors.dark.card, borderRadius: 24, padding: 24, gap: 12,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  pendingTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.dark.text },
  pendingMsg: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, lineHeight: 22 },
  upiId: { fontFamily: 'Inter_700Bold', color: Colors.dark.gold },
  pendingNote: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.dark.textTertiary },
  processingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', paddingVertical: 8 },
  processingText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.dark.textSecondary },
  verifyBtn: { borderRadius: 16, overflow: 'hidden' },
  verifyBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  verifyBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0A0415' },
  backLink: { alignItems: 'center', paddingVertical: 4 },
  backLinkText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.dark.textTertiary },
  successCard: { alignItems: 'center', paddingTop: 48, gap: 16 },
  successEmoji: { fontSize: 72 },
  successTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.dark.gold, textAlign: 'center' },
  successMsg: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, textAlign: 'center', lineHeight: 24 },
  doneBtn: { borderRadius: 16, overflow: 'hidden', width: '100%', marginTop: 16 },
  doneBtnGrad: { paddingVertical: 18, alignItems: 'center' },
  doneBtnText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#0A0415' },
  pressed: { opacity: 0.85 },
});

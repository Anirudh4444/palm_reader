import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useReadings } from '@/context/ReadingsContext';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { addReading } = useReadings();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const gender = (user as any)?.gender ?? '';
  const suggestedHand: 'left' | 'right' = gender === 'female' ? 'left' : 'right';
  const [hand, setHand] = useState<'left' | 'right'>(suggestedHand);

  const handSuggestion = gender === 'female'
    ? t('handSuggestionFemale')
    : gender === 'male'
    ? t('handSuggestionMale')
    : t('handSuggestionOther');

  const pickImage = async (source: 'camera' | 'gallery') => {
    let result;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera Permission', 'Camera permission is needed to take a photo of your palm.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    }
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const analyzepalm = async () => {
    if (!imageUri || !user) return;
    setIsAnalyzing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      let base64Image = '';
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });
      } else {
        const resp = await fetch(imageUri);
        const ab = await resp.arrayBuffer();
        const bytes = new Uint8Array(ab);
        let binary = '';
        bytes.forEach(b => binary += String.fromCharCode(b));
        base64Image = btoa(binary);
      }

      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? '';
      const apiUrl = domain ? `https://${domain}/api/palm/analyze` : '/api/palm/analyze';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          hand,
          dob: user.dob,
          name: user.name,
          language,
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');
      const analysis = await response.json();

      const reading = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId: user.id,
        imageUri,
        hand,
        dob: user.dob,
        createdAt: new Date().toISOString(),
        analysis,
      };

      await addReading(reading);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/reading/${reading.id}`);
    } catch (e) {
      console.error('Analysis error:', e);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Analysis Failed', 'Could not analyze the palm. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0415', '#12082A', '#1A0D35']} style={styles.container}>
      <View style={[styles.orb, styles.orb1]} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
      >
        <Animated.View entering={FadeIn.delay(100)}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.dark.textSecondary} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.titleSection}>
          <Text style={styles.title}>{t('scanPalm')}</Text>
          <Text style={styles.subtitle}>{t('palmInstructions')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250)} style={styles.handSection}>
          <Text style={styles.sectionLabel}>{t('chooseHand')}</Text>
          <View style={styles.handRow}>
            <Pressable
              style={({ pressed }) => [styles.handBtn, hand === 'left' && styles.handBtnActive, pressed && styles.pressed]}
              onPress={() => setHand('left')}
            >
              <Text style={styles.handEmoji}>🤚</Text>
              <Text style={[styles.handBtnText, hand === 'left' && styles.handBtnTextActive]}>{t('left')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.handBtn, hand === 'right' && styles.handBtnActive, pressed && styles.pressed]}
              onPress={() => setHand('right')}
            >
              <Text style={styles.handEmoji}>✋</Text>
              <Text style={[styles.handBtnText, hand === 'right' && styles.handBtnTextActive]}>{t('right')}</Text>
            </Pressable>
          </View>

          <View style={styles.suggestionCard}>
            <View style={styles.suggestionHeader}>
              <Ionicons name="sparkles" size={14} color={Colors.dark.gold} />
              <Text style={styles.suggestionTitle}>{t('handSuggestionTitle')}</Text>
            </View>
            <Text style={styles.suggestionText}>{handSuggestion}</Text>
            {gender !== '' && (
              <Text style={styles.suggestionHint}>
                {hand === suggestedHand
                  ? `✓ Suggested hand selected`
                  : `Suggested: ${suggestedHand === 'left' ? t('left') : t('right')}`}
              </Text>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.imageSection}>
          {imageUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.palmImage} />
              <View style={styles.imageOverlay} />
              <Pressable style={styles.changeImageBtn} onPress={() => setImageUri(null)}>
                <Ionicons name="close-circle" size={28} color={Colors.dark.text} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.uploadArea}>
              <LinearGradient colors={['#1A0D35', '#251350']} style={styles.uploadAreaInner}>
                <View style={styles.uploadIconWrap}>
                  <Text style={styles.uploadEmoji}>🖐</Text>
                </View>
                <Text style={styles.uploadText}>Place your palm here</Text>
                <Text style={styles.uploadSubText}>Clear lines, good lighting, palm facing up</Text>
                <View style={styles.uploadBtns}>
                  <Pressable
                    style={({ pressed }) => [styles.uploadBtn, pressed && styles.pressed]}
                    onPress={() => pickImage('camera')}
                  >
                    <LinearGradient colors={['#C9902A', '#E8B840']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.uploadBtnGrad}>
                      <Ionicons name="camera" size={18} color="#0A0415" />
                      <Text style={styles.uploadBtnText}>{t('takePicture')}</Text>
                    </LinearGradient>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.uploadBtnOutline, pressed && styles.pressed]}
                    onPress={() => pickImage('gallery')}
                  >
                    <Ionicons name="images-outline" size={18} color={Colors.dark.gold} />
                    <Text style={styles.uploadBtnOutlineText}>{t('chooseGallery')}</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          )}
        </Animated.View>

        {imageUri && (
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.analyzeSection}>
            {isAnalyzing ? (
              <View style={styles.analyzingWrap}>
                <ActivityIndicator color={Colors.dark.gold} size="large" />
                <Text style={styles.analyzingText}>{t('analyzing')}</Text>
                <Text style={styles.analyzingSubText}>Reading ancient palm lines...</Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.analyzeBtn, pressed && styles.pressed]}
                onPress={analyzepalm}
              >
                <LinearGradient colors={['#7B3FDB', '#9B5FE8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.analyzeBtnGrad}>
                  <Text style={styles.analyzeBtnEmoji}>🔮</Text>
                  <Text style={styles.analyzeBtnText}>Reveal My Destiny</Text>
                </LinearGradient>
              </Pressable>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: { width: 250, height: 250, top: -60, right: -60, backgroundColor: 'rgba(123,63,219,0.12)' },
  scroll: { paddingHorizontal: 24 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', marginBottom: 8 },
  titleSection: { marginBottom: 28 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.dark.text, marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, lineHeight: 20 },
  sectionLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.dark.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  handSection: { marginBottom: 28 },
  handRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  handBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border, backgroundColor: Colors.dark.card },
  handBtnActive: { backgroundColor: Colors.dark.accentDim, borderColor: Colors.dark.gold },
  handEmoji: { fontSize: 22 },
  handBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.dark.textTertiary },
  handBtnTextActive: { color: Colors.dark.gold },
  suggestionCard: {
    backgroundColor: 'rgba(201,144,42,0.08)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(201,144,42,0.2)', gap: 6,
  },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  suggestionTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Colors.dark.gold, letterSpacing: 0.5, textTransform: 'uppercase' },
  suggestionText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, lineHeight: 20 },
  suggestionHint: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.dark.gold },
  imageSection: { marginBottom: 24 },
  imagePreview: { borderRadius: 24, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: Colors.dark.borderLight },
  palmImage: { width: '100%', aspectRatio: 1, borderRadius: 24 },
  imageOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 24 },
  changeImageBtn: { position: 'absolute', top: 12, right: 12 },
  uploadArea: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: Colors.dark.borderLight },
  uploadAreaInner: { padding: 32, alignItems: 'center', gap: 12 },
  uploadIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(201,144,42,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  uploadEmoji: { fontSize: 46 },
  uploadText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.dark.text },
  uploadSubText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, textAlign: 'center' },
  uploadBtns: { gap: 12, width: '100%', marginTop: 8 },
  uploadBtn: { borderRadius: 14, overflow: 'hidden' },
  uploadBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8, borderRadius: 14 },
  uploadBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0A0415' },
  uploadBtnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8, borderRadius: 14, borderWidth: 1, borderColor: Colors.dark.gold, backgroundColor: 'rgba(201,144,42,0.08)' },
  uploadBtnOutlineText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.dark.gold },
  analyzeSection: { marginBottom: 24 },
  analyzingWrap: { alignItems: 'center', gap: 12, paddingVertical: 20 },
  analyzingText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.dark.gold },
  analyzingSubText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary },
  analyzeBtn: { borderRadius: 16, overflow: 'hidden' },
  analyzeBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10, borderRadius: 16 },
  analyzeBtnEmoji: { fontSize: 22 },
  analyzeBtnText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.3 },
  pressed: { opacity: 0.85 },
});

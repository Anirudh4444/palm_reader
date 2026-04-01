import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { ALL_LANGUAGES, Language, useLanguage } from '@/context/LanguageContext';
import { useReadings } from '@/context/ReadingsContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { readings } = useReadings();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
  };

  const currentLang = ALL_LANGUAGES.find(l => l.code === language);
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <LinearGradient colors={['#0A0415', '#12082A']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPadding + 16, paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile')}</Text>
        </View>

        {/* Avatar Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.avatarSection}>
          <LinearGradient colors={['#1A0D35', '#251350']} style={styles.avatarCard}>
            <View style={styles.avatarCircle}>
              <LinearGradient colors={['#C9902A', '#E8B840']} style={styles.avatarGrad}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </LinearGradient>
            </View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.dob && (
              <View style={styles.dobBadge}>
                <Ionicons name="calendar-outline" size={12} color={Colors.dark.gold} />
                <Text style={styles.dobText}>{t('dob')}: {user.dob}</Text>
              </View>
            )}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{readings.length}</Text>
                <Text style={styles.statLabel}>{t('readings')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{user?.gender ? t(user.gender) : '-'}</Text>
                <Text style={styles.statLabel}>{t('gender')}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Language Dropdown */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <Pressable
            style={({ pressed }) => [styles.langDropdownBtn, pressed && styles.pressed]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLangModalVisible(true);
            }}
          >
            <LinearGradient colors={['#1A0D35', '#251350']} style={styles.langDropdownInner}>
              <View style={styles.langDropdownLeft}>
                <Text style={styles.langFlag}>{currentLang?.flag ?? '🌐'}</Text>
                <View>
                  <Text style={styles.langDropdownLabel}>{currentLang?.english}</Text>
                  <Text style={styles.langDropdownNative}>{currentLang?.native}</Text>
                </View>
              </View>
              <View style={styles.langDropdownRight}>
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.dark.gold} />
                  <Text style={styles.selectedBadgeText}>Selected</Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={Colors.dark.textSecondary} style={{ marginLeft: 8 }} />
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* About */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about')}</Text>
          <View style={styles.aboutCard}>
            <LinearGradient colors={['#1A0D35', '#251350']} style={styles.aboutCardInner}>
              <Text style={styles.aboutEmoji}>🕉️</Text>
              <Text style={styles.aboutTitle}>HastRekha</Text>
              <Text style={styles.aboutText}>
                Powered by ancient Indian wisdom — Hasta Samudrikam (palmistry), Vedic astrology, and Puranic mythology. Our AI analyzes palm lines using traditional Indian methods.
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Sign out */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={[styles.section, { marginTop: 8 }]}>
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.dark.error} />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <Pressable style={styles.logoutModalOverlay} onPress={() => setLogoutModalVisible(false)}>
          <View style={styles.logoutModal}>
            <LinearGradient colors={['#1A0D35', '#251350']} style={styles.logoutModalInner}>
              <View style={styles.logoutModalIcon}>
                <Ionicons name="log-out-outline" size={32} color={Colors.dark.error} />
              </View>
              <Text style={styles.logoutModalTitle}>Sign Out</Text>
              <Text style={styles.logoutModalMsg}>Are you sure you want to sign out of HastRekha?</Text>
              <View style={styles.logoutModalButtons}>
                <Pressable
                  style={({ pressed }) => [styles.logoutModalCancel, pressed && styles.pressed]}
                  onPress={() => setLogoutModalVisible(false)}
                  accessibilityLabel="Cancel sign out"
                >
                  <Text style={styles.logoutModalCancelText}>{t('cancel')}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.logoutModalConfirm, pressed && styles.pressed]}
                  onPress={confirmLogout}
                  accessibilityLabel="Confirm sign out"
                >
                  <Text style={styles.logoutModalConfirmText}>{t('logout')}</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        </Pressable>
      </Modal>

      {/* Language Picker Modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLangModalVisible(false)}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <LinearGradient colors={['#12082A', '#1A0D35']} style={styles.modalSheetInner}>
              {/* Handle */}
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
                <Pressable onPress={() => setLangModalVisible(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={22} color={Colors.dark.textSecondary} />
                </Pressable>
              </View>
              <FlatList
                data={ALL_LANGUAGES}
                keyExtractor={item => item.code}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 480 }}
                renderItem={({ item, index }) => {
                  const isSelected = language === item.code;
                  return (
                    <>
                      <Pressable
                        style={({ pressed }) => [styles.langItem, isSelected && styles.langItemActive, pressed && styles.pressed]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setLanguage(item.code as Language);
                          setTimeout(() => setLangModalVisible(false), 180);
                        }}
                      >
                        <Text style={styles.langItemFlag}>{item.flag}</Text>
                        <View style={styles.langItemText}>
                          <Text style={[styles.langItemEnglish, isSelected && styles.langItemEnglishActive]}>
                            {item.english}
                          </Text>
                          <Text style={styles.langItemNative}>{item.native}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={22} color={Colors.dark.gold} />
                        )}
                      </Pressable>
                      {index < ALL_LANGUAGES.length - 1 && (
                        <View style={styles.langItemDivider} />
                      )}
                    </>
                  );
                }}
              />
            </LinearGradient>
          </View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, marginBottom: 20 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.dark.text },
  avatarSection: { marginHorizontal: 20, marginBottom: 24 },
  avatarCard: { borderRadius: 24, padding: 28, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.dark.border },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', marginBottom: 8 },
  avatarGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 30, fontFamily: 'Inter_700Bold', color: '#0A0415' },
  userName: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.dark.text },
  userEmail: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary },
  dobBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.dark.accentDim, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: Colors.dark.goldDim, marginTop: 4 },
  dobText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.dark.gold },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 24 },
  statItem: { alignItems: 'center', gap: 2 },
  statNum: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.dark.gold },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.dark.border },
  section: { marginHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.dark.textSecondary, marginBottom: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  langDropdownBtn: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.dark.border },
  langDropdownInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  langDropdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  langFlag: { fontSize: 24 },
  langDropdownLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.dark.text },
  langDropdownNative: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.dark.textTertiary, marginTop: 2 },
  langDropdownRight: { flexDirection: 'row', alignItems: 'center' },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.dark.accentDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: Colors.dark.goldDim },
  selectedBadgeText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.dark.gold },
  aboutCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: Colors.dark.border },
  aboutCardInner: { padding: 24, gap: 8 },
  aboutEmoji: { fontSize: 32 },
  aboutTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.dark.gold },
  aboutText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, lineHeight: 22 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(232,85,85,0.10)', paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(232,85,85,0.25)' },
  logoutText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.dark.error },
  pressed: { opacity: 0.8 },
  logoutModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  logoutModal: { width: '100%', maxWidth: 340 },
  logoutModalInner: { width: '100%', maxWidth: 340, borderRadius: 24, padding: 28, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.dark.border },
  logoutModalIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(232,85,85,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232,85,85,0.25)', marginBottom: 4 },
  logoutModalTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.dark.text },
  logoutModalMsg: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, textAlign: 'center', lineHeight: 22 },
  logoutModalButtons: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  logoutModalCancel: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.border },
  logoutModalCancelText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.dark.textSecondary },
  logoutModalConfirm: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(232,85,85,0.15)', borderWidth: 1, borderColor: 'rgba(232,85,85,0.4)' },
  logoutModalConfirmText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.dark.error },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  modalSheetInner: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.dark.border, paddingTop: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.dark.border, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.dark.text },
  modalCloseBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.card, borderRadius: 18 },
  langItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  langItemActive: { backgroundColor: 'rgba(201,144,42,0.08)' },
  langItemFlag: { fontSize: 22, width: 32, textAlign: 'center' },
  langItemText: { flex: 1 },
  langItemEnglish: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.dark.text },
  langItemEnglishActive: { color: Colors.dark.gold, fontFamily: 'Inter_600SemiBold' },
  langItemNative: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.dark.textTertiary, marginTop: 2 },
  langItemDivider: { height: 1, backgroundColor: Colors.dark.border, marginLeft: 64 },
});

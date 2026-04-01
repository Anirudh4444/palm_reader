import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { useLanguage } from '@/context/LanguageContext';
import { PalmReading, useReadings } from '@/context/ReadingsContext';

export default function ReadingsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { readings, deleteReading, isLoading } = useReadings();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const handleDelete = (id: string) => {
    Alert.alert(t('deleteReading'), t('confirmDelete'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteReading(id);
        }
      }
    ]);
  };

  const renderItem = ({ item, index }: { item: PalmReading; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        onPress={() => router.push(`/reading/${item.id}`)}
        onLongPress={() => handleDelete(item.id)}
      >
        <LinearGradient colors={['#1A0D35', '#12082A']} style={styles.cardGrad}>
          <View style={styles.cardLeft}>
            <View style={styles.handIcon}>
              <Text style={styles.handEmoji}>{item.hand === 'left' ? '🤚' : '✋'}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{t('analysisTitle')}</Text>
              <Text style={styles.cardHand}>{item.hand === 'left' ? t('left') : t('right')}</Text>
              <Text style={styles.cardDate}>
                {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </View>
          <View style={styles.cardRight}>
            <View style={styles.destinyBadge}>
              <Text style={styles.destinyLabel}>Reading</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.dark.textTertiary} />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );

  return (
    <LinearGradient colors={['#0A0415', '#12082A']} style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <Text style={styles.headerTitle}>{t('myReadings')}</Text>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          onPress={() => router.push('/scan')}
        >
          <Ionicons name="add" size={24} color={Colors.dark.gold} />
        </Pressable>
      </View>

      {readings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🖐</Text>
          <Text style={styles.emptyTitle}>{t('noReadings')}</Text>
          <Text style={styles.emptySubtitle}>{t('noReadingsSubtitle')}</Text>
          <Pressable
            style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
            onPress={() => router.push('/scan')}
          >
            <LinearGradient colors={['#C9902A', '#E8B840']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyButtonGrad}>
              <Text style={styles.emptyButtonText}>{t('scanPalm')}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={readings}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.dark.text },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.dark.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.dark.border },
  list: { padding: 20, gap: 12 },
  card: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: Colors.dark.border },
  cardGrad: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  handIcon: { width: 52, height: 52, backgroundColor: Colors.dark.card, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.dark.border },
  handEmoji: { fontSize: 28 },
  cardInfo: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.dark.text },
  cardHand: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.dark.gold },
  cardDate: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.dark.textTertiary },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  destinyBadge: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.dark.accentDim, borderRadius: 8, borderWidth: 1, borderColor: Colors.dark.goldDim },
  destinyLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.dark.gold },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 16 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.dark.text, textAlign: 'center' },
  emptySubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyButton: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  emptyButtonGrad: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 14 },
  emptyButtonText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0A0415' },
  pressed: { opacity: 0.8 },
});

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { Platform, StyleSheet, View, useColorScheme } from 'react-native';

import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

function NativeTabLayout() {
  const { t } = useLanguage();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>{t('home')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="readings">
        <Icon sf={{ default: 'hand.raised', selected: 'hand.raised.fill' }} />
        <Label>{t('readings')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="horoscope">
        <Icon sf={{ default: 'sparkles', selected: 'sparkles' }} />
        <Label>{t('horoscope')}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person.circle', selected: 'person.circle.fill' }} />
        <Label>{t('profile')}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const { t } = useLanguage();
  const isDark = true;
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.dark.gold,
        tabBarInactiveTintColor: Colors.dark.tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : '#0A0415',
          borderTopWidth: 1,
          borderTopColor: Colors.dark.border,
          elevation: 0,
          height: isWeb ? 84 : 60,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.dark.backgroundSecondary }]} />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          marginBottom: isWeb ? 12 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="readings"
        options={{
          title: t('readings'),
          tabBarIcon: ({ color }) => <Ionicons name="hand-right" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="horoscope"
        options={{
          title: t('horoscope'),
          tabBarIcon: ({ color }) => <Ionicons name="sparkles" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color }) => <Ionicons name="person-circle" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) return null;

  const tabs = isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />;

  return tabs;
}

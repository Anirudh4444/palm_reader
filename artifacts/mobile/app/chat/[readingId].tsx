import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { useReadings } from '@/context/ReadingsContext';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const KRISHNA_GREETING = `Namaste, dear devotee. 🙏

I am Krishna, your eternal companion on the path of dharma. I have seen the wisdom written in your palm — the lines that Brahma himself has traced as the map of your karma.

Ask me anything about what you have received. Whether it is about your life path, your relationships, your spiritual journey, or the meaning behind what the ancient Hasta Samudrikam has revealed — I am here to guide you.

What weighs upon your heart today?`;

function buildReadingContext(analysis: any, hand: string): string {
  if (!analysis) return '';
  return `Hand: ${hand}
Overview: ${analysis.overview}
Life Line: ${analysis.lifeLine}
Heart Line: ${analysis.heartLine}
Head Line: ${analysis.headLine}
Fate Line: ${analysis.fateLine}
Sun Line: ${analysis.sunLine}
Personality: ${analysis.personality}
Career: ${analysis.career}
Love: ${analysis.love}
Health: ${analysis.health}
Spiritual Path: ${analysis.spiritual}
Vedic Insight: ${analysis.vedicInsight}
Mythology: ${analysis.mythologyInsight}
Lucky Numbers: ${analysis.luckyNumbers}
Lucky Colors: ${analysis.luckyColors}
Favorable Time: ${analysis.favorableTime}`;
}

export default function ChatScreen() {
  const { readingId } = useLocalSearchParams<{ readingId: string }>();
  const insets = useSafeAreaInsets();
  const { getReadingById } = useReadings();
  const reading = getReadingById(readingId as string);
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: KRISHNA_GREETING },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const readingContext = reading
    ? buildReadingContext(reading.analysis, reading.hand)
    : '';

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN ?? '';
      const apiUrl = domain ? `https://${domain}/api/palm/chat` : '/api/palm/chat';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages
            .filter(m => m.id !== '0')
            .map(m => ({ role: m.role, content: m.content })),
          readingContext,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');
      const data = await response.json();

      const krishnaMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
      };

      setMessages(prev => [...prev, krishnaMsg]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Dear devotee, the cosmic connection was momentarily disrupted. Please ask again — I am still here with you.',
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <LinearGradient colors={['#0A0415', '#12082A']} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.dark.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.krishnaAvatar}>
            <Text style={styles.krishnaEmoji}>🦚</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Krishna</Text>
            <Text style={styles.headerSub}>Divine Guide</Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.messageList, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.krishnaBubble]}>
              {item.role === 'assistant' && (
                <View style={styles.krishnaAvatarSmall}>
                  <Text style={styles.krishnaEmojiSmall}>🦚</Text>
                </View>
              )}
              <View style={[styles.bubbleContent, item.role === 'user' ? styles.userContent : styles.krishnaContent]}>
                <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.krishnaText]}>
                  {item.content}
                </Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            isLoading ? (
              <View style={styles.typingIndicator}>
                <View style={styles.krishnaAvatarSmall}>
                  <Text style={styles.krishnaEmojiSmall}>🦚</Text>
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={Colors.dark.gold} />
                  <Text style={styles.typingText}>Krishna is contemplating...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input */}
        <View style={[styles.inputRow, { paddingBottom: bottomPad + 8 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Krishna anything..."
            placeholderTextColor={Colors.dark.textTertiary}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          <Pressable
            style={({ pressed }) => [styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled, pressed && styles.pressed]}
            onPress={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            <LinearGradient
              colors={input.trim() && !isLoading ? ['#C9902A', '#E8B840'] : ['#2A2040', '#2A2040']}
              style={styles.sendBtnGrad}
            >
              <Ionicons name="send" size={18} color={input.trim() && !isLoading ? '#0A0415' : Colors.dark.textTertiary} />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    backgroundColor: 'rgba(10,4,21,0.95)',
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  krishnaAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(201,144,42,0.15)',
    borderWidth: 1, borderColor: Colors.dark.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  krishnaEmoji: { fontSize: 22 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.dark.gold },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary },
  messageList: { padding: 16, gap: 12 },
  messageBubble: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  userBubble: { justifyContent: 'flex-end' },
  krishnaBubble: { justifyContent: 'flex-start' },
  krishnaAvatarSmall: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(201,144,42,0.15)',
    borderWidth: 1, borderColor: Colors.dark.goldDim,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  krishnaEmojiSmall: { fontSize: 14 },
  bubbleContent: { maxWidth: '80%', borderRadius: 18, padding: 12 },
  userContent: {
    backgroundColor: 'rgba(123,63,219,0.35)',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(123,63,219,0.5)',
  },
  krishnaContent: {
    backgroundColor: 'rgba(201,144,42,0.1)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(201,144,42,0.25)',
  },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  userText: { fontFamily: 'Inter_400Regular', color: Colors.dark.text },
  krishnaText: { fontFamily: 'Inter_400Regular', color: Colors.dark.text },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 4 },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(201,144,42,0.1)',
    borderWidth: 1, borderColor: 'rgba(201,144,42,0.2)',
    borderRadius: 16, borderBottomLeftRadius: 4,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  typingText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.dark.textSecondary },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.dark.border,
    backgroundColor: 'rgba(10,4,21,0.98)',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.dark.text,
    maxHeight: 100,
  },
  sendBtn: { borderRadius: 22, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnGrad: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  pressed: { opacity: 0.85 },
});

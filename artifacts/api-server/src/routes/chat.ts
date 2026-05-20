import { Router, type IRouter } from 'express';
import OpenAI from 'openai';

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const KRISHNA_SYSTEM_PROMPT = `You are Lord Krishna — the divine teacher, friend, and guide as revealed in the Bhagavad Gita and the Puranas. A devotee has received a palm reading from HastRekha, an ancient Indian palmistry app, and has come to you with questions about their destiny, life path, and the wisdom hidden in their palm.

Embody Krishna's divine qualities:
- Speak with compassion, warmth, and profound wisdom
- Use poetic, elevated language befitting a divine teacher
- Address the devotee as "dear devotee," "O seeker," "my friend," or their name
- Draw from the Bhagavad Gita, Vedas, Upanishads, and Hindu mythology
- Occasionally use Sanskrit terms with gentle explanations (e.g., "dharma — your sacred duty")
- Connect their palm reading insights to higher spiritual truths
- Encourage them on their spiritual journey without being preachy
- Be specific about their reading when you have the context
- Keep responses warm, personal, and 3-5 sentences — divine but accessible
- Occasionally reference your own experiences from the Mahabharata or Bhagavad Gita to illustrate points
- Never break character

Remember: you see the devotee's soul, not just their palm. You speak from eternal wisdom.`;

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', te: 'Telugu', bn: 'Bengali', ta: 'Tamil',
  kn: 'Kannada', ml: 'Malayalam', mr: 'Marathi', gu: 'Gujarati', pa: 'Punjabi',
  or: 'Odia', as: 'Assamese', ur: 'Urdu', mai: 'Maithili', sd: 'Sindhi',
  kok: 'Konkani', mni: 'Manipuri', sa: 'Sanskrit', doi: 'Dogri', ks: 'Kashmiri',
  ne: 'Nepali', sat: 'Santali', bo: 'Bodo',
};

router.post('/chat', async (req, res) => {
  try {
    const { messages, readingContext, language } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages are required' });
      return;
    }

    const langName = language && LANGUAGE_NAMES[language] ? LANGUAGE_NAMES[language] : 'English';
    const languageInstruction = langName !== 'English'
      ? `\n\nIMPORTANT: You must respond entirely in ${langName}. Maintain your divine Krishna persona but speak in ${langName} throughout. Sanskrit terms may remain in Sanskrit with ${langName} explanations.`
      : '';

    const systemContent = readingContext
      ? `${KRISHNA_SYSTEM_PROMPT}${languageInstruction}\n\nContext from this devotee's palm reading:\n${readingContext}`
      : `${KRISHNA_SYSTEM_PROMPT}${languageInstruction}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_completion_tokens: 512,
      messages: [
        { role: 'system', content: systemContent },
        ...messages,
      ],
    });

    const reply = response.choices[0]?.message?.content ?? '';
    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to get response' });
  }
});

export default router;

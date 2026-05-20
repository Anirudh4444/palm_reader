import { Router, type IRouter } from 'express';
import OpenAI from 'openai';

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', te: 'Telugu', bn: 'Bengali', ta: 'Tamil',
  kn: 'Kannada', ml: 'Malayalam', mr: 'Marathi', gu: 'Gujarati', pa: 'Punjabi',
  or: 'Odia', as: 'Assamese', ur: 'Urdu', mai: 'Maithili', sd: 'Sindhi',
  kok: 'Konkani', mni: 'Manipuri', sa: 'Sanskrit', doi: 'Dogri', ks: 'Kashmiri',
  ne: 'Nepali', sat: 'Santali', bo: 'Bodo',
};

router.post('/analyze', async (req, res) => {
  try {
    const { image, hand, dob, name, language } = req.body;

    if (!image) {
      res.status(400).json({ error: 'Image is required' });
      return;
    }

    const langName = language && LANGUAGE_NAMES[language] ? LANGUAGE_NAMES[language] : 'English';
    const langInstruction = langName !== 'English'
      ? `\n\nCRITICAL: Write ALL text values in ${langName}. The JSON keys must stay in English exactly as specified, but every string value in the JSON must be written entirely in ${langName}. Do not mix languages in the values.`
      : '';

    const systemPrompt = `You are an expert in Indian palmistry (Hasta Samudrikam), Vedic astrology, and Hindu mythology. 
You analyze palm images with deep knowledge of:
- Traditional Indian palm reading (Hasta Samudrikam)
- Vedic astrology (Jyotish shastra) and planetary influences
- Hindu mythology connections (Surya, Chandra, Mangal, Shukra, Budh, Guru, Shani planets)
- The 7 mounts (Guru/Jupiter, Shani/Saturn, Surya/Sun, Budh/Mercury, Mangal/Mars, Chandra/Moon, Shukra/Venus)
- Major lines: Jeevana Rekha (Life Line), Hridaya Rekha (Heart Line), Mastishka Rekha (Head Line), Bhagya Rekha (Fate Line), Surya Rekha (Sun Line)
- Minor lines and special markings in Indian tradition

Always provide readings that are:
- Deeply rooted in ancient Indian palmistry tradition
- Spiritually meaningful and uplifting
- Specific to the visible features in the palm image
- Culturally respectful of Indian heritage

Respond ONLY with a valid JSON object. No other text.${langInstruction}`;

    const handDescription = hand === 'left' ? 'left hand (passive/birth karma)' : 'right hand (active/current karma)';
    const dobInfo = dob ? `Date of birth: ${dob}.` : '';
    const nameInfo = name ? `Person's name: ${name}.` : '';

    const userPrompt = `Analyze this ${handDescription} palm image with expert knowledge of Indian palmistry, Vedic astrology, and Hindu mythology. ${dobInfo} ${nameInfo}

Return a JSON object with these exact keys:
{
  "overview": "2-3 sentence compelling overview of this person's destiny and palm character",
  "lifeLine": "Detailed analysis of the Jeevana Rekha (life line) - length, depth, markings, what it reveals about vitality and major life events",
  "heartLine": "Detailed analysis of the Hridaya Rekha (heart line) - emotional nature, love life, relationship patterns in Indian astrological tradition",
  "headLine": "Detailed analysis of the Mastishka Rekha (head line) - intellect, thinking patterns, decision making from Vedic perspective",
  "fateLine": "Detailed analysis of the Bhagya Rekha (fate line) - career destiny, life path, karmic mission",
  "sunLine": "Analysis of the Surya Rekha (sun line) - fame, success, creative talents, solar energy",
  "mountVenus": "Analysis of the Shukra Parvat (Mount of Venus) - love nature, artistic ability, sensuality",
  "personality": "Deep personality analysis based on hand shape, finger lengths, and overall palm structure from Indian tradition",
  "career": "Career and wealth predictions based on fate line, sun line, and mercury mount",
  "love": "Love life and relationship insights from heart line, Venus mount, and marriage lines",
  "health": "Health insights from life line, health line, and overall palm vitality",
  "spiritual": "Spiritual path and soul purpose based on Indian mythology and palmistry traditions",
  "vedicInsight": "2-sentence Vedic astrology insight connecting palm features to planetary influences",
  "mythologyInsight": "2-sentence connection to Hindu mythology and deities relevant to this palm reading",
  "luckyNumbers": "Lucky numbers 1-9 based on numerology of birth date and palm features (e.g., '3, 7, 9')",
  "luckyColors": "Lucky colors from Vedic tradition (e.g., 'Gold, Deep Red')",
  "favorableTime": "Most favorable time period or day (e.g., 'Thursday mornings')"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_completion_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${image}`, detail: 'high' },
            },
            { type: 'text', text: userPrompt },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? '{}';

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    res.json(analysis);
  } catch (error) {
    console.error('Palm analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze palm' });
  }
});

router.post('/translate-reading', async (req, res) => {
  try {
    const { analysis, language } = req.body;
    if (!analysis || !language) {
      res.status(400).json({ error: 'analysis and language are required' });
      return;
    }
    const langName = language && LANGUAGE_NAMES[language] ? LANGUAGE_NAMES[language] : 'English';
    if (langName === 'English') {
      res.json({ analysis });
      return;
    }

    const fields = [
      'overview', 'lifeLine', 'heartLine', 'headLine', 'fateLine', 'sunLine',
      'mountVenus', 'personality', 'career', 'love', 'health', 'spiritual',
      'vedicInsight', 'mythologyInsight', 'luckyNumbers', 'luckyColors', 'favorableTime',
    ];

    const sourceText = fields.map(k => `${k}: ${analysis[k] || ''}`).join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_completion_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: `You are a precise translator specializing in Indian palmistry and spiritual texts. Translate the given palm reading text into ${langName}. Preserve the spiritual and poetic tone. Output ONLY a valid JSON object with the same keys as input, with values translated into ${langName}. Do not add any other text.`,
        },
        {
          role: 'user',
          content: `Translate these palm reading fields to ${langName}. Return ONLY a JSON object with these exact keys:\n\n${sourceText}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid translation response');
    const translated = JSON.parse(jsonMatch[0]);

    res.json({ analysis: { ...analysis, ...translated } });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

export default router;

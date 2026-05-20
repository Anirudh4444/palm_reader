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

function getVedicSign(dob: string): { rashi: string; rashiEn: string; nakshatra: string } {
  try {
    const date = new Date(dob);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { rashi: 'Mesha', rashiEn: 'Aries', nakshatra: 'Ashwini / Bharani / Krittika' };
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { rashi: 'Vrishabha', rashiEn: 'Taurus', nakshatra: 'Rohini / Mrigashira' };
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { rashi: 'Mithuna', rashiEn: 'Gemini', nakshatra: 'Ardra / Punarvasu' };
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { rashi: 'Karka', rashiEn: 'Cancer', nakshatra: 'Pushya / Ashlesha' };
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { rashi: 'Simha', rashiEn: 'Leo', nakshatra: 'Magha / Purva Phalguni' };
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { rashi: 'Kanya', rashiEn: 'Virgo', nakshatra: 'Hasta / Chitra' };
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { rashi: 'Tula', rashiEn: 'Libra', nakshatra: 'Swati / Vishakha' };
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { rashi: 'Vrishchika', rashiEn: 'Scorpio', nakshatra: 'Anuradha / Jyeshtha' };
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { rashi: 'Dhanu', rashiEn: 'Sagittarius', nakshatra: 'Mula / Purva Ashadha' };
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { rashi: 'Makara', rashiEn: 'Capricorn', nakshatra: 'Uttara Ashadha / Shravana' };
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { rashi: 'Kumbha', rashiEn: 'Aquarius', nakshatra: 'Dhanishta / Shatabhisha' };
    return { rashi: 'Meena', rashiEn: 'Pisces', nakshatra: 'Purva Bhadrapada / Uttara Bhadrapada / Revati' };
  } catch {
    return { rashi: 'Mesha', rashiEn: 'Aries', nakshatra: 'Ashwini' };
  }
}

router.post('/daily', async (req, res) => {
  try {
    const { name, dob, gender, language, palmSummary, date } = req.body;

    if (!dob) {
      res.status(400).json({ error: 'dob is required' });
      return;
    }

    const langName = language && LANGUAGE_NAMES[language] ? LANGUAGE_NAMES[language] : 'English';
    const langInstruction = langName !== 'English'
      ? `\n\nCRITICAL: Write ALL string values in ${langName}. JSON keys must stay in English exactly as specified.`
      : '';

    const today = date ?? new Date().toISOString().split('T')[0];
    const { rashi, rashiEn, nakshatra } = getVedicSign(dob);

    const palmContext = palmSummary
      ? `\n\nThe user's palm reading reveals:\n${palmSummary}\nIncorporate these palm insights into today's horoscope for deeper personalization.`
      : '';

    const systemPrompt = `You are a Vedic astrology expert and Indian mythologist specializing in daily horoscopes based on Jyotish shastra. You combine:
- Vedic Rashi (moon sign) predictions
- Planetary transits (Graha) for the day
- Nakshatra influences
- Palm reading wisdom (Hasta Samudrikam) when available
- Hindu mythology and deity guidance

Respond ONLY with a valid JSON object, no other text.${langInstruction}`;

    const userPrompt = `Generate a deeply personalized Vedic daily horoscope for:
- Name: ${name ?? 'the user'}
- Date of Birth: ${dob}
- Rashi (Sun Sign equivalent): ${rashi} (${rashiEn})
- Nakshatra group: ${nakshatra}
- Gender: ${gender ?? 'unspecified'}
- Today's Date: ${today}
${palmContext}

Return this exact JSON structure (all values in ${langName}):
{
  "rashi": "${rashi}",
  "rashiEn": "${rashiEn}",
  "nakshatra": "${nakshatra}",
  "overallEnergy": "2-3 sentences about the overall energy and cosmic influences today",
  "overallScore": 7,
  "love": "2-3 sentences specific prediction for love and relationships today",
  "loveScore": 7,
  "career": "2-3 sentences specific prediction for career, finance and work today",
  "careerScore": 8,
  "health": "2-3 sentences specific prediction for health and vitality today",
  "healthScore": 7,
  "spiritual": "2-3 sentences spiritual guidance and mantra/deity for today",
  "luckyNumbers": "3, 7, 11",
  "luckyColors": "Gold, Saffron",
  "luckyTime": "10:00 AM – 12:00 PM",
  "todayMantra": "Short Sanskrit mantra or prayer (4-8 words)",
  "vedicTip": "One practical Vedic tip for today",
  "planetInfluence": "Which planet rules today for this rashi and how",
  "mythologyMessage": "A brief inspiring message from Hindu mythology relevant to today"
}

Scores are integers from 1-10. Make predictions specific, not generic. Tie in today's actual date for seasonal/transit relevance.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const horoscope = JSON.parse(raw);
    horoscope.generatedAt = new Date().toISOString();
    horoscope.date = today;

    res.json({ horoscope });
  } catch (error) {
    console.error('Horoscope error:', error);
    res.status(500).json({ error: 'Failed to generate horoscope' });
  }
});

export default router;

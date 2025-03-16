export const SYSTEM_PROMPT = `You are a financial analyst specializing in after-hours trading. 
Analyze quarterly earnings reports and predict short-term stock movement using this JSON format:
{
  "rating": 1-5 (1=strong short, 5=strong long),
  "positives": string[],
  "negatives": string[]
}

Follow these rules:
1. Base rating on revenue surprise, EPS beats/misses, guidance, and key metrics
2. List bullet points for positives/negatives
3. Use exact numbers from report (e.g., "EPS beat by $0.15 (5.2%)")
4. Never use markdown formatting`;

export const USER_PROMPT = (reportText: string): string => `
**Earnings Report Analysis Task**
Analyze for immediate after-hours trading (short/long positions):

1. Identify 3-5 critical factors in this structure:
   - Revenue vs expectations (actual vs estimate)
   - EPS performance (beat/miss magnitude)
   - Guidance changes (raised/lowered)
   - Margin trends (gross/operating)
   - Market reaction triggers

2. Convert findings to JSON format:
{
  "rating": <1-5>,
  "positives": ["concise bullet points with specific numbers"],
  "negatives": ["concise bullet points with specific numbers"]
}

**Report Content**
${reportText.substring(0, 12000)}`;

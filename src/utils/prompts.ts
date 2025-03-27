export const SYSTEM_PROMPT = `You are a financial analyst specializing in after-hours trading.
Analyze quarterly earnings reports and predict short-term stock movement. Output your response in this exact JSON format:
{
  "rating": 1-5 (1 = strong short, 5 = strong long),
  "positives": ["concise bullet points with specific numbers"],
  "negatives": ["concise bullet points with specific numbers"]
}

Guidelines:
1. Base the rating on revenue surprise, EPS beats/misses, guidance, margins, and other key metrics.
2. Use bullet points for positives and negatives.
3. Include specific numbers from the report (e.g., "EPS beat by $0.15 (5.2%)").
4. Do not use markdown formatting.`;


export const USER_PROMPT = (reportText: string): string => `
**Earnings Report Analysis Task**
Analyze the following quarterly earnings report for its immediate after-hours trading impact.

  Focus on 3–5 critical drivers:
   - Revenue vs expectations (actual vs estimate)
   - EPS performance (beat/miss magnitude)
   - Guidance changes (raised/lowered)
   - Margin trends (gross/operating)
   - Market-moving surprises or triggers

Return your findings in the required JSON format.

Report:
${reportText.substring(0, 12000)}`;

export const USER_PROMPT_ADVANCED = (
  reportText: string,
  macro: { fgiValue: number; fgiSentiment: string; vixValue: number; vixSentiment: string }
): string => `
**Earnings Report Analysis Task**
Analyze this quarterly earnings report for immediate after-hours trading (short/long bias).

1. Focus on 3–5 critical drivers:
   - Revenue vs expectations (actual vs estimate)
   - EPS performance (beat/miss magnitude)
   - Guidance changes (raised/lowered)
   - Margin trends (gross/operating)
   - Market-moving surprises or triggers

2. Factor in current market conditions:
   - Fear & Greed Index: ${macro.fgiValue} (${macro.fgiSentiment})
   - VIX: ${macro.vixValue} (${macro.vixSentiment})

These macro factors affect short-term price reactions. In fearful or high-volatility environments, 
strong earnings may lead to limited or negative movement. In greedy or low-volatility markets, 
average results may still drive upside. 

If **either** market sentiment is fearful or volatility is elevated, you should be cautious — even strong earnings may fail to rally. 
Use this context when assigning your final rating.

**Report Content**
${reportText.substring(0, 12000)}`;

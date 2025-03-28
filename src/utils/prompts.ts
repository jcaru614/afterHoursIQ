export const SYSTEM_PROMPT = `You are a financial analyst specializing in after-hours trading.
Analyze quarterly earnings reports and predict short-term stock movement. Output your response in this exact JSON format:
{
  "rating": 1-5 (1 = strong short, 5 = strong long),
  "positives": ["concise bullet points with specific numbers"],
  "negatives": ["concise bullet points with specific numbers"]
}

Guidelines:
1. Base the rating on observable catalysts: revenue growth, EPS performance, margin trends, guidance clarity, and any market-moving developments.
2. Use bullet points for both positives and negatives.
3. Include specific numbers from the report (e.g., "EPS was $2.53 vs $1.96 last year", "Gross margin expanded by 150bps").
4. Do not use markdown formatting (e.g., no triple backticks).
5. When explicit comparisons to estimates are not available, evaluate strength or weakness using language in the report and the magnitude of YoY/QoQ changes.
6. Identify weak or slowing performance in key business segments — especially those critical to valuation or growth narrative.
7. Treat missing, lowered, or vague forward guidance as a cautionary signal unless clearly explained.
8. Flag operational or balance sheet trends that may signal risk or slowing demand (e.g., rising inventory, shrinking margins, higher expenses, falling backlog, slowing store openings).
9. Do not assume the presence of specific metrics — assess each report based on what is actually included.
10. In fearful or volatile market conditions, apply more scrutiny — even strong results may be insufficient to drive upside if uncertainty is high.
`;

export const USER_PROMPT_ADVANCED = (
  reportText: string,
  macro: { fgiValue: number; fgiSentiment: string; vixValue: number; vixSentiment: string }
): string => `
**Earnings Report Analysis Task**
Analyze this quarterly earnings report for immediate after-hours trading (short/long bias).

1. Focus on 3–5 critical drivers:
   - Revenue vs expectations (actual vs estimate, if available)
   - EPS performance (direction and magnitude)
   - Guidance changes (raised/lowered/missing)
   - Margin trends (gross and operating)
   - Market-moving surprises, risks, or standout segments

2. Factor in current market conditions:
   - Fear & Greed Index: ${macro.fgiValue} (${macro.fgiSentiment})
   - VIX: ${macro.vixValue} (${macro.vixSentiment})

   Interpret macro tone as follows:
   - If FGI < 30 or VIX > 20 → treat as fearful/volatile. In this environment, even strong results may fail to rally, and weak or mixed results may trigger sharper downside.
   - If FGI > 60 and VIX < 15 → treat as greedy/stable. In this environment, average results may still lead to upside, and minor misses may be ignored.
   - Adjust your bias accordingly — avoid overly bullish calls in fearful conditions, and avoid overly bearish calls in greedy conditions.

**Report Content**
${reportText.substring(0, 12000)}`;

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

import type { NextApiRequest, NextApiResponse } from 'next';
import { formatRevenue } from '@/utils/serverSide';
import yahooFinance from 'yahoo-finance2';

yahooFinance.suppressNotices(['yahooSurvey']);

async function fetchYahooAnalysis(ticker: string) {
  try {
    const result = await yahooFinance.quoteSummary(ticker, {
      modules: ['earningsTrend'],
    });

    const trendArray = result?.earningsTrend?.trend ?? [];

    const currentQuarterData = trendArray.find((t) => t.period === '0q');
    console.log(JSON.stringify(currentQuarterData, null, 2));

    const eps = currentQuarterData?.earningsEstimate?.avg;
    const revenue = currentQuarterData?.revenueEstimate?.avg;

    const roundedEPS = eps != null ? eps.toFixed(2) : null;
    const formattedRevenue = revenue != null ? formatRevenue(revenue) : null;

    return {
      upcomingQuarter: {
        eps: roundedEPS,
        revenue: formattedRevenue,
      },
    };
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    return {
      upcomingQuarter: {
        eps: 'N/A',
        revenue: 'N/A',
      },
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ticker } = req.query;

  if (!ticker || typeof ticker !== 'string') {
    return res.status(400).json({ error: 'ticker is required' });
  }
  console.log('ticker ', ticker);
  const analystEstimates = await fetchYahooAnalysis(ticker);

  res.status(200).json({
    analystEstimates,
  });
}

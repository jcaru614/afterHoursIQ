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
    return { upcomingQuarter: null };
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
// ** Use as backup if yahoo finance package doesnt work **
// async function fetchYahooAnalysis(ticker: string) {
//   try {
//     const browser = await puppeteer.launch({ headless: true });
//     const page = await browser.newPage();

//     await page.setUserAgent(
//       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
//     );

//     await page.goto(`https://finance.yahoo.com/quote/${ticker}/analysis`, {
//       waitUntil: 'domcontentloaded',
//     });

//     const html = await page.content();
//     await browser.close();

//     const $ = cheerio.load(html);

//     let revenue: string | undefined;
//     try {
//       const revenueSection = $('section[data-testid="revenueEstimate"]');
//       const revenueRow = revenueSection.find('td:contains("Avg. Estimate")').first().parent();
//       revenue = revenueRow.find('td').eq(1).text().trim();
//     } catch (err) {
//       console.warn('Revenue parse failed:', err);
//     }

//     let eps: string | undefined;
//     try {
//       const epsSection = $('section[data-testid="earningsEstimate"]');
//       const epsRow = epsSection.find('td:contains("Avg. Estimate")').first().parent();
//       eps = epsRow.find('td').eq(1).text().trim();
//     } catch (err) {
//       console.warn('EPS parse failed:', err);
//     }

//     return {
//       upcomingQuarter: {
//         eps: eps || null,
//         revenue: revenue || null,
//       },
//     };
//   } catch (error) {
//     console.error('Yahoo analysis fetch error:', error);
//     return { upcomingQuarter: null };
//   }
// }

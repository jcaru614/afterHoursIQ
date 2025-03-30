import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function fetchYahooAnalysis(ticker: string) {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
    );

    await page.goto(`https://finance.yahoo.com/quote/${ticker}/analysis`, {
      waitUntil: 'domcontentloaded',
    });

    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);

    let revenue: string | undefined;
    try {
      const revenueSection = $('section[data-testid="revenueEstimate"]');
      const revenueRow = revenueSection.find('td:contains("Avg. Estimate")').first().parent();
      revenue = revenueRow.find('td').eq(1).text().trim();
    } catch (err) {
      console.warn('Revenue parse failed:', err);
    }

    let eps: string | undefined;
    try {
      const epsSection = $('section[data-testid="epsTrend"]');
      const epsRow = epsSection.find('td:contains("Current Estimate")').first().parent();
      eps = epsRow.find('td').eq(1).text().trim();
    } catch (err) {
      console.warn('EPS parse failed:', err);
    }

    return {
      upcomingQuarter: {
        eps: eps || null,
        revenue: revenue || null,
      },
    };
  } catch (error) {
    console.error('Yahoo analysis fetch error:', error);
    return { upcomingQuarter: null };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ticker } = req.query;

  if (!ticker || typeof ticker !== 'string') {
    return res.status(400).json({ error: 'ticker is required' });
  }

  const analystEstimates = await fetchYahooAnalysis(ticker);

  res.status(200).json({
    analystEstimates,
  });
}

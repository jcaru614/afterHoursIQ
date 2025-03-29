import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import puppeteer from 'puppeteer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ticker } = req.query;
  if (!ticker || typeof ticker !== 'string') {
    return res.status(400).json({ error: 'Ticker is required' });
  }

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
  };

  // Yahoo via Puppeteer
  async function fetchYahoo(ticker: string): Promise<string | null> {
    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setUserAgent(headers['User-Agent']);
      await page.goto(`https://finance.yahoo.com/quote/${ticker}/analysis`, {
        waitUntil: 'domcontentloaded',
      });

      const content = await page.content();
      await browser.close();
      return content;
    } catch (error) {
      console.error('Yahoo fetch error:', error);
      return null;
    }
  }

  async function fetchTradingView(ticker: string): Promise<string | null> {
    try {
      const { data } = await axios.get(`https://www.tradingview.com/symbols/${ticker}/earnings/`, {
        headers,
      });
      return data;
    } catch (error) {
      console.error('TradingView fetch error:', error);
      return null;
    }
  }

  async function fetchFinviz(ticker: string): Promise<string | null> {
    try {
      const { data } = await axios.get(`https://finviz.com/quote.ashx?t=${ticker}`, { headers });
      return data;
    } catch (error) {
      console.error('Finviz fetch error:', error);
      return null;
    }
  }

  async function fetchZacks(ticker: string): Promise<string | null> {
    try {
      const { data } = await axios.get(`https://www.zacks.com/stock/quote/${ticker}`, { headers });
      return data;
    } catch (error) {
      console.error('Zacks fetch error:', error);
      return null;
    }
  }

  // Fetch each individually
  const [yahooHtml, tradingViewHtml, finvizHtml, zacksHtml] = await Promise.all([
    fetchYahoo(ticker),
    fetchTradingView(ticker),
    fetchFinviz(ticker),
    fetchZacks(ticker),
  ]);

  res.status(200).json({
    tradingview: tradingViewHtml,
    yahoo: yahooHtml,
    zacks: zacksHtml,
    finviz: finvizHtml,
  });
}

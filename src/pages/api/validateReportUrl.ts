import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import puppeteer from 'puppeteer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let browser = null;

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid URL parameter' });
    }

    try {
      new URL(url);
    } catch {
      return res.status(400).json({ valid: false });
    }

    const isPDF = url.toLowerCase().endsWith('.pdf');
    const isAspx = url.toLowerCase().includes('.aspx');

    if (isPDF) {
      try {
        const response = await axios.get(url, { timeout: 5000 });
        if (!response.data || response.data.length < 200) throw new Error('Too small');
        return res.status(200).json({ valid: true });
      } catch {
        return res.status(400).json({ valid: false });
      }
    }

    if (!isAspx) {
      try {
        const response = await axios.get(url, { timeout: 5000 });
        if (!response.data || response.data.length < 200) throw new Error('Too small');
        return res.status(200).json({ valid: true });
      } catch {
        return res.status(400).json({ valid: false });
      }
    }

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
      );
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });

      const html = await page.content();
      if (!html || html.length < 200) throw new Error('Empty HTML');

      return res.status(200).json({ valid: true });
    } catch {
      return res.status(400).json({ valid: false });
    }
  } finally {
    if (browser) await browser.close();
  }
}

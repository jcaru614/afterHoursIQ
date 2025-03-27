import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import puppeteer, { Browser, Page } from 'puppeteer';
import pdf from 'pdf-parse';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let browser: Browser | null = null;
  let page: Page | null = null;

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
      console.warn('[Invalid URL Format]', url);
      return res.status(400).json({ valid: false });
    }

    const isPDF = url.toLowerCase().endsWith('.pdf');
    const isAspx = url.toLowerCase().includes('.aspx');

    if (isPDF) {
      try {
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 5000,
        });
        const data = await pdf(response.data);
        if (!data.text.trim()) throw new Error('Empty PDF');
        return res.status(200).json({ valid: true });
      } catch (err) {
        console.error('[PDF Validation Error]', err);
        return res.status(400).json({ valid: false });
      }
    }

    if (!isAspx) {
      try {
        const response = await axios.get(url, { timeout: 5000 });
        const html = response.data;
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article?.textContent?.trim()) throw new Error('Empty HTML article');
        return res.status(200).json({ valid: true });
      } catch (err) {
        console.warn('[HTML Fallback Failed]', err);
        return res.status(400).json({ valid: false });
      }
    }

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
      );

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      const html = await page.content();

      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();
      if (!article?.textContent?.trim()) throw new Error('Empty content via Puppeteer');

      return res.status(200).json({ valid: true });
    } catch (err) {
      console.error('[Puppeteer Fallback Error]', err);
      return res.status(400).json({ valid: false });
    }
  } catch (error) {
    console.error('[Validation Error]', error);
    return res.status(400).json({ valid: false });
  } finally {
    if (browser) await browser.close();
  }
}

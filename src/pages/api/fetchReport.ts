/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { SYSTEM_PROMPT, USER_PROMPT } from '@/utils/prompts';
import { hasCorrectQuarter, hasCorrectYear } from '@/utils/serverSide';
import pdf from 'pdf-parse';
import { predictNextQuarterUrl } from '@/lib/predictNextQuarterUrl';
import * as cheerio from 'cheerio';
import * as fuzz from 'fuzzball';
import puppeteer from 'puppeteer';

const SCANING_INTERVAL = 60 * 1000;
const MAX_SCANING_TIME = 3 * 60 * 1000;

const scanForMatchingReportUrl = async (
  predictedUrl: string,
  reportsPageUrl: string,
  quarter: string,
  year: string
): Promise<string | null> => {
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_SCANING_TIME) {
    console.log(`[scanAttempt: Puppeteer Page Scan] #${Date.now()}`);

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
      );

      await page.goto(reportsPageUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      const html = await page.content();
      await browser.close();

      const $ = cheerio.load(html);

      const hrefs = new Set<string>();
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !href.startsWith('#')) {
          const fullHref = href.startsWith('http') ? href : new URL(href, reportsPageUrl).href;
          hrefs.add(fullHref);
        }
      });

      let links = Array.from(hrefs);
      console.log(`[PageScan] Found ${links.length} links`);

      links = links.filter((link) => {
        try {
          const { pathname } = new URL(link);
          return pathname.length > 10 && pathname !== '/' && pathname !== '';
        } catch {
          return false;
        }
      });

      const matches = fuzz.extract(predictedUrl, links, {
        scorer: fuzz.token_set_ratio,
        returnObjects: true,
        limit: 15,
      });

      console.log('[FuzzyMatch] Best matches:', matches, '[FuzzyMatch] length:', matches.length);

      for (const match of matches) {
        if (
          match.score > 85 &&
          hasCorrectQuarter(match.choice, quarter) &&
          hasCorrectYear(match.choice, year)
        ) {
          return match.choice;
        }
      }
    } catch (error) {
      console.error('[Error] Puppeteer scaning error:', error);
    }

    await new Promise((resolve) => setTimeout(resolve, SCANING_INTERVAL));
  }

  return null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { quarter, year, previousReportUrl, reportsPageUrl } = req.body;

    const predictedUrl = predictNextQuarterUrl(previousReportUrl, quarter, year);
    console.log({ 'Predicted URL': predictedUrl });

    const reportUrl = await scanForMatchingReportUrl(predictedUrl, reportsPageUrl, quarter, year);

    if (!reportUrl) {
      return res.status(408).json({ error: 'Maximum scaning time reached. Report not found.' });
    }

    console.log('[ContentRequest] Fetching content...');
    let reportContent = '';
    const isAspx = new URL(reportUrl).pathname.toLowerCase().includes('.aspx');
    const isPDF = new URL(reportUrl).pathname.toLowerCase().includes('.pdf');

    if (isPDF) {
      try {
        const pdfResponse = await axios.get(reportUrl, {
          responseType: 'arraybuffer',
          timeout: 15000,
        });
        const pdfData = await pdf(pdfResponse.data);
        reportContent = pdfData.text.replace(/\s+/g, ' ').trim();
      } catch (pdfError) {
        console.log('[PDF] Parsing failed:', pdfError);
        return res.status(500).json({ error: 'Failed to extract PDF text' });
      }
    } else if (isAspx) {
      console.log('[ASPX] Parsing via Puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
      );
      await page.goto(reportUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      const html = await page.content();
      await browser.close();

      const $ = cheerio.load(html);
      reportContent = $('body').text().replace(/\s+/g, ' ').trim();
    } else {
      try {
        const diffbotResponse = await axios.get('https://api.diffbot.com/v3/article', {
          params: { token: process.env.DIFFBOT_API_KEY, url: reportUrl },
          timeout: 15000,
        });
        reportContent = diffbotResponse.data.objects[0]?.text;
      } catch (diffbotError) {
        console.log('[Diffbot] Fallback failed, trying cheerio');
        const fallbackResponse = await axios.get(reportUrl, {
          responseType: 'arraybuffer',
          timeout: 15000,
        });
        const html = fallbackResponse.data.toString('utf-8');
        const $ = cheerio.load(html);
        reportContent = $('body').text().replace(/\s+/g, ' ').trim();
      }
    }

    if (!reportContent) return res.status(500).json({ error: 'Failed to extract report text' });

    console.log('[OpenAIRequest] Analyzing report...');
    // const openAIResponse = await axios.post(
    //   'https://api.openai.com/v1/chat/completions',
    //   {
    //     model: 'gpt-4-turbo',
    //     messages: [
    //       { role: 'system', content: SYSTEM_PROMPT },
    //       { role: 'user', content: USER_PROMPT(reportContent) },
    //     ],
    //     temperature: 0.7,
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    //       'Content-Type': 'application/json',
    //     },
    //     timeout: 30000,
    //   }
    // );

    // const responseContent = openAIResponse.data.choices[0]?.message?.content;
    // if (!responseContent) return res.status(500).json({ error: 'AI analysis failed' });

    // const parsedResponse = JSON.parse(responseContent);
    // return res.status(200).json({
    //   rating: parsedResponse.rating,
    //   positives: parsedResponse.positives,
    //   negatives: parsedResponse.negatives,
    //   reportUrl: reportUrl,
    // });
    return res.status(200).json(reportContent);
  } catch (error) {
    console.error('[FatalError]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

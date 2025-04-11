import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import {
  FAST_SCAN_DURATION,
  SCAN_INTERVAL_FAST,
  SCAN_INTERVAL_SLOW,
  MAX_SCANING_TIME,
  hasCorrectQuarter,
  hasCorrectYear,
  hasQuarterYearCombo,
} from '@/utils/serverSide';
import { predictUpcomingQuarterUrl, getChatCompletion, extractContentWithDiffbot } from '@/lib';
import { SYSTEM_PROMPT, USER_PROMPT } from '@/utils/prompts';
import pdf from 'pdf-parse';
import * as cheerio from 'cheerio';
import * as fuzz from 'fuzzball';
import puppeteer, { Browser, Page } from 'puppeteer';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const scanForMatchingReportUrl = async (
  predictedUrl: string,
  reportsPageUrl: string,
  quarter: string,
  year: string,
  page: Page
): Promise<string | null> => {
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_SCANING_TIME) {
    console.log(`[scanAttempt: Puppeteer Page Scan]`);

    try {
      await page.goto(reportsPageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      const html = await page.content();
      const $ = cheerio.load(html);
      const hrefs = new Set<string>();

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !href.startsWith('#')) {
          const fullHref = href.startsWith('http') ? href : new URL(href, reportsPageUrl).href;
          hrefs.add(fullHref);
        }
      });
      const prevPathLength = new URL(predictedUrl).pathname.length;

      const links = Array.from(hrefs).filter((link) => {
        try {
          const { pathname } = new URL(link);
          return pathname !== '/' && pathname !== '' && pathname.length >= prevPathLength - 20;
        } catch {
          return false;
        }
      });

      const matches = fuzz.extract(predictedUrl, links, {
        scorer: fuzz.token_set_ratio,
        returnObjects: true,
        limit: 15,
      });

      console.log('[FuzzyMatch] Best matches:', matches);

      for (const match of matches) {
        if (
          (match.score > 90 &&
            hasCorrectQuarter(match.choice, quarter) &&
            hasCorrectYear(match.choice, year)) ||
          hasQuarterYearCombo(match.choice, quarter, year)
        ) {
          const totalTime = (Date.now() - startTime) / 1000;
          console.log(`[Match Found] in ${totalTime}s - match url: ${match.choice}`);
          return match.choice;
        }
      }
    } catch (error) {
      console.error('[Puppeteer Scan Error]', error);
    }

    const elapsed = Date.now() - startTime;
    const delay = elapsed < FAST_SCAN_DURATION ? SCAN_INTERVAL_FAST : SCAN_INTERVAL_SLOW;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  console.warn('[Scan Timeout] No matching report found');
  return null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const {
      quarter,
      year,
      previousReportUrl,
      reportsPageUrl,
      fearAndGreedIndex,
      analystEstimates,
    } = req.body;

    const predictedUrl = predictUpcomingQuarterUrl(previousReportUrl, quarter, year);
    console.log({ 'Predicted URL': predictedUrl });

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-http2'],
    });

    page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
    );

    const reportUrl = await scanForMatchingReportUrl(
      predictedUrl,
      reportsPageUrl,
      quarter,
      year,
      page
    );

    if (!reportUrl) {
      return res.status(408).json({ error: 'Maximum scanning time reached. Report not found.' });
    }

    let reportContent = '';
    const isAspx = new URL(reportUrl).pathname.toLowerCase().includes('.aspx');
    const isPDF = new URL(reportUrl).pathname.toLowerCase().includes('.pdf');
    console.log('[ContentRequest] Fetching content...');
    if (isPDF) {
      try {
        const pdfResponse = await axios.get(reportUrl, {
          responseType: 'arraybuffer',
          timeout: 15000,
        });
        const pdfData = await pdf(pdfResponse.data);
        reportContent = pdfData.text.replace(/\s+/g, ' ').trim();
      } catch (error) {
        console.error('[PDF Parsing Error]', error);
        return res.status(500).json({ error: 'Failed to extract PDF text' });
      }
    } else if (isAspx) {
      try {
        await page.goto(reportUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        const html = await page.content();

        const dom = new JSDOM(html, { url: reportUrl });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        reportContent = article?.textContent?.replace(/\s+/g, ' ').trim() || '';
      } catch (error) {
        console.error('[ASPX Parsing Error]', error);
        return res.status(500).json({ error: 'Failed to extract ASPX report content' });
      }
    } else {
      try {
        const reportText = await extractContentWithDiffbot(reportUrl);
        reportContent = reportText;
      } catch (error) {
        console.error('[Diffbot Parsing Error]', error);
        return res.status(500).json({ error: 'Failed to extract HTML report via Diffbot' });
      }
    }

    if (!reportContent) {
      console.error('[ContentError] Report content is empty after parsing.');
      return res.status(500).json({ error: 'Failed to extract report text' });
    }

    const aiResponseContent = await getChatCompletion(
      SYSTEM_PROMPT,
      USER_PROMPT(
        reportContent,
        {
          fgiValue: parseFloat(fearAndGreedIndex.value),
          fgiSentiment: fearAndGreedIndex.sentiment,
        },
        {
          eps: analystEstimates.eps,
          revenue: analystEstimates.revenue,
        }
      )
    );

    const parsedResponse = JSON.parse(aiResponseContent);
    console.log('getChatCompletion parse Response ', parsedResponse);
    return res.status(200).json({
      rating: parsedResponse.rating,
      positives: parsedResponse.positives,
      negatives: parsedResponse.negatives,
      reportUrl: reportUrl,
    });

    // return res.status(200).json({ predictedUrl, reportUrl, reportContent });
  } catch (error) {
    console.error('[FatalError]', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

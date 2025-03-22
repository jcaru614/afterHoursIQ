/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { SYSTEM_PROMPT, USER_PROMPT } from '@/utils/prompts';
import pdf from 'pdf-parse';
import { predictNextQuarterUrl } from '@/lib/predictNextQuarterUrl';
const POLLING_INTERVAL = 60 * 1000;
const MAX_POLLING_TIME = 3 * 60 * 1000;
const PDF_CONTENT_TYPES = ['application/pdf', 'application/octet-stream'];

const checkReportAvailability = async (url: string): Promise<boolean> => {
  try {
    new URL(url);
    const response = await axios.get(url, {
      validateStatus: (status) => status >= 200 && status < 500,
      responseType: 'arraybuffer',
    });

    console.log(`[CheckReport] Predicted URL: ${url} - Status: ${response}`);

    if (response.status === 404 || response.status !== 200) {
      console.log(`[${response.status}] Unexpected status for: ${url}`);
      return false;
    }

    const contentType = response.headers['content-type'];
    const isPDF = PDF_CONTENT_TYPES.includes(contentType) || url.toLowerCase().endsWith('.pdf');

    let pageContent = '';
    if (isPDF) {
      try {
        const pdfData = await pdf(response.data);
        pageContent = pdfData.text.toLowerCase();
      } catch (pdfError) {
        console.log('[PDF] Parsing failed:', pdfError);
        return false;
      }
    } else {
      pageContent = response.data.toString().toLowerCase();
    }

    const quarterlyReportKeywords = [
      'revenue',
      'eps',
      'net income',
      'guidance',
      'quarterly',
      'gaap',
    ];
    const hasFinancialTerms = quarterlyReportKeywords.some((term) => pageContent.includes(term));
    console.log(`[CheckReport] Financial terms found: ${hasFinancialTerms}`);
    return hasFinancialTerms;
  } catch (error) {
    console.log('[Error] Checking report availability:', error);
    return false;
  }
};

const pollForReport = async (predictedUrl: string): Promise<string | null> => {
  const startTime = Date.now();
  let attempt = 0;

  while (Date.now() - startTime < MAX_POLLING_TIME) {
    attempt++;
    console.log(`[PollAttempt] #${attempt}`);

    try {
      const isAvailable = await checkReportAvailability(predictedUrl);
      if (isAvailable) {
        console.log(`[ReportFound] At: ${predictedUrl}`);
        return predictedUrl;
      }
      console.log(`[Retry] Waiting ${POLLING_INTERVAL / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    } catch (error) {
      throw error;
    }
  }
  return null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { quarter, year, previousReportUrl, reportsPageUrl } = req.body;
    console.log('[Request]', { previousReportUrl, reportsPageUrl, quarter, year });

    const predictedUrl = predictNextQuarterUrl(previousReportUrl, quarter, year);
    console.log({ 'Predicted URL': predictedUrl });

    const reportUrl = await pollForReport(predictedUrl);

    if (!reportUrl) {
      return res.status(408).json({ error: 'Maximum polling time reached. Report not found.' });
    }

    console.log('[ContentRequest] Fetching content...');
    let reportText = '';
    const contentResponse = await axios.get(reportUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
    });

    const contentType = contentResponse.headers['content-type'];
    const isPDF =
      PDF_CONTENT_TYPES.includes(contentType) || reportUrl.toLowerCase().endsWith('.pdf');

    if (isPDF) {
      try {
        const pdfData = await pdf(contentResponse.data);
        reportText = pdfData.text;
      } catch (pdfError) {
        console.log('[PDF] Parsing failed:', pdfError);
        return res.status(500).json({ error: 'Failed to extract PDF text' });
      }
    } else {
      const diffbotResponse = await axios.get('https://api.diffbot.com/v3/article', {
        params: { token: process.env.DIFFBOT_API_KEY, url: reportUrl },
        timeout: 15000,
      });
      reportText = diffbotResponse.data.objects[0]?.text;
    }

    if (!reportText) return res.status(500).json({ error: 'Failed to extract report text' });

    console.log('[OpenAIRequest] Analyzing report...');
    const openAIResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: USER_PROMPT(reportText) },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const responseContent = openAIResponse.data.choices[0]?.message?.content;
    if (!responseContent) return res.status(500).json({ error: 'AI analysis failed' });

    const parsedResponse = JSON.parse(responseContent);
    return res.status(200).json({
      rating: parsedResponse.rating,
      positives: parsedResponse.positives,
      negatives: parsedResponse.negatives,
      reportUrl: reportUrl,
    });
    // res.status(200).json(reportText);
  } catch (error) {
    console.error('[FatalError]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

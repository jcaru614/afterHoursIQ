import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { SYSTEM_PROMPT, USER_PROMPT } from '@/utils/prompts';

const POLLING_INTERVAL = 60 * 1000;
const MAX_POLLING_TIME = 2 * 60 * 1000;

function predictNextQuarterUrl(
	currentUrl: string,
	targetQuarter: number,
	targetYear: number
): string {

	const quarterPatterns = [
		{ regex: /q([1-4])/gi, replace: () => `q${targetQuarter}` },
		{
			regex: /(first|second|third|fourth)(-quarter)?/gi,
			replace: () => ['first', 'second', 'third', 'fourth'][targetQuarter - 1] + (RegExp.$2 || ''),
		},
		{ regex: /quarter[-]?([1-4])/gi, replace: () => `quarter-${targetQuarter}` },
		{ regex: /([1-4])q/gi, replace: () => `${targetQuarter}q` },
		{
			regex: /([1-4])(st|nd|rd|th)[-]?quarter/gi,
			replace: () => `${targetQuarter}${getOrdinalSuffix(targetQuarter)}-quarter`,
		},
	];

	let predictedUrl = currentUrl;

	for (const pattern of quarterPatterns) {
		predictedUrl = predictedUrl.replace(pattern.regex, pattern.replace);
	}

	const yearPatterns = [
		{
			regex: /\b(FY)?(\d{2}|\d{4})\b/g,
			replace: (match, fyPrefix, yearPart) => {
				const fullYear = yearPart.length === 2 ? '20' + yearPart : yearPart;
				if (parseInt(fullYear) !== targetYear) {
					const newYear = fyPrefix
						? `FY${targetYear.toString().slice(-2)}`
						: yearPart.length === 2
						? targetYear.toString().slice(-2)
						: targetYear.toString();
					return fyPrefix ? `FY${newYear}` : newYear;
				}
				return match; 
			},
		},
		{
			regex: /\/(\d{4})\//g,
			replace: (match, year) => {
				return parseInt(year) !== targetYear ? `/${targetYear}/` : match;
			},
		},
		{
			regex: /(\d{4})([^\w/]|$)/g,
			replace: (match, year, trailing) => {
				return parseInt(year) !== targetYear ? `${targetYear}${trailing}` : match;
			},
		},
	];

	for (const pattern of yearPatterns) {
		predictedUrl = predictedUrl.replace(pattern.regex, pattern.replace);
	}

	return predictedUrl;
}

function getOrdinalSuffix(num: number): string {
	const j = num % 10;
	const k = num % 100;
	if (j == 1 && k != 11) return 'st';
	if (j == 2 && k != 12) return 'nd';
	if (j == 3 && k != 13) return 'rd';
	return 'th';
}

const checkReportAvailability = async (url: string, signal: AbortSignal): Promise<boolean> => {
	try {
		new URL(url);
		const response = await axios.get(url, {
			signal,
			validateStatus: (status) => status >= 200 && status < 500,
			timeout: 10000,
		});

		console.log(`[CheckReport] URL: ${url} - Status: ${response.status}`);

		if (response.status === 404 || response.status !== 200) {
			console.log(`[${response.status}] Unexpected status for: ${url}`);
			return false;
		}

		const pageContent = response.data.toLowerCase();
		const quarterlyReportKeywords = ['revenue', 'eps', 'net income', 'guidance', 'quarterly', 'gaap'];

		const hasFinancialTerms = quarterlyReportKeywords.some((term) => pageContent.includes(term));
		console.log(`[CheckReport] Financial terms found: ${hasFinancialTerms}`);
		return hasFinancialTerms;
	} catch (error) {
		if (axios.isCancel(error)) {
			console.log(`[Cancelled] Check aborted for: ${url}`);
			throw error;
		}
		console.log('[Error] Checking report availability:', error);
		return false;
	}
};

const pollForReport = async (predictedUrl: string, signal: AbortSignal): Promise<string | null> => {
	const startTime = Date.now();
	let attempt = 0;

	console.log(`[PollStart] URL: ${predictedUrl}`);

	while (Date.now() - startTime < MAX_POLLING_TIME) {
		attempt++;
		console.log(`[PollAttempt] #${attempt}`);

		if (signal.aborted) {
			console.log('[PollCancelled] Abort signal detected');
			throw new axios.Cancel('Polling cancelled');
		}

		try {
			const isAvailable = await checkReportAvailability(predictedUrl, signal);
			if (isAvailable) {
				console.log(`[ReportFound] At: ${predictedUrl}`);
				return predictedUrl;
			}
			console.log(`[Retry] Waiting ${POLLING_INTERVAL / 1000}s...`);
			await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
		} catch (error) {
			if (axios.isCancel(error)) {
				console.log('[PollCancelled] During check');
				throw error;
			}
			console.log('[PollError]', error);
		}
	}

	console.log('[PollTimeout] Maximum duration reached');
	return null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const controller = new AbortController();
	const { signal } = controller;

	req.on('close', () => {
		console.log('[ConnectionClosed] Client terminated request');
		controller.abort();
	});

	try {
		if (req.method !== 'POST') {
			return res.status(405).json({ error: 'Method Not Allowed' });
		}

		const { quarter, year, url } = req.body;
		console.log('[Request]', { url, quarter, year });

		if (!url || quarter < 1 || quarter > 4) {
			return res.status(400).json({ error: 'Invalid input' });
		}

		const predictedUrl = predictNextQuarterUrl(url, quarter, year);
		console.log('[PredictedURL]', predictedUrl);
		const finalUrl = await pollForReport(predictedUrl, signal);

		if (!finalUrl) {
			return res.status(408).json({ error: 'Maximum polling time reached. Report not found.' });
		}

		console.log('[DiffbotRequest] Fetching article...');
		const diffbotResponse = await axios.get('https://api.diffbot.com/v3/article', {
			params: { token: process.env.DIFFBOT_API_KEY, url: finalUrl },
			signal,
			timeout: 15000,
		});
		const reportText = diffbotResponse.data.objects[0]?.text;
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
				signal,
				timeout: 30000,
			}
		);
		const responseContent = openAIResponse.data.choices[0]?.message?.content;
		if (!responseContent) return res.status(500).json({ error: 'AI analysis failed' });

		return res.status(200).json(JSON.parse(responseContent));
	} catch (error) {
		console.error('[FatalError]', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

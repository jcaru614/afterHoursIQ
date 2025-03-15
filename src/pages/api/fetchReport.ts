import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { SYSTEM_PROMPT, USER_PROMPT } from '@/utils/prompts';

const POLLING_INTERVAL = 60 * 1000;
const MAX_POLLING_TIME = 2 * 60 * 1000;

const checkReportAvailability = async (url: string, signal: AbortSignal): Promise<boolean> => {
	try {
		new URL(url);

		const response = await axios.get(url, {
			signal,
			validateStatus: (status) => status >= 200 && status < 500,
			timeout: 10000,
		});

		console.log(`[CheckReport] URL: ${url} - Status: ${response.status}`);

		if (response.status === 404) {
			console.log(`[404] Report not found at: ${url}`);
			return false;
		}

		if (response.status !== 200) {
			console.log(`[${response.status}] Unexpected status for: ${url}`);
			return false;
		}

		const pageContent = response.data.toLowerCase();
		const quarterlyReportKeywords = [
			'revenue',
			'eps',
			'net income',
			'guidance',
			'quarterly',
			'gaap',
			'non-gaap',
			'outlook',
		];

		const hasFinancialTerms = quarterlyReportKeywords.some((term) =>
			pageContent.includes(term.toLowerCase())
		);

		console.log(`[CheckReport] Financial terms found: ${hasFinancialTerms}`);
		return hasFinancialTerms;
	} catch (error) {
		if (axios.isCancel(error)) {
			console.log(`[Cancelled] Check aborted for: ${url}`);
			throw error;
		}

		if (axios.isAxiosError(error)) {
			console.log(`[Axios Error] ${error.code} - ${error.message}`);
			if (error.response) {
				console.log(`[Response] Status: ${error.response.status}`);
			}
		} else {
			console.log('[Non-Axios Error]', error);
		}

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
	return null; // Indicate polling timeout
};

const fetchReport = async (req: NextApiRequest, res: NextApiResponse) => {
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

		if (!url) {
			return res.status(400).json({ error: 'URL required' });
		}

		try {
			new URL(url);
		} catch (error) {
			console.log(error);
			return res.status(400).json({ error: 'Invalid URL format' });
		}

		const quarterNameMap: { [key: number]: string } = {
			1: 'first',
			2: 'second',
			3: 'third',
			4: 'fourth',
		};
		const quarterNumberMap: { [key: number]: string } = {
			1: 'q1',
			2: 'q2',
			3: 'q3',
			4: 'q4',
		};

		if (!quarterNameMap[quarter] || !quarterNumberMap[quarter]) {
			return res.status(400).json({ error: 'Invalid quarter (1-4)' });
		}

		let predictedUrl = url;
		const quarterNames = Object.values(quarterNameMap);
		const containsQuarterName = quarterNames.some((name) => url.includes(name));
		const containsQuarterNumber = /q[1-4]/i.test(url);

		if (containsQuarterName) {
			predictedUrl = url.replace(new RegExp(`(${quarterNames.join('|')})`, 'i'), quarterNameMap[quarter]);
		} else if (containsQuarterNumber) {
			predictedUrl = url.replace(/q[1-4]/i, quarterNumberMap[quarter]);
		}

		predictedUrl = predictedUrl.replace(/\d{4}/, year.toString());
		console.log('[PredictedURL]', predictedUrl);

		// Poll for the report
		const finalUrl = await pollForReport(predictedUrl, signal);

		if (!finalUrl) {
			console.log('[TimeoutReached] Maximum polling time reached');
			return res.status(408).json({ error: 'Maximum polling time reached. Report not found.' });
		}

		console.log('[DiffbotRequest] Starting...');
		const diffbotResponse = await axios.get('https://api.diffbot.com/v3/article', {
			params: {
				token: process.env.DIFFBOT_API_KEY,
				url: finalUrl,
			},
			signal,
			timeout: 15000,
		});

		const reportText = diffbotResponse.data.objects[0]?.text;
		if (!reportText) {
			return res.status(500).json({ error: 'Failed to extract report text' });
		}

		console.log('[OpenAIRequest] Starting...');
		const openAIResponse = await axios.post(
			'https://api.openai.com/v1/chat/completions',
			{
				model: 'gpt-4',
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
		if (!responseContent) {
			return res.status(500).json({ error: 'AI analysis failed' });
		}

		const ratingMatch = responseContent.match(/Rating: (\d+)/);
		const positivesMatch = responseContent.match(/Positives:([\s\S]*?)(?=\nNegatives:|$)/);
		const negativesMatch = responseContent.match(/Negatives:([\s\S]*)/);

		const result = {
			rating: ratingMatch ? Number(ratingMatch[1]) : 0,
			positives:
				positivesMatch?.[1]
					?.split('\n')
					.filter(Boolean)
					.map((p) => p.replace(/^[-•\d.\s]+/, '').trim()) || [],
			negatives:
				negativesMatch?.[1]
					?.split('\n')
					.filter(Boolean)
					.map((p) => p.replace(/^[-•\d.\s]+/, '').trim()) || [],
		};

		console.log('[Success] Analysis completed');
		return res.status(200).json(result);
	} catch (error) {
		if (axios.isCancel(error)) {
			console.log('[Cancelled] Request aborted');
			return res.status(499).json({ error: 'Request cancelled' });
		}

		console.error('[FatalError]', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
};

export default fetchReport;

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { SYSTEM_PROMPT, USER_PROMPT } from '@/utils/prompts';

const checkReportAvailability = async (url: string) => {
	try {
		const response = await axios.get(url);
		if (response.status !== 200) return false;

		const pageContent = response.data.toLowerCase();
		const quarterlyReportKeywords = [
			'revenue',
			'eps',
			'net income',
			'guidance',
			'quarterly',
			'GAAP',
			'Non-GAAP',
			'Outlook',
		];

		const financialTermsAvailable = quarterlyReportKeywords.some((term) => pageContent.includes(term));
		console.log('financialTermsAvailable ', financialTermsAvailable);
		return financialTermsAvailable;
	} catch (error) {
		console.log('Error checking report availability:', error);
		return false;
	}
};

const POLLING_INTERVAL = 60 * 1000;
const MAX_POLLING_TIME = 3 * 60 * 1000;

const pollForReport = async (predictedUrl: string): Promise<string | null> => {
	const startTime = Date.now();

	while (Date.now() - startTime < MAX_POLLING_TIME) {
		const isAvailable = await checkReportAvailability(predictedUrl);

		if (isAvailable) {
			return predictedUrl;
		}

		console.log(`Report not found. Retrying in ${POLLING_INTERVAL / 1000} seconds...`);
		await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
	}

	return null;
};

const fetchReport = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	const { quarter, year, url } = req.body;

	if (!url) {
		return res.status(400).json({ error: 'URL is required' });
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
		return res.status(400).json({ error: 'Invalid quarter. It should be between 1 and 4.' });
	}

	let predictedUrl = url;

	const quarterNames = ['first', 'second', 'third', 'fourth'];
	const containsQuarterName = quarterNames.some((name) => url.includes(name));
	const containsQuarterNumber = /q[1-4]/.test(url);

	if (containsQuarterName) {
		predictedUrl = url.replace(/(first|second|third|fourth)/, quarterNameMap[quarter]);
	} else if (containsQuarterNumber) {
		predictedUrl = url.replace(/q[1-4]/, quarterNumberMap[quarter]);
	} else {
		console.log('URL format not recognized for quarter; further analysis needed');
	}

	predictedUrl = predictedUrl.replace(/\d{4}/, year);

	console.log('Predicted URL:', predictedUrl);

	const finalUrl = await pollForReport(predictedUrl);
	if (!finalUrl) {
		return res.status(404).json({ error: 'Report not found after multiple attempts' });
	}

	try {
		const diffbotResponse = await axios.get(`https://api.diffbot.com/v3/article`, {
			params: {
				token: process.env.DIFFBOT_API_KEY,
				url: finalUrl,
			},
		});

		const reportText = diffbotResponse.data.objects[0]?.text;
		if (!reportText) {
			return res.status(500).json({ error: 'Failed to extract report text' });
		}

		const openAIResponse = await axios.post(
			'https://api.openai.com/v1/chat/completions',
			{
				model: 'gpt-4',
				messages: [
					{
						role: 'system',
						content: SYSTEM_PROMPT,
					},
					{
						role: 'user',
						content: USER_PROMPT(reportText),
					},
				],
				temperature: 0.7,
			},
			{
				headers: {
					Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
					'Content-Type': 'application/json',
				},
			}
		);

		const responseContent = openAIResponse.data.choices[0]?.message?.content || 'AI analysis failed.';

		const ratingMatch = responseContent.match(/Rating: (\d+)/);
		const rating = ratingMatch ? Number(ratingMatch[1]) : NaN;

		const positivesMatch = responseContent.match(/Positives:([\s\S]*?)(?=\nNegatives:|$)/);
		const positives = positivesMatch
			? positivesMatch[1]
					.trim()
					.split('\n')
					.map((point) => point.replace(/^[-\d.\s]*/, '').trim())
					.filter((point) => point !== '')
			: [];

		const negativesMatch = responseContent.match(/Negatives:([\s\S]*)/);
		const negatives = negativesMatch
			? negativesMatch[1]
					.trim()
					.split('\n')
					.map((point) => point.replace(/^[-\d.\s]*/, '').trim())
					.filter((point) => point !== '')
			: [];

		console.log('openAIResponse ', responseContent, 'matched content', rating, positives, negatives);

		return res.status(200).json({ rating, positives, negatives });
	} catch (error) {
		console.error('Error:', error);
		return res.status(500).json({ error: 'Failed to process the report' });
	}
};

export default fetchReport;

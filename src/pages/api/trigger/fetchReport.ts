import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const fetchReport = async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	const { quarter, year, url } = req.body;

	if (!url) {
		return res.status(400).json({ error: 'URL is required' });
	}

	const quarterMap: { [key: number]: string } = {
		1: 'first',
		2: 'second',
		3: 'third',
		4: 'fourth',
	};

	if (!quarterMap[quarter]) {
		return res.status(400).json({ error: 'Invalid quarter. It should be between 1 and 4.' });
	}

	let modifiedUrl = url.replace(/(first|second|third|fourth)/, quarterMap[quarter]);
	modifiedUrl = modifiedUrl.replace(/\d{4}/, year);

	try {
		const diffbotResponse = await axios.get(`https://api.diffbot.com/v3/article`, {
			params: {
				token: process.env.DIFFBOT_API_KEY,
				url: modifiedUrl,
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
						content:
							'You are a financial analyst specializing in after-hours trading. Your task is to analyze quarterly earnings reports and predict short-term stock movement. Provide a rating from 1 to 5 (1 = sell/short, 5 = buy) based on the report. Your response should include a rating followed by a brief summary of the report. The rating should be written as "Rating: X" (where X is a number from 1 to 5). The summary should directly follow the rating and describe key points of the report.',
					},
					{
						role: 'user',
						content: `Analyze the following earnings report and predict the immediate after-hours stock movement. We are looking to either short or go long immediately after the report is released. Focus on short-term factors such as revenue surprise, EPS beats or misses, forward guidance, and key financial metrics. Rate the stock from 1 to 5 (1 = strong short, 5 = strong long) and provide no justification only a number. Your answer must include the following:
		  
				  1. A rating in the form of "Rating: X" where X is the number (from 1 to 5).
				  2. A short summary of the report, starting immediately after the rating and continuing until the end.
		  
		  \n\n${reportText}`,
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

		// Split the response into Rating and Summary parts
		const ratingMatch = responseContent.match(/Rating: (\d+)/);
		const rating = ratingMatch ? ratingMatch[1] : 'No rating found';

		const summary = responseContent.replace(`Rating: ${rating}`, '').trim();
		console.log('rating and summary ', rating, summary);
		return res.status(200).json({ rating, summary });
	} catch (error) {
		console.error('Error:', error);
		return res.status(500).json({ error: 'Failed to process the report' });
	}
};

export default fetchReport;

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { OpenAI } from 'openai';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const fetchReport = async (req: NextApiRequest, res: NextApiResponse) => {
	const { url } = req.body;

	if (!url) {
		return res.status(400).json({ error: 'URL is required' });
	}

	try {
		const response = await axios.get(url);
		const textContent = response.data;

		const openaiResponse = await openai.chat.completions.create({
			messages: [
				{
					role: 'user',
					content: `Summarize this text: ${textContent}`,
				},
			],
			model: 'gpt-3.5-turbo',
		});

		return res.status(200).json({ summary: openaiResponse.choices[0].message.content });
	} catch (error) {
		console.error('Error fetching report:', error);
		return res.status(500).json({ error: 'An error occurred while processing the request' });
	}
};

export default fetchReport;

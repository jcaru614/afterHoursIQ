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

	console.log('Original URL:', url);

	let modifiedUrl = url.replace(/(first|second|third|fourth)/, quarterMap[quarter]);
	modifiedUrl = modifiedUrl.replace(/\d{4}/, year);

	console.log('Modified URL:', modifiedUrl);

	try {
		const diffbotResponse = await axios.get(`https://api.diffbot.com/v3/article`, {
			params: {
				token: process.env.DIFFBOT_API_KEY,
				url: modifiedUrl,
			},
		});
		console.log('text ', diffbotResponse.data.objects[0].text);
		return res.status(200).json({ data: diffbotResponse.data.objects[0].text });
	} catch (error) {
		console.error('Error fetching article from Diffbot:', error);
		return res.status(500).json({ error: 'Failed to fetch the article from Diffbot' });
	}
};

export default fetchReport;

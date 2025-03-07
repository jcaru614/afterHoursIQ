import { NextApiRequest, NextApiResponse } from 'next';
import { startTask } from './startTask';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === 'POST') {
		try {
			const { quarter, year, url } = req.body;

			if (!quarter || !year || !url) {
				return res.status(400).json({ error: 'quarter, year, and url are required' });
			}

			const handle = await startTask.trigger({ quarter, year, url });
			console.log('handle ', handle);
			res.status(200).json(handle);
		} catch (error) {
			console.error('Error triggering task:', error);
			res.status(500).json({ error: 'Failed to trigger task' });
		}
	} else {
		res.status(405).json({ error: 'Method Not Allowed' });
	}
}

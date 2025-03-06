import { NextApiRequest, NextApiResponse } from 'next';
import { startTask } from './scanReportTask';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method === 'POST') {
		try {
			const handle = await startTask.trigger();
			res.status(200).json({ message: 'Task triggered successfully', taskHandle: handle.id });
		} catch (error) {
			console.error('Error triggering task:', error);
			res.status(500).json({ error: 'Failed to trigger task' });
		}
	} else {
		res.status(405).json({ error: 'Method Not Allowed' });
	}
}

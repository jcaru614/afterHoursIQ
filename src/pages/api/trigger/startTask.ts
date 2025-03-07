import { task } from '@trigger.dev/sdk/v3';
import axios from 'axios';

export const startTask = task({
	id: 'start-task',
	run: async ({ quarter, year, url }: any) => {
		try {
			const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/trigger/fetchReport`, {
				quarter,
				year,
				url,
			});
			console.log('start task', response);
			return response.data;
		} catch (error) {
			console.error('Error calling fetchReport API:', error);
			throw error;
		}
	},
});

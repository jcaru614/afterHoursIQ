import { task, schedules } from '@trigger.dev/sdk/v3';

// export const scanReportTask = schedules.task({
// 	id: 'scan-report-task',
// 	cron: '*/1 * * * *', // Runs every minute
// 	run: async () => {
// 		console.log('Running scan report task!');
// 	},
// });

// Define the task that will be triggered by the button click.
export const startTask = task({
	id: 'start-task',

	run: async () => {
		console.log('Starting the cron job!');
		// Here you could set up the cron job to start after this task is triggered
	},
});

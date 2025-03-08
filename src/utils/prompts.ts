export const SYSTEM_PROMPT =
	'You are a financial analyst specializing in after-hours trading. Your task is to analyze quarterly earnings reports and predict short-term stock movement. Provide a rating from 1 to 5 (1 = sell/short, 5 = buy) based on the report. Your response should include a rating followed by a brief summary of the report. The rating should be written as "Rating: X" (where X is a number from 1 to 5). The summary should directly follow the rating and describe key points of the report.';

	export const USER_PROMPT = (reportText: string): string => `
	Analyze the following earnings report and predict the immediate after-hours stock movement. 
	We are looking to either short or go long immediately after the report is released. 
	Focus on short-term factors such as revenue surprise, EPS beats or misses, forward guidance, and key financial metrics. 
	Rate the stock from 1 to 5 (1 = strong short, 5 = strong long) and provide no justification, only a number. 
	
	Your answer must include the following:
	
	1. A rating in the form of "Rating: X" where X is the number (from 1 to 5).
	2. A short summary of the report, starting immediately after the rating and continuing until the end.
	
	\n\n${reportText}
	`;
	

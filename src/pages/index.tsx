import { useEffect, useState } from 'react';
import { RatingMeter, ReportSummary, Alert } from '@/components';
import axios from 'axios';
import debounce from 'lodash/debounce';

export default function Home() {
	const [url, setUrl] = useState('');
	const [quarter, setQuarter] = useState('');
	const [year, setYear] = useState('');
	const [isScanning, setIsScanning] = useState(false);
	const [quarterError, setQuarterError] = useState('');
	const [yearError, setYearError] = useState('');
	const [rating, setRating] = useState(0);
	const [summary, setSummary] = useState('');
	const currentYear = new Date().getFullYear();
	const validYears = [currentYear, currentYear - 1].map(String);

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUrl(e.target.value);
	};

	const handleQuarterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (/^[1-4]?$/.test(value)) {
			setQuarter(value);
			setQuarterError('');
		} else {
			setQuarterError('Quarter must be between 1 and 4');
		}
	};

	useEffect(() => {
		if (year) {
			debouncedValidateYear(year);
		}
		return () => {
			debouncedValidateYear.cancel();
		};
	}, [year]);

	const debouncedValidateYear = debounce((value: string) => {
		if (value.length === 4 && !validYears.includes(value)) {
			setYearError(`Year must be ${currentYear} or ${currentYear - 1}`);
		} else if (value.length !== 4) {
			setYearError('Year must be 4 digits');
		} else {
			setYearError('');
		}
	}, 2000);

	const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setYear(value);
	};

	const handleStartScanning = async () => {
		if (!url) {
			alert('Please enter a valid URL');
			return;
		}
		if (!quarter || !year) {
			alert('Please enter a valid quarter and year');
			return;
		}
		if (quarterError || yearError) {
			alert('Please fix the errors before proceeding');
			return;
		}

		setIsScanning(true);
		try {
			const { data } = await axios.post(
				'/api/trigger/fetchReport',
				{ url, quarter, year },
				{ headers: { 'Content-Type': 'application/json' } }
			);
			setRating(data.rating);
			setSummary(data.summary);
		} catch (error) {
			console.error('Error fetching the report:', error);
		} finally {
			setIsScanning(false);
		}
	};

	return (
		<div className='flex items-center justify-center min-h-screen bg-background'>
			<div className='text-center'>
				<h1 className='text-4xl font-semibold mb-4'>Quarterly Performance Rating</h1>
				<p className='text-lg text-white-600 mb-6'>
					Your AI-powered guide to stock performance after hours
				</p>
				<div className='mb-4 flex flex-col items-center'>
					<input
						type='url'
						placeholder='Enter previous report URL'
						className='p-2 rounded-md border border-gray-300 w-80 mb-2 text-center'
						value={url}
						onChange={handleUrlChange}
					/>

					<div className='flex items-center space-x-4'>
						<div>
							<input
								type='text'
								placeholder='Quarter (1-4)'
								className='p-2 rounded-md border border-gray-300 w-28 text-center'
								value={quarter}
								onChange={handleQuarterChange}
								maxLength={1}
							/>
							{quarterError && <p className='text-red-500 text-sm'>{quarterError}</p>}
						</div>

						<div>
							<input
								type='text'
								placeholder={`Year (${validYears.join(' or ')})`}
								className='p-2 rounded-md border border-gray-300 w-40 text-center'
								value={year}
								onChange={handleYearChange}
								maxLength={4}
							/>
							{yearError && <p className='text-red-500 text-sm'>{yearError}</p>}
						</div>
					</div>

					<button
						className='mt-4 bg-purple-600 text-white px-4 py-2 rounded-md'
						onClick={handleStartScanning}
						disabled={isScanning}
					>
						{isScanning ? 'Scanning...' : 'Start Scanning'}
					</button>
				</div>
				<div className='mt-6 flex flex-col items-center'>
					<RatingMeter score={rating} />
					<div className='mt-10'>
						<ReportSummary summary={summary} />
					</div>
				</div>
				<Alert rating={rating} />
			</div>
		</div>
	);
}

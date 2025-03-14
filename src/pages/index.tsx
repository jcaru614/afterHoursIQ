import { useState } from 'react';
import { RatingMeter, ReportSummary, Alert } from '@/components';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setReportData } from '@/redux/slice';
import { RootState } from '@/redux/store';

export default function Home() {
	const dispatch = useDispatch();
	const [url, setUrl] = useState<string>('');
	const [quarter, setQuarter] = useState<string>('');
	const [year, setYear] = useState<string>('');
	const [isScanning, setIsScanning] = useState<boolean>(false);
	const [quarterError, setQuarterError] = useState<string>('');
	const [yearError, setYearError] = useState<string>('');
	const currentYear = new Date().getFullYear();
	const validYears = [currentYear, currentYear - 1].map(String);

	const { rating, summary } = useSelector((state: RootState) => state.slice);

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUrl(e.target.value);
	};

	const handleQuarterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		setQuarter(value);
		setQuarterError('');
	};

	const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		setYear(value);
		setYearError('');
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
			const { data } = await axios.post('/api/fetchReport', { url, quarter, year });

			console.log('data ', data);
			dispatch(setReportData({ rating: data.rating, summary: data.summary }));
		} catch (error) {
			console.error('Error fetching the report:', error);
		} finally {
			setIsScanning(false);
		}
	};

	return (
		<div className='flex items-center justify-center min-h-screen p-10 bg-gradient-to-r from-[#1D0F41] to-[#0A0922]'>
			<div className='text-center'>
				<h1 className='text-4xl font-semibold mb-4'>Quarterly Performance Rating</h1>
				<p className='text-lg text-white-600 mb-6'>
					Your AI-powered guide to stock performance after hours
				</p>

				<div className='mb-8 flex flex-col items-center'>
					<input
						type='url'
						placeholder='Enter previous report URL'
						className='p-3 rounded-lg border-1 border-gray-300 bg-[#150C34] w-100 mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all'
						value={url}
						onChange={handleUrlChange}
					/>

					<div className='mb-8 flex flex-col items-center'>
						<div className='flex items-center space-x-6'>
							<div className='flex flex-col items-center'>
								<select
									className='p-3 rounded-lg border-1 border-gray-300 bg-[#150C34] text-white w-45 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all'
									value={quarter}
									onChange={handleQuarterChange}
								>
									<option value=''>Select Quarter</option>
									<option value='1'>Q1</option>
									<option value='2'>Q2</option>
									<option value='3'>Q3</option>
									<option value='4'>Q4</option>
								</select>
								{quarterError && <p className='text-red-500 text-sm mt-2'>{quarterError}</p>}
							</div>

							<div className='flex flex-col items-center'>
								<select
									className='p-3 rounded-lg border-1 border-gray-300 bg-[#150C34] text-white w-45 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all'
									value={year}
									onChange={handleYearChange}
								>
									<option value=''>Select Year</option>
									{validYears.map((yearOption) => (
										<option key={yearOption} value={yearOption}>
											{yearOption}
										</option>
									))}
								</select>
								{yearError && <p className='text-red-500 text-sm mt-2'>{yearError}</p>}
							</div>
						</div>
					</div>

					<button
						className={`px-6 py-3 rounded-md text-white font-semibold ${
							isScanning || !url || !quarter || !year
								? 'bg-gray-400 cursor-not-allowed'
								: 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 focus:ring-4 focus:ring-purple-300'
						}`}
						onClick={handleStartScanning}
						disabled={isScanning || !url || !quarter || !year}
					>
						{isScanning ? 'Scanning...' : 'Start Scanning'}
					</button>
				</div>

				<div className='flex flex-col items-center'>
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

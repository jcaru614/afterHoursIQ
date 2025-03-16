import { useState, useRef } from 'react';
import { RatingMeter, ReportSummary, Alert, Navbar, BrandLogo } from '@/components';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setCompanyDomain, setReportData, setStatusCode } from '@/redux/slice';
import { RootState } from '@/redux/store';

export default function Home() {
	const dispatch = useDispatch();
	const [url, setUrl] = useState<string>('');
	const [quarter, setQuarter] = useState<string>('');
	const [year, setYear] = useState<string>('');
	const [isScanning, setIsScanning] = useState<boolean>(false);
	const currentYear = new Date().getFullYear();
	const validYears = [currentYear, currentYear - 1].map(String);
	const abortControllerRef = useRef<AbortController | null>(null);

	const { rating, positives, negatives, statusCode, companyDomain } = useSelector(
		(state: RootState) => state.slice
	);

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newUrl = e.target.value;
		setUrl(newUrl);
		if (!newUrl) {
			dispatch(setCompanyDomain(null)); 
			return;
		}
		fetchCompanyOverview(newUrl);
	};

	const fetchCompanyOverview = async (url: string) => {
		if (!url.trim()) return;

		console.log('Fetching company overview for URL:', url);

		try {
			const { data } = await axios.get(`/api/fetchCompanyOverview?url=${url}`);
			console.log('Data fetched:', data);

			if (data) {
				dispatch(setCompanyDomain(data.domain));
				// dispatch(setCompanyOverview(data.companyOverview));
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 400) {
					console.error('Bad Request, URL may be invalid');
				} else {
					console.error('Error fetching company overview:', error.response?.data || error.message);
				}
			} else {
				console.error('Unexpected error:', error);
			}
		}
	};

	const handleQuarterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		setQuarter(value);
	};

	const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		setYear(value);
	};

	const handleStartScanning = async () => {
		setIsScanning(true);
		abortControllerRef.current = new AbortController();

		try {
			const { data } = await axios.post(
				'/api/fetchReport',
				{ url, quarter, year },
				{ signal: abortControllerRef.current.signal }
			);

			console.log('data ', data);
			dispatch(
				setReportData({ rating: data.rating, positives: data.positives, negatives: data.negatives })
			);
		} catch (error) {
			if (axios.isCancel(error)) {
				console.log('Request canceled:', error.message);
			} else if (axios.isAxiosError(error) && error.response?.status === 408) {
				console.log('Polling timeout reached:', error.response.data.error);
				dispatch(setStatusCode(error.response.status));
			} else {
				console.error('Error fetching the report:', error);
			}
		} finally {
			setIsScanning(false);
			abortControllerRef.current = null;
		}
	};

	const handleCancelScanning = () => {
		console.log('handleCancelScan');
		if (abortControllerRef.current) {
			abortControllerRef.current.abort('Scanning canceled by user');
			setIsScanning(false);
			abortControllerRef.current = null;
			console.log('handleCancelScan 2');
		}
	};

	return (
		<div className='flex flex-col min-h-screen'>
			<Navbar />

			<div className='flex flex-col items-center p-8 w-full max-w-6xl mx-auto'>
				<div className='grid grid-cols-2 gap-6 w-full'>
					<div className='flex flex-col items-start'>
						<h1 className='text-4xl font-semibold mb-4'>Quarterly Performance Rating</h1>
						<p className='text-lg text-white-600 mb-6'>
							Your AI-powered guide to stock performance after hours
						</p>
					</div>

					<div className='flex flex-row items-center justify-center bg-gradient-to-r from-[#0A0922] to-[#1D0F41] rounded-xl shadow-lg h-[100px] w-full overflow-hidden space-x-4'>
						{companyDomain && (
							<div className='flex items-center justify-center'>
								<BrandLogo domain={companyDomain} />
							</div>
						)}
						<h2 className='text-xl font-bold text-white uppercase'>
							{companyDomain && companyDomain ? companyDomain.replace('.com', '') : ''}
						</h2>
					</div>
				</div>

				<div className='grid grid-cols-2 gap-6 w-full mt-6'>
					<div className='flex flex-col w-full col-span-1'>
						<input
							type='url'
							placeholder='Enter previous report URL'
							className='p-3 rounded-lg border border-gray-300 bg-[#150C34] w-full mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all'
							value={url}
							onChange={handleUrlChange}
						/>
						<div className='flex w-full justify-between mb-4'>
							<select
								className='p-3 rounded-lg border border-gray-300 bg-[#150C34] text-white w-[48%] text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all'
								value={quarter}
								onChange={handleQuarterChange}
							>
								<option value=''>Select Quarter</option>
								<option value='1'>Q1</option>
								<option value='2'>Q2</option>
								<option value='3'>Q3</option>
								<option value='4'>Q4</option>
							</select>
							<select
								className='p-3 rounded-lg border border-gray-300 bg-[#150C34] text-white w-[48%] text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all'
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
						</div>

						<div className='flex w-full gap-4'>
							<button
								className={`px-6 py-3 rounded-md text-white font-semibold flex-1 ${
									isScanning || !url || !quarter || !year
										? 'bg-gray-400 cursor-not-allowed'
										: 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 focus:ring-4 focus:ring-purple-300'
								}`}
								onClick={handleStartScanning}
								disabled={isScanning || !url || !quarter || !year}
							>
								{isScanning ? 'Scanning...' : 'Start Scanning'}
							</button>
							<button
								className={`px-6 py-3 rounded-md text-white font-semibold flex-1 ${
									!isScanning
										? 'bg-gray-400 cursor-not-allowed'
										: 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 focus:ring-4 focus:ring-red-300'
								}`}
								onClick={handleCancelScanning}
								disabled={!isScanning}
							>
								Cancel Scan
							</button>
						</div>
					</div>

					<div className='flex justify-center items-center'>
						<RatingMeter score={rating} />
					</div>
				</div>

				<div className='grid grid-cols-2 gap-6 w-full mt-8'>
					<ReportSummary items={negatives} type='negative' />
					<ReportSummary items={positives} type='positive' />
				</div>

				<Alert rating={rating} statusCode={statusCode} />
			</div>
		</div>
	);
}

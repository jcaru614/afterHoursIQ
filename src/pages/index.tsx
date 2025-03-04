import { useState } from 'react';
import { RatingMeter, ReportSummary } from '@/components';

export default function Home() {
	const [url, setUrl] = useState('');
	const [isScanning, setIsScanning] = useState(false);

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUrl(e.target.value);
	};

	const handleStartScanning = () => {
		if (url) {
			setIsScanning(true);
			setTimeout(() => {
				setIsScanning(false);
			}, 5000);
		} else {
			alert('Please enter a valid URL');
		}
	};

	return (
		<div className='flex items-center justify-center min-h-screen bg-background'>
			<div className='text-center'>
				<h1 className='text-4xl font-semibold mb-4'>Quarterly Performance Rating</h1>
				<p className='text-lg text-white-600 mb-6'>
					Your AI-powered guide to stock performance after hours
				</p>
				<div className='mb-4 flex items-center justify-center'>
					<input
						type='url'
						placeholder='Enter report URL'
						className='p-2 rounded-md border border-gray-300 w-80'
						value={url}
						onChange={handleUrlChange}
					/>
					<button
						className='ml-4 bg-purple-600 text-white px-4 py-2 rounded-md'
						onClick={handleStartScanning}
						disabled={isScanning}
					>
						{isScanning ? 'Scanning...' : 'Start Scanning'}
					</button>
				</div>

				<div className='mt-6 flex flex-col items-center'>
					<RatingMeter score={2} />
					<div className='mt-4'>
						<ReportSummary score={4} />
					</div>
				</div>
			</div>
		</div>
	);
}

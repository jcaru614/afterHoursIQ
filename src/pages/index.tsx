import { RatingMeter } from '@/components';

export default function Home() {
	return (
		<div className='flex items-center justify-center min-h-screen bg-background'>
			<div className='text-center'>
				<h1 className='text-4xl font-semibold mb-4'>Quarterly Performance Rating</h1>
				<p className='text-lg text-white-600 mb-6'>
					Your AI-powered guide to stock performance after hours
				</p>
				<RatingMeter score={3} />
			</div>
		</div>
	);
}

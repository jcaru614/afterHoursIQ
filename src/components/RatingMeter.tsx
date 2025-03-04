import React from 'react';

type RatingMeterProps = {
	score: number;
};

const RatingMeter: React.FC<RatingMeterProps> = ({ score }) => {
	const normalizedScore = score === 0 ? 0 : Math.max(1, Math.min(5, score));
	const needleAngle = normalizedScore === 0 ? -90 : ((normalizedScore - 1) / 4) * 180 - 90; 

	let action = '';
	if (normalizedScore === 0) {
		action = 'No Report'; 
	} else if (normalizedScore === 1) {
		action = 'Strong Short';
	} else if (normalizedScore === 2) {
		action = 'Modest Short';
	} else if (normalizedScore === 3) {
		action = 'Hold';
	} else if (normalizedScore === 4) {
		action = 'Modest Buy';
	} else if (normalizedScore === 5) {
		action = 'Strong Buy';
	}

	const gradientColor = normalizedScore === 0 ? 'gray' : `url(#gaugeGradient)`;

	return (
		<div className='flex flex-col items-center'>
			<h2 className='text-white text-xl font-bold mb-4'>Report Indicator</h2>

			<div className='relative w-64 h-32'>
				<svg viewBox='0 0 100 50' className='w-full h-full'>
					<defs>
						<linearGradient id='gaugeGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
							<stop offset='0%' stopColor='red' />
							<stop offset='33%' stopColor='orange' />
							<stop offset='66%' stopColor='yellow' />
							<stop offset='100%' stopColor='green' />
						</linearGradient>
					</defs>

					<path d='M 10 50 A 40 40 0 0 1 90 50' stroke={gradientColor} strokeWidth='8' fill='none' />

					<line
						x1='50'
						y1='50'
						x2='50'
						y2='10'
						stroke={'white'}
						strokeWidth='2'
						transform={`rotate(${needleAngle}, 50, 50)`}
						style={{ transition: 'transform 0.3s ease-in-out' }}
					/>
				</svg>
			</div>

			<div className='mt-4 text-white text-lg font-bold'>{action}</div>
		</div>
	);
};

export default RatingMeter;

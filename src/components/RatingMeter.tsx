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

	return (
		<div className='flex flex-col items-center'>
			<div className='text-white text-2xl font-semibold'>{action}</div>
			<div className='relative w-80 h-48'>
				<svg viewBox='0 0 120 60' className='w-full h-full'>
					<defs>
						<linearGradient id='gaugeGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
							<stop offset='0%' stopColor='#b91c1c' />
							<stop offset='25%' stopColor='#ea580c' />
							<stop offset='50%' stopColor='#f59e0b' />
							<stop offset='75%' stopColor='#65a30d' />
							<stop offset='100%' stopColor='#15803d' />
						</linearGradient>
					</defs>

					<path
						d='M 10 60 A 50 50 0 0 1 110 60'
						stroke='url(#gaugeGradient)'
						strokeWidth='10'
						fill='none'
						strokeLinecap='round'
					/>

					<line
						x1='60'
						y1='60'
						x2='60'
						y2='10'
						stroke='white'
						strokeWidth='3'
						strokeLinecap='round'
						transform={`rotate(${needleAngle}, 60, 60)`}
						style={{ transition: 'transform 0.5s ease-in-out' }}
					/>

					<circle cx='60' cy='60' r='4' fill='white' />
				</svg>
			</div>
		</div>
	);
};

export default RatingMeter;

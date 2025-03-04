import React from 'react';

type ReportSummaryProps = {
	score: number;
};

const ReportSummary: React.FC<ReportSummaryProps> = ({ score }) => {
	return (
		<div className='p-4 bg-white rounded-lg shadow-md w-96' style={{ minHeight: '100px' }}>
			{score > 0 ? (
				<p className='text-gray-700'>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore
					et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
					aliquip ex ea commodo consequat.
				</p>
			) : (
				<p className='text-gray-700'>Your report summary will show here</p>
			)}
		</div>
	);
};

export default ReportSummary;

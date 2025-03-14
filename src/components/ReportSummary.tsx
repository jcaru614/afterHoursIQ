import React from 'react';

type ReportSummaryProps = {
	summary: string;
};

const ReportSummary: React.FC<ReportSummaryProps> = ({ summary }) => {
	return (
		<div
			className='p-6 bg-gradient-to-r from-purple-700 to-indigo-600 rounded-lg shadow-lg'
			style={{
				height: '400px',
				width: '700px',
				maxHeight: '80vh',
				overflowY: 'auto',
				fontSize: '1.25rem',
				lineHeight: '1.6',
			}}
		>
			{summary !== '' ? (
				<p className='text-white font-medium text-left'>{summary}</p>
			) : (
				<p className='text-white font-medium'>Your report summary will show here</p>
			)}
		</div>
	);
};

export default ReportSummary;

import React from 'react';

type ReportSummaryProps = {
	summary: string;
};

const ReportSummary: React.FC<ReportSummaryProps> = ({ summary }) => {
	return (
		<div
			className='p-6 bg-white rounded-lg shadow-md'
			style={{
				height: '400px',
				width: '700px',
				maxHeight: '80vh',
				overflowY: 'auto',
				fontSize: '1.125rem',
				lineHeight: '1.6',
			}}
		>
			{summary !== '' ? (
				<p className='text-gray-700'>{summary}</p>
			) : (
				<p className='text-gray-700'>Your report summary will show here</p>
			)}
		</div>
	);
};

export default ReportSummary;

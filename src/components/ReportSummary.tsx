type ReportSummaryProps = {
	items: string[] | null;
	type: 'positive' | 'negative';
};

const ReportSummary: React.FC<ReportSummaryProps> = ({ items, type }) => {
	const isPositive = type === 'positive';
	const borderColor = isPositive ? 'border-green-500' : 'border-red-500';
	const bgGradient = isPositive
		? 'bg-gradient-to-b from-[#1e3d26] to-[#2a6d34]'
		: 'bg-gradient-to-b from-[#3a1d32] to-[#47243f]';
	const title = isPositive ? 'Positive' : 'Negative';

	return (
		<div className={`flex-1 p-4 rounded-lg border ${borderColor} shadow-lg ${bgGradient}`}>
			<h2 className='text-white text-xl font-semibold mb-2'>{title}</h2>
			{items && items.length > 0 ? (
				<ul className='list-disc list-outside pl-5 text-left text-white text-lg'>
					{items.map((item, index) => (
						<li key={index} className='my-2'>
							{item}
						</li>
					))}
				</ul>
			) : (
				<p className='text-white'>No {title.toLowerCase()} aspects found</p>
			)}
		</div>
	);
};

export default ReportSummary;

import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';

interface AlertProps {
	rating: number;
}

const Alert: React.FC<AlertProps> = ({ rating }) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (rating > 0) {
			setIsVisible(true);
			const sound = new Audio('/audio/short-beep-alert.wav');
			sound.play();

			const timer = setTimeout(() => {
				setIsVisible(false);
			}, 60000);

			return () => clearTimeout(timer);
		} else {
			setIsVisible(false); // Hide the alert if the rating is 0 or less
		}
	}, [rating]);

	if (!isVisible) return null;
	console.log(rating, typeof rating);
	let bgGradient = '';
	let borderColor = '';
	if (rating > 3) {
		bgGradient = 'bg-gradient-to-b from-[#1e3d26] to-[#2a6d34]';
		borderColor = 'border-green-500';
	} else if (rating === 3) {
		bgGradient = 'bg-gradient-to-b from-[#8b6f2f] to-[#b28d3b]';
		borderColor = 'border-yellow-500';
	} else {
		bgGradient = 'bg-gradient-to-b from-[#3a1d32] to-[#47243f]';
		borderColor = 'border-red-500';
	}

	return (
		<div
			className={`fixed top-20 left-5 p-4 rounded-lg text-white shadow-lg flex items-center justify-between w-50 ${bgGradient} border-2 ${borderColor}`}
		>
			<p className='text-lg'>Signal Ready: {rating}</p>
			<button
				className='ml-1 text-lg font-bold transition-all duration-300 transform hover:scale-125'
				onClick={() => setIsVisible(false)}
			>
				<FaTimes />
			</button>
		</div>
	);
};

export default Alert;

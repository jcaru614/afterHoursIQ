import { useEffect, useState } from 'react';

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
			}, 10000);

			return () => clearTimeout(timer);
		}
	}, [rating]);

	if (!isVisible) return null;

	return (
		<div
			className={`fixed top-4 left-1/2 transform -translate-x-1/2 p-4 rounded-md text-white bg-blue-500`}
		>
			<p>Report Analyzed: {rating}</p>
		</div>
	);
};

export default Alert;

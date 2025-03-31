import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { clearStatusCode } from '@/redux/slice';
import { useDispatch } from 'react-redux';

interface AlertProps {
  rating?: number;
  statusCode?: number;
}

const Alert: React.FC<AlertProps> = ({ rating, statusCode }) => {
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (rating > 0 || statusCode) {
      setIsVisible(true);

      if (!statusCode && rating) {
        const sound = new Audio('/audio/medium-beep-alert.wav');
        sound.play();
      }

      const timer = setTimeout(() => {
        setIsVisible(false);
        dispatch(clearStatusCode());
      }, 60000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [rating, statusCode]);

  if (!isVisible) return null;

  let bgGradient = '';
  let borderColor = '';
  let alertMessage = '';

  if (statusCode === 408) {
    bgGradient = 'bg-gradient-to-b from-[#1e293b] to-[#334155]';
    borderColor = 'border-slate-500';
    alertMessage = `Report Not Found`;
  } else if (statusCode) {
    bgGradient = 'bg-gradient-to-b from-[#7c3f00] to-[#b45309]';
    borderColor = 'border-orange-500';
    alertMessage = `An unexpected error occurred (Error ${statusCode})`;
  } else if (rating > 3) {
    bgGradient = 'bg-gradient-to-b from-[#1e3d26] to-[#2a6d34]';
    borderColor = 'border-green-500';
    alertMessage = `Signal Ready: ${rating}`;
  } else if (rating === 3) {
    bgGradient = 'bg-gradient-to-b from-[#8b6f2f] to-[#b28d3b]';
    borderColor = 'border-yellow-500';
    alertMessage = `Signal Ready: ${rating}`;
  } else {
    bgGradient = 'bg-gradient-to-b from-[#3a1d32] to-[#47243f]';
    borderColor = 'border-red-500';
    alertMessage = `Signal Ready: ${rating}`;
  }

  return (
    <div
      className={`fixed top-20 left-5 p-2 rounded-lg text-white shadow-lg flex items-center justify-between w-50 ${bgGradient} border-2 ${borderColor}`}
    >
      <p className="text-sm">{alertMessage}</p>
      <button
        className="ml-1 font-bold transition-all duration-300 transform hover:scale-125"
        onClick={() => {
          setIsVisible(false);
          dispatch(clearStatusCode());
        }}
      >
        <FiX />
      </button>
    </div>
  );
};

export default Alert;

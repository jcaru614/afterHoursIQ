import React from 'react';
import { FiLoader, FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface ValidatedUrlInputProps {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isValid: boolean | null;
  isLoading: boolean;
}

const ValidatedUrlInput: React.FC<ValidatedUrlInputProps> = ({
  placeholder,
  value,
  onChange,
  isValid,
  isLoading,
}) => {
  const showInvalid = isValid === false && value;

  return (
    <div className="relative w-full mb-4">
      <input
        type="url"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`p-3 pr-10 rounded-lg border ${
          showInvalid ? 'border-red-500' : 'border-gray-300'
        } bg-[#150C34] w-full text-lg focus:outline-none focus:ring-2 ${
          showInvalid
            ? 'focus:ring-red-500 focus:border-red-500'
            : 'focus:ring-purple-500 focus:border-purple-500'
        } transition-all`}
      />
      {isLoading ? (
        <FiLoader className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
      ) : isValid === true ? (
        <FiCheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
      ) : showInvalid ? (
        <FiXCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
      ) : null}
    </div>
  );
};

export default ValidatedUrlInput;

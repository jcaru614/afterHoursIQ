import React from 'react';
interface DropdownSelectProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

const DropdownSelect: React.FC<DropdownSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  className = '',
}) => {
  return (
    <div className="w-full">
      {label && <label className="block mb-1 text-white text-sm">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className={`p-3 rounded-lg border border-gray-300 bg-[#150C34] text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all w-full ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DropdownSelect;

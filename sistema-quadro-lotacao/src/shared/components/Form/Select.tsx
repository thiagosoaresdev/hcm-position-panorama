import React from 'react';
import './Select.css';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  fullWidth?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  options,
  placeholder,
  size = 'md',
  error = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseClass = 'sds-select';
  const sizeClass = `sds-select--${size}`;
  const errorClass = error ? 'sds-select--error' : '';
  const fullWidthClass = fullWidth ? 'sds-select--full-width' : '';

  const selectClasses = [
    baseClass,
    sizeClass,
    errorClass,
    fullWidthClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="sds-select-wrapper">
      <select className={selectClasses} {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      <div className="sds-select__icon">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6,8 10,12 14,8"></polyline>
        </svg>
      </div>
    </div>
  );
};

export default Select;
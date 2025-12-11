import React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  variant = 'default',
  size = 'md',
  error = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseClass = 'sds-input';
  const variantClass = `sds-input--${variant}`;
  const sizeClass = `sds-input--${size}`;
  const errorClass = error ? 'sds-input--error' : '';
  const fullWidthClass = fullWidth ? 'sds-input--full-width' : '';
  const hasIconClass = (leftIcon || rightIcon) ? 'sds-input--has-icon' : '';
  const leftIconClass = leftIcon ? 'sds-input--has-left-icon' : '';
  const rightIconClass = rightIcon ? 'sds-input--has-right-icon' : '';

  const inputClasses = [
    baseClass,
    variantClass,
    sizeClass,
    errorClass,
    fullWidthClass,
    hasIconClass,
    leftIconClass,
    rightIconClass,
    className
  ].filter(Boolean).join(' ');

  if (leftIcon || rightIcon) {
    return (
      <div className="sds-input-wrapper">
        {leftIcon && (
          <div className="sds-input__left-icon">
            {leftIcon}
          </div>
        )}
        <input
          className={inputClasses}
          {...props}
        />
        {rightIcon && (
          <div className="sds-input__right-icon">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }

  return (
    <input
      className={inputClasses}
      {...props}
    />
  );
};

export default Input;
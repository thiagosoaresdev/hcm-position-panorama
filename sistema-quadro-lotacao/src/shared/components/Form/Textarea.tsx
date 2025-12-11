import React from 'react';
import './Textarea.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea: React.FC<TextareaProps> = ({
  size = 'md',
  error = false,
  fullWidth = false,
  resize = 'vertical',
  className = '',
  ...props
}) => {
  const baseClass = 'sds-textarea';
  const sizeClass = `sds-textarea--${size}`;
  const errorClass = error ? 'sds-textarea--error' : '';
  const fullWidthClass = fullWidth ? 'sds-textarea--full-width' : '';
  const resizeClass = `sds-textarea--resize-${resize}`;

  const textareaClasses = [
    baseClass,
    sizeClass,
    errorClass,
    fullWidthClass,
    resizeClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <textarea
      className={textareaClasses}
      {...props}
    />
  );
};

export default Textarea;
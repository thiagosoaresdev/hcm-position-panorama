import React from 'react';
import './FormField.css';

export interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  hint,
  required = false,
  children,
  className = '',
  id
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;

  const fieldClasses = [
    'sds-form-field',
    error ? 'sds-form-field--error' : '',
    className
  ].filter(Boolean).join(' ');

  // Clone children to add necessary props
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        id: fieldId,
        'aria-describedby': [errorId, hintId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? 'true' : undefined,
        ...child.props
      });
    }
    return child;
  });

  return (
    <div className={fieldClasses}>
      {label && (
        <label htmlFor={fieldId} className="sds-form-field__label">
          {label}
          {required && <span className="sds-form-field__required" aria-label="obrigatório">*</span>}
        </label>
      )}
      
      <div className="sds-form-field__control">
        {childrenWithProps}
      </div>
      
      {hint && !error && (
        <div id={hintId} className="sds-form-field__hint">
          {hint}
        </div>
      )}
      
      {error && (
        <div id={errorId} className="sds-form-field__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;
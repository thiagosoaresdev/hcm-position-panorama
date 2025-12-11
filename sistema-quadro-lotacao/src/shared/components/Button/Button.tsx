import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClass = 'sds-button';
  const variantClass = `sds-button--${variant}`;
  const sizeClass = `sds-button--${size}`;
  const loadingClass = loading ? 'sds-button--loading' : '';
  const fullWidthClass = fullWidth ? 'sds-button--full-width' : '';
  const iconOnlyClass = !children && icon ? 'sds-button--icon-only' : '';

  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    loadingClass,
    fullWidthClass,
    iconOnlyClass,
    className
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <span className="sds-button__spinner" />
          {children && <span className="sds-button__text">{children}</span>}
        </>
      );
    }

    if (icon && children) {
      return iconPosition === 'left' ? (
        <>
          <span className="sds-button__icon">{icon}</span>
          <span className="sds-button__text">{children}</span>
        </>
      ) : (
        <>
          <span className="sds-button__text">{children}</span>
          <span className="sds-button__icon">{icon}</span>
        </>
      );
    }

    if (icon && !children) {
      return <span className="sds-button__icon">{icon}</span>;
    }

    return <span className="sds-button__text">{children}</span>;
  };

  return (
    <button
      className={classes}
      disabled={isDisabled}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

export default Button;
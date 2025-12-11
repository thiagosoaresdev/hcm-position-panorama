import React from 'react';
import './Loading.css';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  overlay?: boolean;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  text,
  overlay = false,
  className = ''
}) => {
  const baseClass = 'sds-loading';
  const sizeClass = `sds-loading--${size}`;
  const variantClass = `sds-loading--${variant}`;
  const colorClass = `sds-loading--${color}`;
  const overlayClass = overlay ? 'sds-loading--overlay' : '';

  const classes = [
    baseClass,
    sizeClass,
    variantClass,
    colorClass,
    overlayClass,
    className
  ].filter(Boolean).join(' ');

  const renderSpinner = () => (
    <div className="sds-loading__spinner">
      <div className="sds-loading__spinner-circle"></div>
    </div>
  );

  const renderDots = () => (
    <div className="sds-loading__dots">
      <div className="sds-loading__dot"></div>
      <div className="sds-loading__dot"></div>
      <div className="sds-loading__dot"></div>
    </div>
  );

  const renderPulse = () => (
    <div className="sds-loading__pulse">
      <div className="sds-loading__pulse-circle"></div>
    </div>
  );

  const renderSkeleton = () => (
    <div className="sds-loading__skeleton">
      <div className="sds-loading__skeleton-line sds-loading__skeleton-line--long"></div>
      <div className="sds-loading__skeleton-line sds-loading__skeleton-line--medium"></div>
      <div className="sds-loading__skeleton-line sds-loading__skeleton-line--short"></div>
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      case 'spinner':
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div className={classes} role="status" aria-label={text || 'Carregando'}>
      {renderLoader()}
      {text && (
        <div className="sds-loading__text">
          {text}
        </div>
      )}
      <span className="sr-only">{text || 'Carregando...'}</span>
    </div>
  );

  if (overlay) {
    return (
      <div className="sds-loading-overlay">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
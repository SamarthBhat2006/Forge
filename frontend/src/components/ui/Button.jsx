import React from 'react';

export function Button({ variant = 'primary', children, className = '', ...props }) {
  const baseClass = variant === 'secondary' ? 'btn-secondary' : 'btn-primary';
  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

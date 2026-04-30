import React from 'react';

export function Pill({ variant = 'success', children, className = '' }) {
  const baseClass = variant === 'danger' ? 'pill-danger' : 'pill-success';
  return (
    <span className={`pill ${baseClass} ${className}`}>
      {children}
    </span>
  );
}

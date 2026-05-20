'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  const baseClasses = 'bg-white rounded-lg shadow-md p-4 border border-gray-200';
  const allClasses = `${baseClasses} ${className}`.trim();

  return (
    <div className={allClasses} onClick={onClick}>
      {children}
    </div>
  );
}

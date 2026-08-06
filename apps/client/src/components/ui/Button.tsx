import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'default' | 'lg' | 'icon';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  className = '',
  variant = 'primary',
  size = 'default',
  isLoading = false,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'flex items-center justify-center space-x-2 transition-all disabled:active:scale-100 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500';
  
  let variantStyles = '';
  switch (variant) {
    case 'primary':
      variantStyles = 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 disabled:opacity-70';
      break;
    case 'secondary':
      variantStyles = 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-70';
      break;
    case 'danger':
      variantStyles = 'bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-75';
      break;
  }

  let sizeStyles = '';
  switch (size) {
    case 'default':
      sizeStyles = 'rounded-xl p-3.5 font-semibold text-sm active:scale-[0.98]';
      break;
    case 'lg':
      sizeStyles = 'rounded-xl p-4 font-bold text-lg active:scale-[0.98]';
      break;
    case 'icon':
      sizeStyles = 'rounded-full p-3 shadow-md active:scale-95';
      break;
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={size === 'lg' ? 20 : 18} className="animate-spin" />
      ) : (
        icon
      )}
      {size !== 'icon' && children && <span>{children}</span>}
    </button>
  );
}

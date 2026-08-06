import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  rounded?: 'xl' | 'full';
  inputSize?: 'default' | 'sm';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', wrapperClassName = '', rounded = 'xl', inputSize = 'default', id, ...props }, ref) => {
    // Generate a unique ID if a label exists but no id was provided
    const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-xl';
    const paddingClass = inputSize === 'sm' ? 'px-4 py-3 text-sm' : 'p-4';

    const baseInputStyles = `w-full bg-gray-50 border border-gray-100 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${roundedClass} ${paddingClass}`;
    const errorStyles = error ? 'border-red-300 focus:ring-red-500' : '';

    return (
      <div className={`w-full ${wrapperClassName}`}>
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1"
          >
            {label}
          </label>
        )}
        
        <input
          id={inputId}
          ref={ref}
          className={`${baseInputStyles} ${errorStyles} ${className}`}
          {...props}
        />
        
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

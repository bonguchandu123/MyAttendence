import React from 'react';
import { classNames } from '../../utils/helpers';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <div className={classNames('w-full', className)}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-primary-900 mb-1">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-primary-400" />
          </div>
        )}
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={classNames(
            'block w-full rounded-lg border transition-smooth',
            Icon ? 'pl-10 pr-4' : 'px-4',
            'py-2 text-sm',
            error
              ? 'border-error-300 focus:border-error-500 focus:ring-error-500'
              : 'border-primary-300 focus:border-accent-500 focus:ring-accent-500',
            disabled ? 'bg-primary-100 cursor-not-allowed' : 'bg-white',
            'placeholder:text-primary-400'
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}
    </div>
  );
};

export default Input;
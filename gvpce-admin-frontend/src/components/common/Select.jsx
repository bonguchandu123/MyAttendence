import React from 'react';
import { ChevronDown } from 'lucide-react';
import { classNames } from '../../utils/helpers';

const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error,
  required = false,
  disabled = false,
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
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={classNames(
            'block w-full rounded-lg border transition-smooth appearance-none',
            'px-4 py-2 pr-10 text-sm',
            error
              ? 'border-error-300 focus:border-error-500 focus:ring-error-500'
              : 'border-primary-300 focus:border-accent-500 focus:ring-accent-500',
            disabled ? 'bg-primary-100 cursor-not-allowed' : 'bg-white',
            'text-primary-900'
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className="h-5 w-5 text-primary-400" />
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}
    </div>
  );
};

export default Select;
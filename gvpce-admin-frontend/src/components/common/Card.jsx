import React from 'react';
import { classNames } from '../../utils/helpers';

const Card = ({
  children,
  title,
  subtitle,
  actions,
  padding = true,
  hover = false,
  className = '',
}) => {
  return (
    <div
      className={classNames(
        'bg-white rounded-lg border border-primary-200 shadow-sm',
        hover && 'card-hover cursor-pointer',
        className
      )}
    >
      {(title || subtitle || actions) && (
        <div className="px-6 py-4 border-b border-primary-200 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-primary-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-primary-600 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padding ? 'p-6' : ''}>
        {children}
      </div>
    </div>
  );
};

export default Card;
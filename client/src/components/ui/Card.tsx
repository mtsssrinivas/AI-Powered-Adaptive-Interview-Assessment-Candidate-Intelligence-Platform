import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  sectionNumber?: string;
  sectionTitle?: string;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  sectionNumber,
  sectionTitle,
  headerAction,
}) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${className}`}>
      {(sectionTitle || sectionNumber) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            {sectionNumber && (
              <span className="font-mono text-xs font-semibold text-slate-400">
                {sectionNumber}
              </span>
            )}
            {sectionTitle && (
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-700">
                {sectionTitle}
              </h3>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};

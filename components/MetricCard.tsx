import React from 'react';
import { Tooltip } from './Tooltip';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  tooltip?: string;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue, trend, tooltip, highlight }) => {
  return (
    <div className={`p-5 rounded-xl border ${highlight ? 'bg-brand-50 border-brand-200' : 'bg-white border-gray-100'} shadow-sm flex flex-col justify-between h-full`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-gray-500">{label}</h4>
        {tooltip && (
          <Tooltip content={tooltip}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 cursor-help">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </Tooltip>
        )}
      </div>
      <div>
        <div className={`text-2xl font-bold ${highlight ? 'text-brand-900' : 'text-gray-900'}`}>{value}</div>
        {subValue && (
          <div className="text-xs text-gray-500 mt-1">{subValue}</div>
        )}
      </div>
    </div>
  );
};

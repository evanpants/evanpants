import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="group relative flex">
      {children}
      <div className="absolute bottom-full left-1/2 mb-2 hidden w-48 -translate-x-1/2 whitespace-normal rounded bg-gray-800 p-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:block group-hover:opacity-100 z-50">
        {content}
        <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-800"></div>
      </div>
    </div>
  );
};

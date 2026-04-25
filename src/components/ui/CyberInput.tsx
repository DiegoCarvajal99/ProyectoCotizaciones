import React from 'react';

interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const CyberInput: React.FC<CyberInputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className} ${className.includes('text-center') ? 'items-center' : ''}`}>
      <label className={`text-[10px] font-mono text-gray-400 uppercase tracking-widest ${className.includes('text-center') ? 'text-center' : ''}`}>{label}</label>
      <input 
        className={`bg-[#050505]/50 border border-[#00A3E0]/30 rounded-xl px-4 py-2.5 text-sm font-mono text-white uppercase focus:outline-none focus:border-[#00A3E0] focus:ring-2 focus:ring-[#00A3E0]/50 shadow-inner transition-all duration-300 w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-700 ${className.includes('text-center') ? 'text-center' : ''}`}
        {...props}
      />
    </div>
  );
};

import React from 'react';

export const CyberButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = "px-6 py-2.5 font-mono text-xs uppercase tracking-widest font-medium transition-all duration-300 hover:scale-[1.02] flex items-center justify-center";
  
  const variants = {
    primary: "bg-gradient-to-r from-[#00A3E0] to-blue-600 hover:from-[#00A3E0] hover:to-blue-500 text-white rounded-full shadow-[0_0_15px_rgba(0,163,224,0.3)] hover:shadow-[0_0_25px_rgba(0,163,224,0.5)] border-none",
    secondary: "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white rounded-full shadow-md",
    danger: "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-full shadow-md hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
  };

  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

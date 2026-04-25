import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

export const StatusFooter: React.FC = () => {
  const [time, setTime] = useState('');
  const [counts, setCounts] = useState({ PRV: 0, PRD: 0, CLI: 0, COT: 0 });

  useEffect(() => {
    // Clock
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    tick();
    const timer = setInterval(tick, 1000);

    // Event listener for counts
    const handleUpdate = (e: any) => {
      const { module, count } = e.detail;
      setCounts(prev => {
        if (module === 'Proveedores') return { ...prev, PRV: count };
        if (module === 'Clientes') return { ...prev, CLI: count };
        if (module === 'Productos') return { ...prev, PRD: count };
        if (module === 'Cotizaciones') return { ...prev, COT: count };
        return prev;
      });
    };
    
    window.addEventListener('updateRecordCount', handleUpdate);

    return () => {
      clearInterval(timer);
      window.removeEventListener('updateRecordCount', handleUpdate);
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-[#050505] border-t border-[#00A3E0]/20 flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-[#39ff8f] rounded-full animate-pulse shadow-[0_0_8px_rgba(57,255,143,0.8)]" />
          <span className="text-[10px] font-mono text-[#39ff8f] font-bold tracking-widest">SYSTEM_ONLINE</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-gray-500 uppercase">
          <div className="flex gap-1.5"><span>PRV:</span><span className="text-[#00A3E0]">{counts.PRV}</span></div>
          <div className="flex gap-1.5"><span>PRD:</span><span className="text-[#00A3E0]">{counts.PRD}</span></div>
          <div className="flex gap-1.5"><span>CLI:</span><span className="text-[#00A3E0]">{counts.CLI}</span></div>
          <div className="flex gap-1.5"><span>COT:</span><span className="text-[#00A3E0]">{counts.COT}</span></div>
        </div>

      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500">
          <Activity size={10} />
          <span>NET: 12ms</span>
        </div>
        <span className="text-[10px] font-mono text-[#ffb800] tracking-widest text-shadow-neon">{time}</span>
      </div>
    </div>
  );
};

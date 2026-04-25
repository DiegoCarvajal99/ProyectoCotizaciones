import React from 'react';
import { LayoutDashboard, Users, Package, FileText, Menu } from 'lucide-react';

interface BottomNavProps {
  currentPath: string;
  onMenuClick: () => void;
}

const navItems = [
  { name: 'Inicio', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Productos', href: '/productos', icon: Package },
  { name: 'Quotes', href: '/cotizaciones', icon: FileText },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentPath, onMenuClick }) => {
  return (
    <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[50] w-[90%] max-w-md">
      <div className="glass-panel bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-around p-2 shadow-2xl shadow-[#00A3E0]/20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
          
          return (
            <a 
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[64px] transition-all duration-300 relative ${isActive ? 'text-[#00A3E0]' : 'text-gray-500'}`}
            >
              {isActive && (
                <div className="absolute -top-1 w-1 h-1 bg-[#00A3E0] rounded-full shadow-[0_0_10px_#00A3E0] animate-pulse"></div>
              )}
              <Icon size={20} className={isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,163,224,0.6)]' : ''} />
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest">{item.name}</span>
            </a>
          );
        })}
        
        <button 
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-1 p-2 min-w-[64px] text-gray-500 hover:text-white transition-colors"
        >
          <Menu size={20} />
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest">Más</span>
        </button>
      </div>
    </nav>
  );
};

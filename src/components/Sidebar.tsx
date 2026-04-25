import React from 'react';
import { LayoutDashboard, Users, Server, FileText, Package, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from './auth/AuthContext';
import { auth } from '../lib/firebase';
import { CyberConfirm } from './ui/CyberConfirm';
import { Loader2 } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, adminOnly: false },
  { name: 'Proveedores', href: '/proveedores', icon: Server, adminOnly: false },
  { name: 'Productos', href: '/productos', icon: Package, adminOnly: false },
  { name: 'Clientes', href: '/clientes', icon: Users, adminOnly: false },
  { name: 'Cotizaciones', href: '/cotizaciones', icon: FileText, adminOnly: false },
  { name: 'Admin', href: '/admin', icon: ShieldAlert, adminOnly: true },
];

export const Sidebar: React.FC<{ currentPath: string; isMobile?: boolean; onClose?: () => void }> = ({ currentPath, isMobile, onClose }) => {
  const { isAdmin, profile, user } = useAuth();
  
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);
  
  // Fail-safe: Direct check for Super User email from Auth
  const isSuperUser = user?.email?.toLowerCase() === 'diegoandres2015k@gmail.com';
  const canSeeAdmin = isAdmin || isSuperUser;

  const handleLogout = () => {
    setIsConfirmOpen(true);
  };

  const confirmLogout = () => {
    setIsConfirmOpen(false);
    setIsExiting(true);
    
    // Smooth transition delay before actual signout
    setTimeout(() => {
      auth.signOut().then(() => {
        window.location.href = '/login';
      });
    }, 800);
  };

  return (
    <aside className={`${isMobile ? 'w-72 h-full' : 'w-64 hidden lg:flex'} border-r border-[#00A3E0]/20 bg-[#050505] flex flex-col relative z-20`}>
      <div className="p-6 border-b border-[#00A3E0]/20 flex items-center justify-between">
        <div>
          <h1 className="font-black text-2xl italic tracking-tighter text-white">
            MT<span className="text-[#00A3E0] text-shadow-neon">_SYS</span>
          </h1>
          <p className="text-[9px] font-mono text-[#00A3E0]/60 uppercase tracking-widest mt-1">
            Terminal de Control v4
          </p>
        </div>
        {isMobile && (
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white transition-colors lg:hidden"
          >
            <LogOut size={20} className="rotate-180" />
          </button>
        )}
      </div>
      
      <nav className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          if (item.adminOnly && !canSeeAdmin) return null;
          
          const Icon = item.icon;
          const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
          
          return (
            <a 
              key={item.name}
              href={item.href} 
              onClick={isMobile ? onClose : undefined}
              className={`flex items-center gap-4 px-6 py-4 transition-all duration-300 relative group overflow-hidden ${isActive ? 'text-[#00A3E0]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00A3E0] shadow-[0_0_15px_#00A3E0] z-20"></div>}
              {isActive && <div className="absolute inset-0 bg-gradient-to-r from-[#00A3E0]/10 via-[#00A3E0]/5 to-transparent z-0"></div>}
              
              <div className={`relative z-10 transition-transform duration-500 ${isActive ? 'scale-110 drop-shadow-[0_0_10px_rgba(0,163,224,0.8)]' : 'group-hover:scale-110 group-hover:text-[#00A3E0]'}`}>
                <Icon size={20} />
              </div>
              <span className={`relative z-10 text-[11px] font-mono uppercase tracking-[0.2em] font-bold ${isActive ? 'text-shadow-neon' : ''}`}>
                {item.name}
              </span>
            </a>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-md">
        {profile && (
          <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A3E0]/20 to-blue-600/20 flex items-center justify-center border border-[#00A3E0]/30 shadow-inner">
              <span className="text-[#00A3E0] font-black text-sm italic">{profile.empresa?.[0] || profile.email?.[0]?.toUpperCase() || 'U'}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-[10px] font-mono text-white font-bold uppercase truncate">{profile.empresa || 'Usuario'}</p>
              <p className="text-[8px] font-mono text-[#00A3E0] uppercase tracking-widest flex items-center gap-1">
                <div className="w-1 h-1 bg-[#00A3E0] rounded-full animate-pulse"></div>
                {profile.role === 'admin' ? 'Super Admin' : 'Operador'}
              </p>
            </div>
          </div>
        )}
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 text-red-500/70 hover:text-red-500 transition-all duration-300 font-mono text-[10px] uppercase tracking-[0.2em] font-black group bg-red-500/5 hover:bg-red-500/10 rounded-2xl border border-red-500/10 hover:border-red-500/30 shadow-lg"
        >
          <LogOut size={16} className="group-hover:rotate-12 transition-transform" />
          Desconectar
        </button>
      </div>
      {/* Logout Confirmation */}
      <CyberConfirm 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmLogout}
        title="¿CERRAR SESIÓN?"
        message="Estás a punto de salir del centro de control MT_SYS. ¿Confirmas la desconexión del sistema?"
      />

      {/* Exit Transition Overlay */}
      {isExiting && (
        <div className="fixed inset-0 z-[9999] bg-[#0A0A0B] animate-in fade-in duration-700 flex flex-col items-center justify-center">
          <div className="relative">
            <Loader2 className="text-[#00A3E0] animate-spin mb-4" size={48} />
            <div className="absolute inset-0 bg-[#00A3E0]/20 blur-2xl rounded-full"></div>
          </div>
          <p className="text-[#00A3E0] font-mono text-xs uppercase tracking-[0.3em] animate-pulse">
            Desconectando Terminal...
          </p>
        </div>
      )}
    </aside>
  );
};

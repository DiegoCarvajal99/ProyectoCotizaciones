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

export const Sidebar: React.FC<{ currentPath: string }> = ({ currentPath }) => {
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
    <aside className="w-64 border-r border-[#00A3E0]/20 bg-[#050505] flex flex-col relative z-20">
      <div className="p-6 border-b border-[#00A3E0]/20">
        <h1 className="font-black text-2xl italic tracking-tighter text-white">
          MT<span className="text-[#00A3E0] text-shadow-neon">_SYS</span>
        </h1>
        <p className="text-[9px] font-mono text-[#00A3E0]/60 uppercase tracking-widest mt-1">
          Terminal de Control v4
        </p>
      </div>
      
      <nav className="flex-1 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          if (item.adminOnly && !canSeeAdmin) return null;
          
          const Icon = item.icon;
          const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
          
          return (
            <a 
              key={item.name}
              href={item.href} 
              className={`flex items-center gap-3 px-6 py-3 transition-all duration-300 relative group overflow-hidden ${isActive ? 'text-[#00A3E0]' : 'text-gray-500 hover:text-white'}`}
            >
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00A3E0] shadow-[0_0_10px_#00A3E0]"></div>}
              {isActive && <div className="absolute inset-0 bg-gradient-to-r from-[#00A3E0]/10 to-transparent"></div>}
              
              <div className={`relative z-10 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,163,224,0.8)]' : 'group-hover:text-[#00A3E0] transition-colors'}`}>
                <Icon size={18} />
              </div>
              <span className={`relative z-10 text-xs font-mono uppercase tracking-[0.15em] ${isActive ? 'text-shadow-neon' : ''}`}>
                {item.name}
              </span>
            </a>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-4 mb-12">
        {profile && (
          <div className="flex flex-col gap-1 px-2">
            <p className="text-[9px] font-mono text-gray-500 uppercase truncate">{profile.email}</p>
            <p className="text-[9px] font-mono text-[#00A3E0] uppercase tracking-widest">
              {profile.role === 'admin' ? 'Acceso Total' : 'Operador'}
            </p>
          </div>
        )}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-2 py-3 text-gray-500 hover:text-red-500 transition-colors font-mono text-[10px] uppercase tracking-widest group bg-white/5 rounded-xl border border-white/5"
        >
          <LogOut size={16} className="group-hover:rotate-12 transition-transform text-red-500/50" />
          Cerrar Sesión
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

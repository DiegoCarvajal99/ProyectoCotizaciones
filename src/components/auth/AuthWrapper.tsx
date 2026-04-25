import React from 'react';
import { AuthProvider } from './AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { Sidebar } from '../Sidebar';
import { StatusFooter } from '../ui/StatusFooter';
import { useAuth } from './AuthContext';
import { Sun, Moon, Sunrise, Clock, AlertTriangle, ShieldAlert, Menu, X } from 'lucide-react';
import { CyberModal } from '../ui/CyberModal';
import { CyberButton } from '../ui/CyberButton';
import { BottomNav } from '../ui/BottomNav';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  currentPath: string;
  title: string;
}

const HeaderContent: React.FC<{ displayTitle: string; currentPath: string }> = ({ displayTitle, currentPath }) => {
  const { profile } = useAuth();
  
  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return { text: '¡Buenos días!' };
    if (hour >= 12 && hour < 18) return { text: '¡Buenas tardes!' };
    return { text: '¡Buenas noches!' };
  };

  const getExpirationData = () => {
    if (!profile?.accessExpiration) return null;
    
    // accessExpiration is a Firestore Timestamp
    const expiryDate = profile.accessExpiration.toDate();
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let colorClass = 'text-[#00A3E0]';
    let label = 'Activa';
    
    if (diffDays <= 0) {
      colorClass = 'text-red-500';
      label = 'Expirada';
    } else if (diffDays <= 7) {
      colorClass = 'text-yellow-500';
      label = 'Expira pronto';
    }

    const formattedDate = expiryDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();

    return { formattedDate, colorClass, label, diffDays };
  };

  const greeting = getGreetingData();
  const expiration = getExpirationData();
  const userName = profile?.empresa || profile?.email?.split('@')[0] || 'Usuario';

  return (
    <header className="mb-8 lg:mb-12">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-1000">
          
          {/* Greeting Block (Left Side) */}
          <div className="flex flex-col items-start">
            {currentPath === '/' ? (
              <>
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Terminal / Activa</span>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs lg:text-sm font-mono font-bold text-white uppercase tracking-tight">
                    {greeting.text}, <span className="text-[#00A3E0]">{userName}</span>
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-1.5 h-1.5 bg-[#00A3E0]"></div>
                <span className="text-[8px] lg:text-[9px] font-mono text-[#00A3E0] uppercase tracking-[0.3em]">MT_SYS / {currentPath.replace('/', '') || 'Dashboard'}</span>
              </div>
            )}
          </div>

          {/* Expiration Block (Right Side) - Hidden for Admins */}
          {profile?.accessExpiration && profile.role !== 'admin' && (
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Membresía / Expira</span>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono font-bold ${expiration?.colorClass}`}>
                  {expiration?.formattedDate}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${expiration?.diffDays && expiration.diffDays <= 7 ? 'bg-yellow-500 animate-pulse' : 'bg-[#00A3E0]'}`}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const ExpiryReminder: React.FC = () => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!profile?.accessExpiration || !profile?.uid) return;

    const expiryDate = profile.accessExpiration.toDate();
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Only show if 5 days or less remaining
    if (diffDays <= 5 && diffDays > -30) {
      const todayStr = now.toISOString().split('T')[0];
      const lastShown = localStorage.getItem(`last_expiry_notice_${profile.uid}`);

      if (lastShown !== todayStr) {
        setIsOpen(true);
        localStorage.setItem(`last_expiry_notice_${profile.uid}`, todayStr);
      }
    }
  }, [profile]);

  if (!profile?.accessExpiration) return null;
  const diffDays = Math.ceil((profile.accessExpiration.toDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <CyberModal 
      isOpen={isOpen} 
      onClose={() => setIsOpen(false)} 
      title="ALERTA DE SISTEMA: MEMBRESÍA"
    >
      <div className="flex flex-col items-center text-center py-6">
        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 border border-yellow-500/20 animate-pulse">
          <ShieldAlert className="text-yellow-500" size={32} />
        </div>
        
        <h3 className="text-xl font-mono font-bold text-white mb-2 uppercase tracking-tighter">
          Tu membresía está por expirar
        </h3>
        
        <p className="text-gray-400 text-sm font-mono leading-relaxed max-w-xs mb-8">
          Quedan <span className="text-yellow-500 font-bold">{diffDays} días</span> de acceso total. 
          Renueva tu suscripción para evitar interrupciones en el sistema.
        </p>

        <div className="w-full h-px bg-white/5 mb-8"></div>

        <CyberButton onClick={() => setIsOpen(false)} variant="primary" className="w-full">
          ENTENDIDO / CERRAR
        </CyberButton>
      </div>
    </CyberModal>
  );
};

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children, requireAdmin = false, currentPath, title }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <AuthProvider>
      <ProtectedRoute requireAdmin={requireAdmin}>
        <div className="flex h-screen overflow-hidden bg-[#0A0A0B]">
          
          {/* Mobile Drawer Overlay */}
          {isMenuOpen && (
            <div 
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300 animate-in fade-in"
              onClick={() => setIsMenuOpen(false)}
            />
          )}

          {/* Sidebar - Handles both mobile drawer and desktop fixed state */}
          <div className={`
            fixed inset-y-0 left-0 z-[70] lg:relative lg:z-20 transition-transform duration-300 ease-out lg:translate-x-0
            ${isMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <Sidebar currentPath={currentPath} isMobile={true} onClose={() => setIsMenuOpen(false)} />
          </div>

          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            
            {/* Mobile Header */}
            <div className="lg:hidden h-16 bg-[#050505] border-b border-[#00A3E0]/10 flex items-center justify-between px-6 z-40">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#00A3E0] rounded-sm rotate-45"></div>
                <span className="font-black text-xl italic tracking-tighter text-white">
                  MT<span className="text-[#00A3E0] text-shadow-neon">_SYS</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end mr-2">
                  <span className="text-[7px] font-mono text-[#00A3E0]/60 uppercase tracking-widest">Estado</span>
                  <span className="text-[9px] font-mono text-green-500 uppercase font-bold tracking-tighter flex items-center gap-1">
                    Online <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse shadow-[0_0_4px_#39ff8f]"></div>
                  </span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto custom-scrollbar pb-32 lg:pb-8 bg-[#080808] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00A3E0]/5 via-transparent to-transparent">
              <div className="max-w-6xl mx-auto p-4 lg:p-8">
                <HeaderContent displayTitle={title} currentPath={currentPath} />
                <ExpiryReminder />
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                  {children}
                </div>
              </div>
            </main>

            <BottomNav currentPath={currentPath} onMenuClick={() => setIsMenuOpen(true)} />
            
            <div className="hidden lg:block">
              <StatusFooter />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
};


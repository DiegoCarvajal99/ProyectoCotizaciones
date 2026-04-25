import React, { useState } from 'react';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LogIn, ShieldCheck, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = '/';
    } catch (err: any) {
      setError('Credenciales inválidas. Por favor intente de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00A3E0]/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00A3E0]/5 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="w-16 h-16 bg-[#00A3E0]/10 rounded-2xl flex items-center justify-center border border-[#00A3E0]/20">
              <ShieldCheck size={32} className="text-[#00A3E0]" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-mono text-white uppercase tracking-[0.2em] mb-2">MT_SYS v4.0</h1>
              <p className="text-gray-400 text-sm font-mono uppercase tracking-widest">Acceso Terminal de Control</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#00A3E0] transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-mono text-sm focus:outline-none focus:border-[#00A3E0]/40 transition-all placeholder:text-gray-600"
                  placeholder="ID_USUARIO@TERMINAL.COM"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#00A3E0] transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white font-mono text-sm focus:outline-none focus:border-[#00A3E0]/40 transition-all placeholder:text-gray-600"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#00A3E0] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-3">
                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-500 text-[10px] font-mono uppercase leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden bg-[#00A3E0] hover:bg-[#00B4F0] text-white py-4 rounded-xl font-mono text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,163,224,0.3)]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? 'Sincronizando...' : (
                  <>
                    <LogIn size={16} />
                    Iniciar Sesión
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
              © 2026 Multitalleres Quantum Logic
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { db, firebaseConfig } from '../../lib/firebase';
import { initializeApp, deleteApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, updateDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { UserPlus, Calendar, Shield, Activity, RefreshCw, CheckCircle2, XCircle, UserCheck, Search, Plus, AlertCircle } from 'lucide-react';
import { CyberAlert } from '../ui/CyberAlert';

interface UserProfile {
  uid: string;
  email: string;
  empresa: string;
  role: 'admin' | 'user';
  accessExpiration: Timestamp;
  status: 'active' | 'inactive';
}

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmpresa, setNewEmpresa] = useState('');
  const [newDuration, setNewDuration] = useState('12'); // months or '5min'
  const [formLoading, setFormLoading] = useState(false);

  // Edit/Renew state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editEmpresa, setEditEmpresa] = useState('');
  const [editDuration, setEditDuration] = useState('0'); // '0' means no change, or months/'5min'
  const [editLoading, setEditLoading] = useState(false);

  // Alert Modal state
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setAlert({ isOpen: true, title, message, type });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('email'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(doc => doc.data() as UserProfile));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      // Calculate expiration
      const expirationDate = new Date();
      if (newDuration === '5min') {
        expirationDate.setMinutes(expirationDate.getMinutes() + 5);
      } else if (newDuration === '7days') {
        expirationDate.setDate(expirationDate.getDate() + 7);
        expirationDate.setHours(23, 59, 59, 999);
      } else if (newDuration === 'unlimited') {
        expirationDate.setFullYear(expirationDate.getFullYear() + 100);
      } else {
        expirationDate.setMonth(expirationDate.getMonth() + parseInt(newDuration));
        // Set to 23:59:59 of that day
        expirationDate.setHours(23, 59, 59, 999);
      }

      console.log("[Admin] Expiration calculated:", expirationDate.toLocaleString());
      
      // STEP 1: Create the Auth User using a secondary Firebase app instance
      // This prevents the current Admin session from being closed
      const secondaryAppName = `temp-app-${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      try {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
        const newUid = userCredential.user.uid;
        console.log("[Admin] Auth user created successfully:", newUid);

        // STEP 2: Create the Firestore profile
        const docRef = doc(db, 'users', newUid);
        const newUserProfile: UserProfile = {
          uid: newUid,
          email: newEmail.toLowerCase(),
          empresa: newEmpresa,
          role: 'user',
          accessExpiration: Timestamp.fromDate(expirationDate),
          status: 'active',
        };
        await setDoc(docRef, newUserProfile);
        
        // STEP 3: Cleanup secondary app
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);

        showAlert(
          "¡Terminal Creada!",
          `Empresa: ${newEmpresa}\nEmail: ${newEmail}\nAcceso hasta: ${expirationDate.toLocaleString()}\n\nEl usuario ya puede iniciar sesión directamente.`,
          "success"
        );
        
      } catch (authError: any) {
        // Cleanup on error too
        await deleteApp(secondaryApp);
        
        if (authError.code === 'auth/email-already-in-use') {
          throw new Error("Este correo ya está registrado en el sistema.");
        }
        throw authError;
      }

      setIsModalOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewEmpresa('');
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditLoading(true);
    
    try {
      const userRef = doc(db, 'users', selectedUser.uid);
      const updates: any = {
        empresa: editEmpresa,
      };

      if (editDuration !== '0') {
        let currentExp = selectedUser.accessExpiration.toMillis();
        // If expired, start from now
        if (currentExp < Date.now()) currentExp = Date.now();

        const newExpDate = new Date(currentExp);
        if (editDuration === '5min') {
          newExpDate.setMinutes(newExpDate.getMinutes() + 5);
        } else if (editDuration === '7days') {
          newExpDate.setDate(newExpDate.getDate() + 7);
          newExpDate.setHours(23, 59, 59, 999);
        } else if (editDuration === 'unlimited') {
          newExpDate.setFullYear(newExpDate.getFullYear() + 100);
        } else {
          newExpDate.setMonth(newExpDate.getMonth() + parseInt(editDuration));
          // Set to 23:59:59
          newExpDate.setHours(23, 59, 59, 999);
        }
        updates.accessExpiration = Timestamp.fromDate(newExpDate);
        updates.status = 'active';
      }

      await updateDoc(userRef, updates);
      
      showAlert("Éxito", `Terminal "${editEmpresa}" actualizada correctamente.`, "success");
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      showAlert("Error", "No se pudo actualizar la terminal.", "error");
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = (user: UserProfile) => {
    setSelectedUser(user);
    setEditEmpresa(user.empresa || '');
    setEditDuration('0');
    setIsEditModalOpen(true);
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative group flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#00A3E0] transition-colors" size={18} />
          <input
            type="text"
            placeholder="BUSCAR TERMINAL / USUARIO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white font-mono text-xs focus:outline-none focus:border-[#00A3E0]/40 transition-all"
          />
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 bg-[#00A3E0] hover:bg-[#00B4F0] text-white px-6 py-3 rounded-2xl font-mono text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,163,224,0.2)] shrink-0"
        >
          <UserPlus size={18} />
          Nuevo Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass-panel p-6 rounded-3xl animate-pulse bg-white/5 border border-white/5 h-24"></div>
          ))
        ) : filteredUsers.map(user => {
          const isExpired = user.accessExpiration.toMillis() < Date.now();
          const timeLeft = Math.max(0, user.accessExpiration.toMillis() - Date.now());
          const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

          return (
            <div key={user.uid} className={`glass-panel p-6 rounded-3xl border transition-all duration-500 group flex flex-col md:flex-row md:items-center justify-between gap-6 ${isExpired ? 'border-red-500/20 bg-red-500/5' : 'border-white/5 hover:border-[#00A3E0]/30'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${isExpired ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-[#00A3E0]/10 border-[#00A3E0]/20 text-[#00A3E0]'}`}>
                  {user.role === 'admin' ? <Shield size={24} /> : <Activity size={24} />}
                </div>
                <div>
                  <h3 className="text-white font-mono text-sm uppercase tracking-wider mb-1 flex items-center gap-3">
                    {user.email}
                    {user.role === 'admin' && <span className="text-[9px] bg-[#00A3E0]/20 text-[#00A3E0] px-2 py-0.5 rounded-full border border-[#00A3E0]/30">SUPER_USER</span>}
                  </h3>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-mono text-[#00A3E0] uppercase tracking-widest">{user.empresa || 'Empresa No Registrada'}</p>
                    <div className="flex items-center gap-4">
                      <p className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-1.5">
                        <Calendar size={12} />
                        {user.role === 'admin' ? 'SISTEMA ACTIVO / VITALICIO' : `Expira: ${user.accessExpiration.toDate().toLocaleString()}`}
                      </p>
                      <p className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border ${isExpired && user.role !== 'admin' ? 'text-red-500 border-red-500/20' : 'text-green-500 border-green-500/20'}`}>
                        {user.role === 'admin' || daysLeft > 30000 ? 'ACCESO ILIMITADO' : isExpired ? 'SUSCRIPCIÓN VENCIDA' : `${daysLeft} DÍAS RESTANTES`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                {user.role !== 'admin' && (
                  <button 
                    onClick={() => openEditModal(user)}
                    className="flex items-center gap-3 px-6 py-3 bg-[#00A3E0]/10 hover:bg-[#00A3E0]/20 border border-[#00A3E0]/20 hover:border-[#00A3E0]/40 rounded-2xl text-[#00A3E0] transition-all font-mono text-[10px] uppercase tracking-widest group/btn"
                  >
                    <RefreshCw size={16} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                    Gestionar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-lg rounded-[2.5rem] border border-white/10 p-10 relative z-10 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center gap-6 mb-8 text-center">
              <div className="w-16 h-16 bg-[#00A3E0]/10 rounded-3xl flex items-center justify-center border border-[#00A3E0]/20">
                <UserPlus size={32} className="text-[#00A3E0]" />
              </div>
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Nuevo Terminal MT_SYS</h2>
                <p className="text-[10px] font-mono text-[#00A3E0] uppercase tracking-[0.3em] mt-1">Configuración de Acceso</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Email del Usuario</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white font-mono text-sm focus:outline-none focus:border-[#00A3E0]/40 transition-all placeholder:text-gray-700"
                    placeholder="usuario@terminal.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Contraseña Inicial</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white font-mono text-sm focus:outline-none focus:border-[#00A3E0]/40 transition-all placeholder:text-gray-700"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Nombre de la Empresa / Cliente</label>
                <input
                  type="text"
                  value={newEmpresa}
                  onChange={(e) => setNewEmpresa(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white font-mono text-sm focus:outline-none focus:border-[#00A3E0]/40 transition-all placeholder:text-gray-700"
                  placeholder="SOLUCIONES TECH S.A.S"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Duración del Acceso</label>
                <div className="relative">
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full bg-[#1A1A1B] border border-white/10 rounded-2xl py-3 px-4 text-white font-mono text-sm focus:outline-none focus:border-[#00A3E0]/40 transition-all appearance-none cursor-pointer"
                  >
                    <option value="5min" className="bg-[#1A1A1B] text-white">5 Minutos (PRUEBA RÁPIDA)</option>
                    <option value="7days" className="bg-[#1A1A1B] text-white">7 Días (PRUEBA REAL)</option>
                    <option value="1" className="bg-[#1A1A1B] text-white">1 Mes de Suscripción</option>
                    <option value="3" className="bg-[#1A1A1B] text-white">3 Meses de Suscripción</option>
                    <option value="6" className="bg-[#1A1A1B] text-white">6 Meses de Suscripción</option>
                    <option value="12" className="bg-[#1A1A1B] text-white">1 Año de Suscripción (Recomendado)</option>
                    <option value="24" className="bg-[#1A1A1B] text-white">2 Años de Suscripción</option>
                    <option value="unlimited" className="bg-[#1A1A1B] text-[#00A3E0] font-bold">ACCESO ILIMITADO (PARA SIEMPRE)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <Plus size={14} className="rotate-45" />
                  </div>
                </div>
              </div>

              <div className="bg-[#00A3E0]/5 border border-[#00A3E0]/20 p-4 rounded-2xl flex items-start gap-3">
                <CheckCircle2 size={18} className="text-[#00A3E0] shrink-0 mt-0.5" />
                <p className="text-[10px] font-mono text-[#00A3E0] uppercase leading-relaxed">
                  El usuario tendrá acceso total a los módulos de Clientes, Proveedores y Cotizaciones con aislamiento total de datos.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-4 rounded-2xl font-mono text-[10px] uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-[#00A3E0] hover:bg-[#00B4F0] text-white py-4 rounded-2xl font-mono text-[10px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,163,224,0.3)]"
                >
                  {formLoading ? 'Creando...' : 'Crear Acceso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit/Renew Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-lg rounded-[2.5rem] border border-white/10 p-10 relative z-10 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center gap-6 mb-8 text-center">
              <div className="w-16 h-16 bg-[#00A3E0]/10 rounded-3xl flex items-center justify-center border border-[#00A3E0]/20">
                <RefreshCw size={32} className="text-[#00A3E0]" />
              </div>
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Gestionar Terminal</h2>
                <p className="text-[10px] font-mono text-[#00A3E0] uppercase tracking-[0.3em] mt-1">{selectedUser.email}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  value={editEmpresa}
                  onChange={(e) => setEditEmpresa(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white font-mono text-sm focus:outline-none focus:border-[#00A3E0]/40 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-1">Renovar Suscripción (Opcional)</label>
                <div className="relative">
                  <select
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full bg-[#1A1A1B] border border-white/10 rounded-2xl py-3 px-4 text-white font-mono text-sm focus:outline-none focus:border-[#00A3E0]/40 transition-all appearance-none cursor-pointer"
                  >
                    <option value="0" className="bg-[#1A1A1B] text-white">Mantener Expiración Actual</option>
                    <option value="5min" className="bg-[#1A1A1B] text-white">+5 Minutos (PRUEBA RÁPIDA)</option>
                    <option value="7days" className="bg-[#1A1A1B] text-white">+7 Días (PRUEBA REAL)</option>
                    <option value="1" className="bg-[#1A1A1B] text-white">+1 Mes</option>
                    <option value="3" className="bg-[#1A1A1B] text-white">+3 Meses</option>
                    <option value="6" className="bg-[#1A1A1B] text-white">+6 Meses</option>
                    <option value="12" className="bg-[#1A1A1B] text-white">+1 Año</option>
                    <option value="24" className="bg-[#1A1A1B] text-white">+2 Años</option>
                    <option value="unlimited" className="bg-[#1A1A1B] text-[#00A3E0] font-bold">ACCESO ILIMITADO</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <Plus size={14} className="rotate-45" />
                  </div>
                </div>
                <p className="text-[9px] font-mono text-gray-600 uppercase mt-2 ml-1">
                  * El tiempo seleccionado se sumará a la fecha actual o a la fecha de vencimiento si aún está activa.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-4 rounded-2xl font-mono text-[10px] uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-[#00A3E0] hover:bg-[#00B4F0] text-white py-4 rounded-2xl font-mono text-[10px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,163,224,0.3)]"
                >
                  {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Alert Modal */}
      <CyberAlert 
        isOpen={alert.isOpen}
        onClose={() => setAlert(prev => ({ ...prev, isOpen: false }))}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </div>
  );
};

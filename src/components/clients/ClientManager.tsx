import React, { useState, useEffect } from 'react';
import { clientsService } from '../../lib/services';
import { useAuth, AuthProvider } from '../auth/AuthContext';
import { CyberButton } from '../ui/CyberButton';
import { CyberModal } from '../ui/CyberModal';
import { CyberInput } from '../ui/CyberInput';
import { Plus, Search, Users, Edit2, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { CyberConfirm } from '../ui/CyberConfirm';

import { ErrorBoundary } from '../ui/ErrorBoundary';

const ClientManagerInner: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', tipoDocumento: 'NIT', nit: '', direccion: '', ciudad: '', telefono: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    if (profile?.uid) {
      setLoading(true);
      loadClients();
    }
    
    const timeout = setTimeout(() => setLoading(false), 6000);
    return () => clearTimeout(timeout);
  }, [profile?.uid]);

  const loadClients = async () => {
    if (!profile?.uid) return;
    setLoading(true);
    try {
      const data = await clientsService.getAll(profile.uid);
      setClients(data);
      // Dispatch event to update StatusFooter
      window.dispatchEvent(new CustomEvent('updateRecordCount', { detail: { module: 'Clientes', count: data.length } }));
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedClientId(null);
    setFormData({ nombre: '', tipoDocumento: 'NIT', nit: '', direccion: '', ciudad: '', telefono: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (client: any) => {
    setSelectedClientId(client.id);
    setFormData({
      nombre: client.nombre || '',
      tipoDocumento: client.tipoDocumento || 'NIT',
      nit: client.nit || '',
      direccion: client.direccion || '',
      ciudad: client.ciudad || '',
      telefono: client.telefono || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      await clientsService.remove(deleteConfirm.id);
      loadClients();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (selectedClientId) {
        await clientsService.update(selectedClientId, formData);
      } else {
        await clientsService.add(formData, profile!.uid);
      }
      setIsModalOpen(false);
      setFormData({ nombre: '', tipoDocumento: 'NIT', nit: '', direccion: '', ciudad: '', telefono: '' });
      setSelectedClientId(null);
      await loadClients();
    } catch (error: any) {
      console.error("Error saving client:", error);
      alert(`Error al guardar: ${error.message || 'Verifique su conexión o permisos'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = clients.filter(c => 
    (c.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.nit || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel rounded-2xl p-5 backdrop-blur-xl bg-black/40 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00A3E0]/10 flex items-center justify-center border border-[#00A3E0]/20">
            <Users className="text-[#00A3E0]" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-mono font-bold uppercase tracking-widest text-shadow-neon">Clientes</h2>
            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.2em]">Base de Datos Maestras</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00A3E0]/40 group-focus-within:text-[#00A3E0] transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="bg-[#050505]/50 border border-[#00A3E0]/20 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-white focus:border-[#00A3E0]/50 focus:ring-1 focus:ring-[#00A3E0]/20 outline-none w-full sm:w-64 transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <CyberButton onClick={handleNew} className="w-full sm:w-auto">
            <span className="flex items-center justify-center gap-2 font-bold uppercase tracking-tighter"><Plus size={16} /> Nuevo</span>
          </CyberButton>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block glass-panel overflow-hidden rounded-2xl p-4 backdrop-blur-xl bg-black/40 border border-white/10 shadow-xl">
        <table className="w-full text-left font-mono text-sm border-separate" style={{ borderSpacing: '0 0.75rem' }}>
          <thead className="text-[#00A3E0] text-[10px] uppercase tracking-widest font-medium">
            <tr>
              <th className="px-4 pb-2">Razón Social</th>
              <th className="px-4 pb-2">NIT/CC</th>
              <th className="px-4 pb-2">Dirección</th>
              <th className="px-4 pb-2">Ciudad</th>
              <th className="px-4 pb-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center bg-white/5 rounded-xl">
                  <Loader2 className="w-8 h-8 text-[#00A3E0] animate-spin mx-auto mb-2" />
                  <span className="text-[10px] uppercase tracking-widest text-[#00A3E0]/60">Sincronizando...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500 bg-white/5 rounded-xl">No se encontraron registros.</td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} className="bg-white/5 hover:bg-white/10 transition-all duration-300 group shadow-md transform hover:scale-[1.005]">
                  <td className="p-4 font-medium text-white rounded-l-xl border-y border-l border-white/5 group-hover:border-[#00A3E0]/30">{c.nombre}</td>
                  <td className="p-4 text-[#00A3E0] border-y border-white/5 group-hover:border-[#00A3E0]/30">{c.nit}</td>
                  <td className="p-4 text-gray-400 border-y border-white/5 group-hover:border-[#00A3E0]/30">{c.direccion}</td>
                  <td className="p-4 text-gray-500 border-y border-white/5 group-hover:border-[#00A3E0]/30">{c.ciudad}</td>
                  <td className="p-4 rounded-r-xl border-y border-r border-white/5 group-hover:border-[#00A3E0]/30">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(c)} className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-[#00A3E0] border border-[#00A3E0]/20 hover:bg-[#00A3E0] hover:text-white transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="p-12 text-center glass-panel rounded-2xl">
            <Loader2 className="w-8 h-8 text-[#00A3E0] animate-spin mx-auto mb-2" />
            <p className="text-[10px] font-mono text-[#00A3E0]/60 uppercase tracking-widest">Iniciando Enlace...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 glass-panel rounded-2xl">No hay registros activos.</div>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="glass-panel rounded-2xl p-5 bg-black/60 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#00A3E0]/5 blur-2xl -mr-8 -mt-8 rounded-full"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-white font-bold font-mono text-sm leading-tight uppercase group-hover:text-[#00A3E0] transition-colors">{c.nombre}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-[#00A3E0] font-bold">{c.nit}</span>
                    <span className="text-[8px] font-mono text-gray-600">[{c.tipoDocumento || 'NIT'}]</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(c)} className="p-2.5 rounded-xl bg-[#00A3E0]/10 text-[#00A3E0] border border-[#00A3E0]/20">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Ubicación</p>
                  <p className="text-[11px] font-mono text-gray-300 truncate">{c.direccion || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Ciudad</p>
                  <p className="text-[11px] font-mono text-gray-300">{c.ciudad || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <CyberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedClientId ? "Editar Cliente" : "Nuevo Cliente"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <CyberInput label="Nombre / Razón Social" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="col-span-2" />
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Tipo Doc.</label>
              <select 
                className="bg-[#050505]/50 border border-[#00A3E0]/30 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#00A3E0] focus:ring-2 focus:ring-[#00A3E0]/50 shadow-inner transition-all duration-300 w-full"
                value={formData.tipoDocumento}
                onChange={e => setFormData({...formData, tipoDocumento: e.target.value})}
              >
                <option value="NIT" className="bg-[#050505]">NIT</option>
                <option value="CC" className="bg-[#050505]">Cédula de Ciudadanía (CC)</option>
              </select>
            </div>
            <CyberInput label="Número de Documento" required value={formData.nit} onChange={e => setFormData({...formData, nit: e.target.value})} />
            <CyberInput label="Dirección" required value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
            <CyberInput label="Ciudad" required value={formData.ciudad} onChange={e => setFormData({...formData, ciudad: e.target.value})} />
            <CyberInput label="Teléfono" required value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="col-span-2" />
          </div>
          <div className="flex justify-end pt-4">
            <CyberButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Procesando...</span>
              ) : (
                selectedClientId ? "Actualizar Cliente" : "Guardar Cliente"
              )}
            </CyberButton>
          </div>
        </form>
      </CyberModal>

      <CyberConfirm 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Eliminar Cliente"
        message="¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer."
      />
    </div>
  );
};

export const ClientManager = () => (
  <ErrorBoundary>
    <AuthProvider>
      <ClientManagerInner />
    </AuthProvider>
  </ErrorBoundary>
);

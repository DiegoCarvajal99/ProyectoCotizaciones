import React, { useState, useEffect } from 'react';
import { providersService } from '../../lib/services';
import { useAuth, AuthProvider } from '../auth/AuthContext';
import { CyberButton } from '../ui/CyberButton';
import { CyberModal } from '../ui/CyberModal';
import { CyberInput } from '../ui/CyberInput';
import { Plus, Search, Server, Edit2, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { CyberConfirm } from '../ui/CyberConfirm';

import { ErrorBoundary } from '../ui/ErrorBoundary';

const ProviderManagerInner: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', nit: '', contacto: '', telefono: '', categoria: 'Hardware' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    if (profile?.uid) {
      setLoading(true);
      loadProviders();
    } else if (!authLoading) {
      setLoading(false);
    }
    
    const timeout = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timeout);
  }, [profile?.uid, authLoading]);

  const loadProviders = async () => {
    if (!profile?.uid) return;
    setLoading(true);
    try {
      const data = await providersService.getAll(profile.uid);
      setProviders(data);
      // Dispatch event to update StatusFooter
      window.dispatchEvent(new CustomEvent('updateRecordCount', { detail: { module: 'Proveedores', count: data.length } }));
    } catch (error) {
      console.error("Error loading providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedProviderId(null);
    setFormData({ nombre: '', nit: '', contacto: '', telefono: '', categoria: 'Hardware' });
    setIsModalOpen(true);
  };

  const handleEdit = (provider: any) => {
    setSelectedProviderId(provider.id);
    setFormData({
      nombre: provider.nombre || '',
      nit: provider.nit || '',
      contacto: provider.contacto || '',
      telefono: provider.telefono || '',
      categoria: provider.categoria || 'Hardware'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      await providersService.remove(deleteConfirm.id);
      loadProviders();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!profile?.uid) {
      alert("Error: Sesión no sincronizada. Por favor, espere un momento o reinicie sesión.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (selectedProviderId) {
        await providersService.update(selectedProviderId, formData);
      } else {
        await providersService.add(formData, profile!.uid);
      }
      setIsModalOpen(false);
      setFormData({ nombre: '', nit: '', contacto: '', telefono: '', categoria: 'Hardware' });
      setSelectedProviderId(null);
      await loadProviders();
    } catch (error: any) {
      console.error("Error saving provider:", error);
      alert(`Error al guardar: ${error.message || 'Verifique su conexión o permisos'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = providers.filter(p => (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel rounded-2xl p-5 backdrop-blur-xl bg-black/40 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00A3E0]/10 flex items-center justify-center border border-[#00A3E0]/20">
            <Server className="text-[#00A3E0]" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-mono font-bold uppercase tracking-widest text-shadow-neon">Proveedores</h2>
            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.2em]">Aliados Estratégicos</p>
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
              <th className="px-4 pb-2">Empresa</th>
              <th className="px-4 pb-2">NIT</th>
              <th className="px-4 pb-2">Contacto</th>
              <th className="px-4 pb-2">Teléfono</th>
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
              filtered.map(p => (
                <tr key={p.id} className="bg-white/5 hover:bg-white/10 transition-all duration-300 group shadow-md transform hover:scale-[1.005]">
                  <td className="p-4 font-medium text-white rounded-l-xl border-y border-l border-white/5 group-hover:border-[#00A3E0]/30">{p.nombre}</td>
                  <td className="p-4 text-gray-400 border-y border-white/5 group-hover:border-[#00A3E0]/30">{p.nit}</td>
                  <td className="p-4 text-gray-300 border-y border-white/5 group-hover:border-[#00A3E0]/30">{p.contacto}</td>
                  <td className="p-4 text-[#00A3E0] border-y border-white/5 group-hover:border-[#00A3E0]/30">{p.telefono}</td>
                  <td className="p-4 rounded-r-xl border-y border-r border-white/5 group-hover:border-[#00A3E0]/30">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(p)} className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-[#00A3E0] border border-[#00A3E0]/20 hover:bg-[#00A3E0] hover:text-white transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
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
          filtered.map(p => (
            <div key={p.id} className="glass-panel rounded-2xl p-5 bg-black/60 border border-white/5 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-white font-bold font-mono text-sm leading-tight uppercase group-hover:text-[#00A3E0] transition-colors">{p.nombre}</h3>
                  <p className="text-[9px] font-mono text-gray-500 mt-1 uppercase tracking-widest">{p.nit || 'Sin NIT'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(p)} className="p-2.5 rounded-xl bg-[#00A3E0]/10 text-[#00A3E0] border border-[#00A3E0]/20">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Contacto</p>
                  <p className="text-[11px] font-mono text-gray-300 truncate">{p.contacto || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Teléfono</p>
                  <p className="text-[11px] font-mono text-[#00A3E0]">{p.telefono || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <CyberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedProviderId ? "Editar Proveedor" : "Registrar Proveedor"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <CyberInput label="Nombre de Empresa" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
            <CyberInput label="NIT" required value={formData.nit} onChange={e => setFormData({...formData, nit: e.target.value})} />
            <CyberInput label="Persona de Contacto" required value={formData.contacto} onChange={e => setFormData({...formData, contacto: e.target.value})} />
            <CyberInput label="Teléfono" required value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Categoría</label>
            <select 
              className="bg-[#050505]/50 border border-[#00A3E0]/30 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#00A3E0] focus:ring-2 focus:ring-[#00A3E0]/50 shadow-inner transition-all duration-300 w-full"
              value={formData.categoria}
              onChange={e => setFormData({...formData, categoria: e.target.value})}
            >
              <option value="Hardware" className="bg-[#050505]">Hardware</option>
              <option value="Servicios" className="bg-[#050505]">Servicios</option>
              <option value="Infraestructura" className="bg-[#050505]">Infraestructura</option>
            </select>
          </div>
          <div className="flex justify-end pt-4">
            <CyberButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Procesando...</span>
              ) : (
                selectedProviderId ? "Actualizar Registro" : "Guardar Registro"
              )}
            </CyberButton>
          </div>
        </form>
      </CyberModal>

      <CyberConfirm 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Eliminar Proveedor"
        message="¿Está seguro de que desea eliminar este proveedor? Esta acción no se puede deshacer."
      />
    </div>
  );
};

export const ProviderManager = () => (
  <ErrorBoundary>
    <AuthProvider>
      <ProviderManagerInner />
    </AuthProvider>
  </ErrorBoundary>
);

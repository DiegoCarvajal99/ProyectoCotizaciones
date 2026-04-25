import React, { useState, useEffect } from 'react';
import { productsService, servicesService } from '../../lib/services';
import { useAuth, AuthProvider } from '../auth/AuthContext';
import { CyberButton } from '../ui/CyberButton';
import { CyberModal } from '../ui/CyberModal';
import { CyberInput } from '../ui/CyberInput';
import { Plus, Search, Package, Image as ImageIcon, Edit2, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { CyberConfirm } from '../ui/CyberConfirm';
import { ErrorBoundary } from '../ui/ErrorBoundary';

const ProductManagerInner: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'productos' | 'servicios'>('productos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nombre: '', precioBase: '', imagenUrl: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    if (profile?.uid) {
      setLoading(true);
      loadData();
    }
    
    const timeout = setTimeout(() => setLoading(false), 6000);
    return () => clearTimeout(timeout);
  }, [profile?.uid]);

  const loadData = async () => {
    if (!profile?.uid) return;
    setLoading(true);
    try {
      const pData = await productsService.getAll(profile.uid);
      const sData = await servicesService.getAll(profile.uid);
      setProducts(pData);
      setServices(sData);
      // Dispatch event to update StatusFooter
      window.dispatchEvent(new CustomEvent('updateRecordCount', { detail: { module: 'Productos', count: pData.length } }));
    } catch (error) {
      console.error("Error loading products/services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setFormData({ nombre: '', precioBase: '', imagenUrl: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedId(item.id);
    setFormData({
      nombre: item.nombre || '',
      precioBase: item.precioBase?.toString() || '',
      imagenUrl: item.imagenUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      if (activeTab === 'productos') {
        await productsService.remove(deleteConfirm.id);
      } else {
        await servicesService.remove(deleteConfirm.id);
      }
      loadData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const service = activeTab === 'productos' ? productsService : servicesService;
    
    const dataToSave: any = {
      nombre: formData.nombre,
      precioBase: parseFloat(formData.precioBase) || 0
    };
    if (activeTab === 'productos') dataToSave.imagenUrl = formData.imagenUrl;
    
    try {
      if (selectedId) {
        await service.update(selectedId, dataToSave);
      } else {
        await service.add(dataToSave, profile!.uid);
      }
      setIsModalOpen(false);
      setFormData({ nombre: '', precioBase: '', imagenUrl: '' });
      setSelectedId(null);
      await loadData();
    } catch (error: any) {
      console.error("Error saving product/service:", error);
      alert(`Error al guardar: ${error.message || 'Verifique su conexión o permisos'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentData = activeTab === 'productos' ? products : services;
  const filtered = currentData.filter(item => 
    (item.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel rounded-2xl p-5 backdrop-blur-xl bg-black/40 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00A3E0]/10 flex items-center justify-center border border-[#00A3E0]/20">
            <Package className="text-[#00A3E0]" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-mono font-bold uppercase tracking-widest text-shadow-neon">Inventario</h2>
            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.2em]">Hardware y Servicios</p>
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

      <div className="flex glass-panel rounded-xl p-1 bg-black/20 border border-white/5">
        <button 
          className={`flex-1 px-4 py-2.5 font-mono text-[10px] tracking-[0.2em] uppercase transition-all duration-300 rounded-lg ${activeTab === 'productos' ? 'text-[#00A3E0] bg-[#00A3E0]/10 shadow-[inset_0_0_10px_rgba(0,163,224,0.1)] border border-[#00A3E0]/20' : 'text-gray-500 hover:text-white'}`}
          onClick={() => setActiveTab('productos')}
        >
          Productos
        </button>
        <button 
          className={`flex-1 px-4 py-2.5 font-mono text-[10px] tracking-[0.2em] uppercase transition-all duration-300 rounded-lg ${activeTab === 'servicios' ? 'text-[#00A3E0] bg-[#00A3E0]/10 shadow-[inset_0_0_10px_rgba(0,163,224,0.1)] border border-[#00A3E0]/20' : 'text-gray-500 hover:text-white'}`}
          onClick={() => setActiveTab('servicios')}
        >
          Servicios
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block glass-panel overflow-hidden rounded-2xl p-4 backdrop-blur-xl bg-black/40 border border-white/10 shadow-xl">
        <table className="w-full text-left font-mono text-sm border-separate" style={{ borderSpacing: '0 0.75rem' }}>
          <thead className="text-[#00A3E0] text-[10px] uppercase tracking-widest font-medium">
            <tr>
              {activeTab === 'productos' && <th className="px-4 pb-2 w-32 text-center">Referencia</th>}
              <th className="px-4 pb-2">{activeTab === 'productos' ? 'Descripción' : 'Servicio Técnico'}</th>
              <th className="px-4 pb-2">Precio Base</th>
              <th className="px-4 pb-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={activeTab === 'productos' ? 4 : 3} className="p-12 text-center bg-white/5 rounded-xl">
                  <Loader2 className="w-8 h-8 text-[#00A3E0] animate-spin mx-auto mb-2" />
                  <span className="text-[10px] uppercase tracking-widest text-[#00A3E0]/60">Sincronizando...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={activeTab === 'productos' ? 4 : 3} className="p-8 text-center text-gray-500 bg-white/5 rounded-xl">No hay registros.</td></tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id} className="bg-white/5 hover:bg-white/10 transition-all duration-300 group shadow-md transform hover:scale-[1.005]">
                  {activeTab === 'productos' && (
                  <td className="p-4 rounded-l-xl border-y border-l border-white/5 group-hover:border-[#00A3E0]/30 transition-colors">
                    <div className="w-20 h-12 mx-auto flex items-center justify-center bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                      {item.imagenUrl ? (
                        <img src={item.imagenUrl} alt={item.nombre} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <ImageIcon className="text-white/10" size={18} />
                      )}
                    </div>
                  </td>
                  )}
                  <td className={`p-4 font-medium text-white border-y border-white/5 group-hover:border-[#00A3E0]/30 transition-colors ${activeTab === 'servicios' ? 'rounded-l-xl border-l' : ''}`}>{item.nombre}</td>
                  <td className="p-4 text-[#39ff8f] font-bold border-y border-white/5 group-hover:border-[#00A3E0]/30 transition-colors">${Number(item.precioBase).toLocaleString('es-CO')}</td>
                  <td className="p-4 rounded-r-xl border-y border-r border-white/5 group-hover:border-[#00A3E0]/30 transition-colors">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(item)} className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-[#00A3E0] border border-[#00A3E0]/20 hover:bg-[#00A3E0] hover:text-white transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
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
            <p className="text-[10px] font-mono text-[#00A3E0]/60 uppercase tracking-widest">Enlazando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 glass-panel rounded-2xl">No hay registros activos.</div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="glass-panel rounded-2xl p-5 bg-black/60 border border-white/5 relative overflow-hidden group">
              <div className="flex gap-4">
                {activeTab === 'productos' && (
                  <div className="w-20 h-20 shrink-0 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
                    {item.imagenUrl ? (
                      <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-contain" />
                    ) : (
                      <Package className="text-white/10" size={24} />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-white font-bold font-mono text-sm leading-tight uppercase truncate">{item.nombre}</h3>
                  </div>
                  <p className="text-[#39ff8f] font-black font-mono text-base mt-1">
                    ${Number(item.precioBase).toLocaleString('es-CO')}
                  </p>
                  
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleEdit(item)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#00A3E0]/10 text-[#00A3E0] border border-[#00A3E0]/20 text-[10px] font-mono uppercase tracking-widest">
                      <Edit2 size={12} /> Editar
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono uppercase tracking-widest">
                      <Trash2 size={12} /> Borrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <CyberModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedId 
          ? `Editar ${activeTab === 'productos' ? 'Producto' : 'Servicio'}` 
          : `Nuevo ${activeTab === 'productos' ? 'Producto' : 'Servicio'}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <CyberInput 
              label={activeTab === 'productos' ? "Nombre del Producto" : "Nombre del Servicio"} 
              required 
              value={formData.nombre} 
              onChange={e => setFormData({...formData, nombre: e.target.value})} 
            />
            <CyberInput 
              label="Precio Base" 
              type="text" 
              required 
              value={formData.precioBase ? Number(String(formData.precioBase).replace(/\D/g, '')).toLocaleString('es-CO') : ''} 
              onChange={e => setFormData({...formData, precioBase: Number(e.target.value.replace(/\D/g, '')) || ''})} 
            />
            {activeTab === 'productos' && (
            <CyberInput 
              label="URL de la Imagen" 
              type="url" 
              placeholder="https://ejemplo.com/imagen.jpg" 
              value={formData.imagenUrl} 
              onChange={e => setFormData({...formData, imagenUrl: e.target.value})} 
            />
            )}
          </div>
          <div className="flex justify-end pt-4">
            <CyberButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Procesando...</span>
              ) : (
                selectedId ? "Actualizar Registro" : "Guardar Registro"
              )}
            </CyberButton>
          </div>
        </form>
      </CyberModal>

      <CyberConfirm 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title={`Eliminar ${activeTab === 'productos' ? 'Producto' : 'Servicio'}`}
        message={`¿Está seguro de que desea eliminar este ${activeTab === 'productos' ? 'producto' : 'servicio'}? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export const ProductManager = () => (
  <ErrorBoundary>
    <AuthProvider>
      <ProductManagerInner />
    </AuthProvider>
  </ErrorBoundary>
);

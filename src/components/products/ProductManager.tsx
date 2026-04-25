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
      <div className="flex justify-between items-center glass-panel rounded-2xl p-5 backdrop-blur-xl bg-black/40 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <Package className="text-[#00A3E0]" />
          <h2 className="text-xl font-mono font-bold uppercase tracking-widest text-shadow-neon">Productos y Servicios</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00A3E0]/50" size={16} />
            <input 
              type="text" 
              placeholder={activeTab === 'productos' ? "Buscar producto..." : "Buscar servicio..."} 
              className="bg-[#050505]/50 border border-[#00A3E0]/30 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-white focus:border-[#00A3E0] focus:ring-2 focus:ring-[#00A3E0]/50 outline-none w-64 shadow-inner transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleNew}
            className="bg-gradient-to-r from-[#00A3E0] to-blue-600 hover:from-[#00A3E0] hover:to-blue-500 text-white font-medium rounded-full px-6 py-2.5 flex items-center gap-2 shadow-[0_0_15px_rgba(0,163,224,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(0,163,224,0.5)]"
          >
            <Plus size={18} /> Nuevo {activeTab === 'productos' ? 'Producto' : 'Servicio'}
          </button>
        </div>
      </div>

      <div className="flex border-b border-[#00A3E0]/20">
        <button 
          className={`px-6 py-3 font-mono text-sm tracking-widest uppercase transition-colors ${activeTab === 'productos' ? 'text-[#00A3E0] border-b-2 border-[#00A3E0] bg-[#00A3E0]/10' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('productos')}
        >
          Productos Físicos
        </button>
        <button 
          className={`px-6 py-3 font-mono text-sm tracking-widest uppercase transition-colors ${activeTab === 'servicios' ? 'text-[#00A3E0] border-b-2 border-[#00A3E0] bg-[#00A3E0]/10' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('servicios')}
        >
          Servicios Técnicos
        </button>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl p-4 backdrop-blur-xl bg-black/40 border border-white/10 shadow-xl">
        <table className="w-full text-left font-mono text-sm border-separate" style={{ borderSpacing: '0 0.75rem' }}>
          <thead className="text-[#00A3E0] text-[10px] uppercase tracking-widest font-medium">
            <tr>
              {activeTab === 'productos' && <th className="px-4 pb-2 w-32 text-center">Img</th>}
              <th className="px-4 pb-2 text-center">{activeTab === 'productos' ? 'Nombre del Producto' : 'Nombre del Servicio'}</th>
              <th className="px-4 pb-2">Precio Base</th>
              <th className="px-4 pb-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={activeTab === 'productos' ? 4 : 3} className="p-12 text-center bg-white/5 rounded-xl border border-white/5">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 text-[#00A3E0] animate-spin" />
                    <p className="text-[10px] font-mono text-[#00A3E0] uppercase tracking-[0.4em] animate-pulse">Cargando Catálogo...</p>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={activeTab === 'productos' ? 4 : 3} className="p-8 text-center text-gray-500 bg-white/5 rounded-xl">No hay {activeTab} registrados.</td></tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id} className="bg-white/5 hover:bg-white/10 transition-all duration-300 group shadow-md hover:shadow-[0_4px_20px_rgba(0,163,224,0.15)] transform hover:scale-[1.01]">
                  {activeTab === 'productos' && (
                  <td className="p-4 rounded-l-xl border-y border-l border-white/5 group-hover:border-[#00A3E0]/30 transition-colors">
                    {item.imagenUrl ? (
                      <div className="w-24 h-16 mx-auto flex items-center justify-center">
                        <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-contain drop-shadow-lg rounded-md" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                        <ImageIcon className="hidden text-[#00A3E0]/60" size={24} />
                      </div>
                    ) : (
                      <div className="w-24 h-16 mx-auto flex items-center justify-center opacity-50">
                        <ImageIcon className="text-[#00A3E0]/40" size={24} />
                      </div>
                    )}
                  </td>
                  )}
                  <td className={`p-4 font-medium text-white text-center border-y border-white/5 group-hover:border-[#00A3E0]/30 transition-colors ${activeTab === 'servicios' ? 'rounded-l-xl border-l' : ''}`}>{item.nombre}</td>
                  <td className="p-4 text-[#39ff8f] font-medium border-y border-white/5 group-hover:border-[#00A3E0]/30 transition-colors">${Number(item.precioBase).toLocaleString('es-CO')}</td>
                  <td className="p-4 rounded-r-xl border-y border-r border-white/5 group-hover:border-[#00A3E0]/30 transition-colors">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleEdit(item)} className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-[#00A3E0] border border-[#00A3E0]/20 hover:bg-[#00A3E0] hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,163,224,0.5)]" title="Editar">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]" title="Eliminar">
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

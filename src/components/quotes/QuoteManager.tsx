import React, { useState, useEffect } from 'react';
import { quotesService, clientsService, productsService, servicesService } from '../../lib/services';
import { useAuth, AuthProvider } from '../auth/AuthContext';
import { CyberButton } from '../ui/CyberButton';
import { CyberModal } from '../ui/CyberModal';
import { CyberInput } from '../ui/CyberInput';
import { Plus, FileText, Trash2, Download, User, MapPin, Calendar, CheckCircle2, Search, Copy, ArrowRightLeft, DollarSign, Eye, AlertTriangle, Loader2 } from 'lucide-react';
import { CyberConfirm } from '../ui/CyberConfirm';
import { CyberAlert } from '../ui/CyberAlert';

import { ErrorBoundary } from '../ui/ErrorBoundary';

const QuoteManagerInner: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Quote form state
  const [clientForm, setClientForm] = useState({ id: '', nombre: '', tipoDocumento: 'NIT', nit: '', direccion: '', ciudad: '', telefono: '' });
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [items, setItems] = useState([{ nombre: '', precio: 0, cantidad: 1, imagenUrl: '' }]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeProductRow, setActiveProductRow] = useState<number | null>(null);
  const [tipoPago, setTipoPago] = useState<'Contado' | 'Crédito'>('Contado');
  const [fechas, setFechas] = useState({ emision: '', vencimiento: '' });
  const [reuseSearch, setReuseSearch] = useState('');
  const [showReuseSuggestions, setShowReuseSuggestions] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [statusConfirm, setStatusConfirm] = useState<{ isOpen: boolean; quote: any | null }>({ isOpen: false, quote: null });
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
      const [quotesData, clientsData, productsData, servicesData] = await Promise.all([
        quotesService.getAll(profile.uid),
        clientsService.getAll(profile.uid),
        productsService.getAll(profile.uid),
        servicesService.getAll(profile.uid)
      ]);
      setQuotes(quotesData);
      setClients(clientsData);
      setProducts([
        ...productsData.map(p => ({ ...p, tipo: 'Producto' })), 
        ...servicesData.map(s => ({ ...s, tipo: 'Servicio' }))
      ]);
      window.dispatchEvent(new CustomEvent('updateRecordCount', { detail: { module: 'Cotizaciones', count: quotesData.length } }));
    } catch (error) {
      console.error("Error loading quote data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.precio * (Number(item.cantidad) || 0)), 0);
  };

  const handleAddItem = () => {
    setItems([...items, { nombre: '', precio: 0, cantidad: 1, imagenUrl: '', tipo: 'Producto' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSelectProduct = (index: number, product: any) => {
    const newItems = [...items];
    newItems[index] = { 
      ...newItems[index], 
      nombre: product.nombre, 
      precio: product.precioBase || 0,
      imagenUrl: product.imagenUrl || '',
      tipo: product.tipo || 'Producto'
    };
    setItems(newItems);
    setActiveProductRow(null);
  };

  const handleSelectClient = (c: any) => {
    setClientForm({
      id: c.id,
      nombre: c.nombre,
      tipoDocumento: c.tipoDocumento || 'NIT',
      nit: c.nit || '',
      direccion: c.direccion || '',
      ciudad: c.ciudad || '',
      telefono: c.telefono || ''
    });
    setShowClientSuggestions(false);
  };

  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientForm({ ...clientForm, nombre: e.target.value, id: '' });
    setShowClientSuggestions(true);
  };

  const handleNewQuoteClick = () => {
    setSelectedQuoteId(null);
    setClientForm({ id: '', nombre: '', tipoDocumento: 'NIT', nit: '', direccion: '', ciudad: '', telefono: '' });
    setItems([{ nombre: '', precio: 0, cantidad: 1, imagenUrl: '', tipo: 'Producto' }]);
    setTipoPago('Contado');
    setReuseSearch('');
    
    const hoy = new Date();
    const vence = new Date(hoy);
    vence.setDate(vence.getDate() + 5);
    setFechas({
      emision: hoy.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      vencimiento: vence.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    });
    
    setIsModalOpen(true);
  };

  const handleReuseQuote = (q: any) => {
    // Import items but leave client blank
    const importedItems = (q.items && q.items.length > 0)
      ? q.items.map((item: any) => ({ ...item }))
      : [{ nombre: '', precio: 0, cantidad: 1, imagenUrl: '', tipo: 'Producto' }];
    setItems(importedItems);
    setTipoPago(q.tipoPago || 'Contado');
    setReuseSearch('');
    setShowReuseSuggestions(false);
  };

  const handleEditQuote = (q: any) => {
    if (q.estado === 'Aceptada') return;
    setSelectedQuoteId(q.id);
    setClientForm({
      id: q.cliente?.id || '',
      nombre: q.cliente?.nombre || '',
      tipoDocumento: q.cliente?.tipoDocumento || 'NIT',
      nit: q.cliente?.nit || '',
      direccion: q.cliente?.direccion || '',
      ciudad: q.cliente?.ciudad || '',
      telefono: q.cliente?.telefono || ''
    });
    setItems(q.items && q.items.length > 0 ? q.items : [{ nombre: '', precio: 0, cantidad: 1, imagenUrl: '', tipo: 'Producto' }]);
    setTipoPago(q.tipoPago || 'Contado');
    
    setFechas({
      emision: q.fechaEmision || q.fecha || new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      vencimiento: q.fechaVencimiento || ''
    });
    
    setIsModalOpen(true);
  };

  const generatePDF = async (quote: any, preOpenedWindow?: Window | null, options?: { isInvoice?: boolean }) => {
    const isInvoice = options?.isInvoice || false;
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const getBase64ImageFromURL = (url: string): Promise<{ data: string, width: number, height: number }> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 150;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#FFFFFF'; // Background for JPEG
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
            }
            resolve({ data: canvas.toDataURL('image/jpeg', 0.6), width, height });
          };
          img.onerror = error => reject(error);
          img.src = url;
        });
      };

      const doc = new jsPDF();
      const primary = [31, 54, 85]; // Navy blue
      const light = [240, 242, 245]; // Light gray
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // 1. Top Swooshes
      // Light background swoosh
      doc.setFillColor(220, 225, 235);
      doc.ellipse(10, -20, 100, 45, 'F');
      
      // Dark foreground swoosh
      doc.setFillColor(primary[0], primary[1], primary[2]);
      doc.ellipse(-10, -20, 60, 35, 'F');
      
      // 3. Logo
      try {
        const logoData = await getBase64ImageFromURL('/logo.png');
        doc.addImage(logoData.data, 'PNG', 14, 30, 45, 32); // Adjust dimensions based on image
      } catch (e) {
        console.error("Error cargando logo", e);
        doc.setFontSize(24);
        doc.setTextColor(primary[0], primary[1], primary[2]);
        doc.setFont('helvetica', 'bold');
        doc.text("MULTITALLERES", 20, 50);
      }
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'bold');
      doc.text("SOLUCIONES TECNOLÓGICAS", 16, 66);
      
      // 4. Quote Details (Top Right)
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'bold');
      doc.text(isInvoice ? "FACTURA DE VENTA N°" : "COTIZACIÓN N°", 196, 36, { align: 'right' });
      
      doc.setFontSize(16);
      doc.setTextColor(primary[0], primary[1], primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(quote.numero?.replace('#', '') || 'S/N', 196, 43, { align: 'right' });
      
      doc.setDrawColor(220, 225, 235);
      doc.setLineWidth(0.5);
      doc.line(140, 46, 196, 46);
      
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'bold');
      doc.text("Fecha Emisión:", 165, 52, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(quote.fechaEmision || 'No definida', 196, 52, { align: 'right' });
      
      doc.setFont('helvetica', 'bold');
      doc.text("Vencimiento:", 165, 57, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(isInvoice ? (quote.fechaEmision || 'No definida') : (quote.fechaVencimiento || 'No definida'), 196, 57, { align: 'right' });
      
      doc.setFont('helvetica', 'bold');
      doc.text("Condición Pago:", 165, 62, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(quote.tipoPago || 'Contado', 196, 62, { align: 'right' });
      
      // 5. Client Info (Left Column)
      doc.setFontSize(9);
      doc.setTextColor(primary[0], primary[1], primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text("PREPARADO PARA:", 14, 80);
      
      doc.setFontSize(12);
      doc.text(quote.cliente?.nombre || 'Cliente No Especificado', 14, 86);
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(`${quote.cliente?.tipoDocumento || 'NIT'}: ${quote.cliente?.nit || ''}`, 14, 92);
      doc.text(quote.cliente?.telefono || '', 14, 97);
      doc.text(`${quote.cliente?.direccion || ''}, ${quote.cliente?.ciudad || ''}`, 14, 102);
      
      // 6. Sort items: Products first, then Services
      const getTipo = (item: any): string => {
        const name = (item.nombre || '').toUpperCase();
        
        // Priority 1: Explicitly saved type
        if (item.tipo) return item.tipo;
        
        // Priority 2: Keyword check
        if (name.includes('SERVICIO') || name.includes('INSTALACION') || name.includes('MANO DE OBRA') || name.includes('INSTALACIÓN')) {
          return 'Servicio';
        }

        // Priority 3: Lookup in catalog
        const found = products.find((p: any) => p.nombre?.toUpperCase() === name);
        if (found) return found.tipo || 'Producto';

        return 'Producto';
      };

      const sortedItems = [...quote.items].sort((a: any, b: any) => {
        const typeA = getTipo(a);
        const typeB = getTipo(b);
        if (typeA === typeB) return 0;
        return typeA === 'Producto' ? -1 : 1;
      });

      // Pre-load images using SORTED order (so indices match table rows)
      const loadedImages: Record<number, { data: string, width: number, height: number }> = {};
      await Promise.all(sortedItems.map(async (item: any, index: number) => {
        if (item?.imagenUrl) {
          try {
            loadedImages[index] = await getBase64ImageFromURL(item.imagenUrl);
          } catch (e) {
            console.error(`Error preloading image for item ${index}`, e);
          }
        }
      }));

      // Build table - in invoice mode, skip IMG column
      const tableHead = isInvoice
        ? [['Descripción', 'Cantidad', 'Precio', 'Total']]
        : [['IMG', 'Descripción', 'Cantidad', 'Precio', 'Total']];

      const tableData = sortedItems.map((item: any) => isInvoice
        ? [
            item.nombre,
            item.cantidad,
            `$${Number(item.precio).toLocaleString('es-CO')}`,
            `$${((Number(item.cantidad) || 0) * item.precio).toLocaleString('es-CO')}`
          ]
        : [
            '', // Image placeholder
            item.nombre,
            item.cantidad,
            `$${Number(item.precio).toLocaleString('es-CO')}`,
            `$${((Number(item.cantidad) || 0) * item.precio).toLocaleString('es-CO')}`
          ]
      );
      autoTable(doc, {
        startY: 110,
        head: tableHead,
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: primary, 
          textColor: [255, 255, 255], 
          halign: 'center', 
          valign: 'middle',
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: [60, 60, 60],
          fontSize: 9,
          valign: 'middle'
        },
        alternateRowStyles: { fillColor: light },
        styles: {
          minCellHeight: isInvoice ? 10 : 24, // Compact rows for invoice, tall for images
          cellPadding: 3
        },
        columnStyles: isInvoice
          ? {
              0: { cellWidth: 80, halign: 'left' },
              1: { cellWidth: 22, halign: 'center' },
              2: { cellWidth: 40, halign: 'right' },
              3: { cellWidth: 40, halign: 'right' }
            }
          : {
              0: { cellWidth: 24, halign: 'center' },
              1: { cellWidth: 70, halign: 'justify' },
              2: { cellWidth: 22, halign: 'center' },
              3: { cellWidth: 33, halign: 'right' },
              4: { cellWidth: 33, halign: 'right' }
            },
        didDrawCell: isInvoice ? undefined : (data: any) => {
          if (data.section === 'body' && data.column.index === 0) {
            const imgData = loadedImages[data.row.index];
            if (imgData && imgData.data) {
              try {
                const formatMatch = imgData.data.match(/data:image\/([a-zA-Z]*);base64,/);
                const format = formatMatch ? formatMatch[1].toUpperCase() : 'JPEG';
                
                let imgWidth = 18;
                let imgHeight = 18;
                if (imgData.width > imgData.height) {
                  imgHeight = 18 * (imgData.height / imgData.width);
                } else if (imgData.height > imgData.width) {
                  imgWidth = 18 * (imgData.width / imgData.height);
                }
                
                const x = data.cell.x + (data.cell.width - imgWidth) / 2;
                const y = data.cell.y + (data.cell.height - imgHeight) / 2;
                doc.addImage(imgData.data, format, x, y, imgWidth, imgHeight);
              } catch (e) {
                console.error("Error drawing image", e);
              }
            }
          }
        }
      });
      
      const finalY = (doc as any).lastAutoTable.finalY || 105;
      let currentY = finalY + 10;

      // Check if summary fits on current page
      // Summary block needs ~60mm (total box + notes + signature)
      // Bottom swoosh occupies ~25mm from page bottom
      const availableSpace = pageHeight - 25 - currentY;
      if (availableSpace < 60) {
        doc.addPage();
        currentY = 30;
      }
      
      // 6. Total Box
      doc.setFillColor(primary[0], primary[1], primary[2]);
      doc.rect(130, currentY, 65, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("TOTAL:", 135, currentY + 8);
      doc.text(`$${Number(quote.total).toLocaleString()}`, 190, currentY + 8, { align: 'right' });
      
      // 7. Footer Notes & Signature
      doc.setTextColor(primary[0], primary[1], primary[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Nota:", 20, currentY + 25);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(isInvoice
        ? "La fecha de ejecución del servicio se coordinará según disponibilidad.\nEsta factura de venta se asimila en todos sus efectos legales a una letra\nde cambio según el Art 774 del código de Comercio."
        : "La cotización es válida por 5 días hábiles.\nLa fecha de ejecución del servicio se coordinará según disponibilidad.\nEsta cotización se asimila en todos sus efectos legales a una letra\nde cambio según el Art 774 del código de Comercio.", 20, currentY + 31);
      
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.5);
      doc.line(130, currentY + 45, 190, currentY + 45);
      doc.text("Firma de Aceptación", 160, currentY + 50, { align: 'center' });
      doc.text(quote.cliente?.nit || '', 160, currentY + 55, { align: 'center' });
      
      // 8. Bottom Swooshes
      // Light background curve
      doc.setFillColor(220, 225, 235);
      doc.ellipse(105, pageHeight, 180, 35, 'F');
      
      // Dark foreground curve
      doc.setFillColor(primary[0], primary[1], primary[2]);
      doc.ellipse(105, pageHeight + 10, 180, 35, 'F');
      
      // Contact Info
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("300 5646815  •  multitalleres24@gmail.com", 105, pageHeight - 12, { align: 'center' });
      
      const clienteName = (quote.cliente?.nombre || '').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').replace(/\s+/g, '_');
      const fileName = `${isInvoice ? 'Factura' : 'Cotizacion'}_${quote.numero?.replace('#', '') || 'S_N'}_${clienteName}.pdf`;

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);

      if (preOpenedWindow) {
        // View mode: embed PDF in HTML page with proper title for download name
        const blobUrl = URL.createObjectURL(blob);
        preOpenedWindow.document.open();
        preOpenedWindow.document.write(`
          <!DOCTYPE html>
          <html><head><title>${fileName}</title>
          <style>body{margin:0;overflow:hidden}</style></head>
          <body><embed src="${blobUrl}" type="application/pdf" width="100%" height="100%" style="position:absolute;top:0;left:0;right:0;bottom:0" /></body></html>
        `);
        preOpenedWindow.document.close();
      } else {
        // Download mode: use anchor with download attribute
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) {
      if (preOpenedWindow) preOpenedWindow.close();
      console.error("Error generando PDF:", err);
      showAlert("Error de PDF", "Hubo un error al generar el archivo. Por favor intente de nuevo.", "error");
    }
  };

  const handleDeleteQuote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      await quotesService.remove(deleteConfirm.id);
      loadData();
    }
  };

  const handleToggleEstado = (e: React.MouseEvent, q: any) => {
    e.stopPropagation();
    if (q.estado === 'Aceptada') return;
    setStatusConfirm({ isOpen: true, quote: q });
  };

  const confirmStatusChange = async () => {
    if (statusConfirm.quote) {
      const q = statusConfirm.quote;
      const newEstado = 'Aceptada';
      // Optimistic update - no flicker
      setQuotes(prev => prev.map(quote => quote.id === q.id ? { ...quote, estado: newEstado } : quote));
      await quotesService.update(q.id, { ...q, estado: newEstado });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.nombre || items.length === 0 || isSubmitting) return;
    
    // Open window synchronously to avoid popup blocker
    const pdfWindow = window.open('', '_blank');
    if (pdfWindow) {
      pdfWindow.document.write('<div style="font-family: monospace; padding: 40px; background: #050505; color: #00A3E0; height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">Generando Cotización...</div>');
    }
    
    setIsSubmitting(true);
    try {
      let clientId = clientForm.id;
    
    if (!clientId) {
      const newClientData = {
        nombre: clientForm.nombre,
        tipoDocumento: clientForm.tipoDocumento || 'NIT',
        nit: clientForm.nit,
        direccion: clientForm.direccion,
        ciudad: clientForm.ciudad,
        telefono: clientForm.telefono
      };
      const createdClient = await clientsService.add(newClientData, profile!.uid);
      clientId = createdClient.id;
    }
    
    let nextNum = 1;
    if (!selectedQuoteId && quotes.length > 0) {
      const maxNum = Math.max(...quotes.map(q => {
        const match = q.numero?.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      }));
      if (maxNum > 0) nextNum = maxNum + 1;
    }
    
    const existingQuote = selectedQuoteId ? quotes.find(q => q.id === selectedQuoteId) : null;

    const hoy = new Date();
    const fechaEmision = existingQuote?.fechaEmision || hoy.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    let fechaVencimiento = existingQuote?.fechaVencimiento;
    if (!fechaVencimiento) {
      const vence = new Date(hoy);
      vence.setDate(vence.getDate() + 5);
      fechaVencimiento = vence.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    const quoteData = {
      numero: existingQuote ? existingQuote.numero : `#${String(nextNum).padStart(4, '0')}`,
      cliente: { 
        id: clientId, 
        nombre: clientForm.nombre, 
        tipoDocumento: clientForm.tipoDocumento || 'NIT', 
        nit: clientForm.nit, 
        direccion: clientForm.direccion, 
        ciudad: clientForm.ciudad, 
        telefono: clientForm.telefono 
      },
      items,
      total: calculateTotal(),
      fecha: fechaEmision, 
      fechaEmision,
      fechaVencimiento,
      tipoPago,
      estado: existingQuote ? existingQuote.estado : 'Pendiente'
    };

      if (selectedQuoteId) {
        await quotesService.update(selectedQuoteId, quoteData);
      } else {
        await quotesService.add(quoteData, profile!.uid);
      }
      
      setIsModalOpen(false);
      setSelectedQuoteId(null);
      setClientForm({ id: '', nombre: '', tipoDocumento: 'NIT', nit: '', direccion: '', ciudad: '', telefono: '' });
      setItems([{ nombre: '', precio: 0, cantidad: 1, imagenUrl: '', tipo: 'Producto' }]);
      
      // Auto-generate PDF for the newly created or updated quote
      generatePDF(quoteData, pdfWindow);
      
      loadData();
    } catch (error) {
      if (pdfWindow) pdfWindow.close();
      console.error("Error saving quote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel rounded-2xl p-5 backdrop-blur-xl bg-black/40 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00A3E0]/10 flex items-center justify-center border border-[#00A3E0]/20">
            <FileText className="text-[#00A3E0]" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-mono font-bold uppercase tracking-widest text-shadow-neon">Cotizaciones</h2>
            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.2em]">Centro de Operaciones</p>
          </div>
        </div>
        <CyberButton onClick={handleNewQuoteClick} className="w-full md:w-auto">
          <span className="flex items-center justify-center gap-2 font-bold uppercase tracking-tighter"><Plus size={16} /> Nueva Cotización</span>
        </CyberButton>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block glass-panel overflow-hidden rounded-2xl p-4 backdrop-blur-xl bg-black/40 border border-white/10 shadow-xl">
        <table className="w-full text-left font-mono text-sm border-separate" style={{ borderSpacing: '0 0.75rem' }}>
          <thead className="text-[#00A3E0] text-[10px] uppercase tracking-widest font-medium">
            <tr>
              <th className="px-4 pb-2">Terminal</th>
              <th className="px-4 pb-2">Fecha</th>
              <th className="px-4 pb-2">Cliente</th>
              <th className="px-4 pb-2">Total</th>
              <th className="px-4 pb-2">Estado</th>
              <th className="px-4 pb-2 text-center">Documentos</th>
              <th className="px-4 pb-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center bg-white/5 rounded-xl">
                  <Loader2 className="w-8 h-8 text-[#00A3E0] animate-spin mx-auto mb-2" />
                  <span className="text-[10px] uppercase tracking-widest text-[#00A3E0]/60">Sincronizando Terminal...</span>
                </td>
              </tr>
            ) : quotes.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500 bg-white/5 rounded-xl">No hay registros activos.</td></tr>
            ) : (
              quotes.map(q => (
                <tr 
                  key={q.id} 
                  className={`bg-white/5 transition-all duration-300 group shadow-md border-y border-white/5 transform hover:scale-[1.005] ${
                    q.estado === 'Aceptada' 
                      ? 'opacity-80 cursor-default' 
                      : 'hover:bg-white/10 cursor-pointer'
                  }`}
                  onClick={() => q.estado !== 'Aceptada' && handleEditQuote(q)}
                >
                  <td className="p-4 text-white font-bold rounded-l-xl border-y border-l border-white/5 group-hover:border-[#00A3E0]/30">{q.numero || '#0000'}</td>
                  <td className="p-4 text-gray-400 border-y border-white/5 group-hover:border-[#00A3E0]/30">{q.fecha}</td>
                  <td className="p-4 font-medium text-white border-y border-white/5 group-hover:border-[#00A3E0]/30">{q.cliente?.nombre}</td>
                  <td className="p-4 text-[#00A3E0] font-black border-y border-white/5 group-hover:border-[#00A3E0]/30">${Number(q.total).toLocaleString('es-CO')}</td>
                  <td className="p-4 border-y border-white/5 group-hover:border-[#00A3E0]/30">
                    <button
                      onClick={(e) => handleToggleEstado(e, q)}
                      className={`px-3 py-1.5 text-[10px] rounded-full border transition-all flex items-center gap-1.5 font-bold uppercase tracking-tighter ${
                        q.estado === 'Pendiente' ? 'bg-[#ffb800]/10 text-[#ffb800] border-[#ffb800]/30 hover:bg-[#ffb800]/20' : 
                        q.estado === 'Aceptada' ? 'bg-[#39ff8f]/10 text-[#39ff8f] border-[#39ff8f]/30' : 
                        'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                      }`}
                    >
                      {q.estado !== 'Aceptada' && <ArrowRightLeft size={10} />}
                      {q.estado}
                    </button>
                  </td>
                  <td className="p-4 text-center border-y border-white/5 group-hover:border-[#00A3E0]/30">
                    <div className="flex items-center justify-center gap-2">
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === `cot-${q.id}` ? null : `cot-${q.id}`); }}
                          onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                          className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-[#00A3E0] border border-[#00A3E0]/20 hover:bg-[#00A3E0] hover:text-white transition-all"
                        >
                          <FileText size={14} />
                        </button>
                        {activeDropdown === `cot-${q.id}` && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0f172a] border border-[#00A3E0]/30 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[10rem]">
                            <button
                              className="w-full px-4 py-2.5 text-left text-[10px] font-mono text-white hover:bg-[#00A3E0]/20 flex items-center gap-2 uppercase tracking-widest"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(null);
                                const pdfWindow = window.open('', '_blank');
                                if (pdfWindow) pdfWindow.document.write('<div style="font-family: monospace; padding: 40px; background: #050505; color: #00A3E0; height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">Generando Cotización...</div>');
                                generatePDF(q, pdfWindow);
                              }}
                            >
                              <Eye size={12} /> Ver
                            </button>
                          </div>
                        )}
                      </div>
                      {q.estado === 'Aceptada' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); generatePDF(q, null, { isInvoice: true }); }}
                          className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-[#39ff8f] border border-[#39ff8f]/20 hover:bg-[#39ff8f] hover:text-black transition-all"
                        >
                          <DollarSign size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center rounded-r-xl border-y border-r border-white/5 group-hover:border-[#00A3E0]/30">
                    <button 
                      onClick={(e) => handleDeleteQuote(e, q.id)}
                      className="w-8 h-8 mx-auto rounded-lg bg-black/40 flex items-center justify-center text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
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
            <p className="text-[10px] font-mono text-[#00A3E0]/60 uppercase tracking-widest">Enlace Satelital...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="p-8 text-center text-gray-500 glass-panel rounded-2xl">No hay registros activos.</div>
        ) : (
          quotes.map(q => (
            <div 
              key={q.id} 
              className={`glass-panel rounded-2xl p-5 border relative overflow-hidden group ${q.estado === 'Aceptada' ? 'bg-[#39ff8f]/5 border-[#39ff8f]/10' : 'bg-black/60 border-white/5'}`}
              onClick={() => q.estado !== 'Aceptada' && handleEditQuote(q)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-black font-mono text-base">{q.numero || '#0000'}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleEstado(e, q); }}
                      className={`min-w-[100px] flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-mono font-black uppercase tracking-widest rounded-xl border transition-all active:scale-90 shadow-lg ${
                        q.estado === 'Pendiente' ? 'bg-[#ffb800]/10 text-[#ffb800] border-[#ffb800]/40 shadow-[0_0_15px_rgba(255,184,0,0.15)]' : 
                        q.estado === 'Aceptada' ? 'bg-[#39ff8f]/10 text-[#39ff8f] border-[#39ff8f]/20 cursor-default' : 
                        'bg-red-500/10 text-red-400 border-red-500/30 active:bg-red-500/40'
                      }`}
                      title={q.estado === 'Aceptada' ? "Bloqueada" : "Cambiar estado"}
                    >
                      {q.estado !== 'Aceptada' && <ArrowRightLeft size={12} className="shrink-0" />}
                      <span>{q.estado}</span>
                    </button>
                  </div>
                  <h3 className="text-gray-300 font-bold font-mono text-sm mt-1 uppercase truncate max-w-[200px]">{q.cliente?.nombre}</h3>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); generatePDF(q, null); }}
                  className="p-3 rounded-xl bg-[#00A3E0]/10 text-[#00A3E0] border border-[#00A3E0]/20 shadow-[0_0_15px_rgba(0,163,224,0.1)] active:scale-95 transition-all"
                  title="Ver Cotización"
                >
                  <FileText size={20} />
                </button>
              </div>

              <div className="flex justify-between items-end mt-6 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Total Operación</p>
                  <p className="text-lg font-black font-mono text-[#00A3E0]">${Number(q.total).toLocaleString('es-CO')}</p>
                </div>
                <div className="flex gap-2">
                  {q.estado === 'Aceptada' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); generatePDF(q, null, { isInvoice: true }); }}
                      className="p-3 rounded-xl bg-[#39ff8f]/10 text-[#39ff8f] border border-[#39ff8f]/20 shadow-[0_0_15px_rgba(57,255,143,0.2)] active:scale-95 transition-all"
                      title="Ver Factura"
                    >
                      <DollarSign size={20} />
                    </button>
                  )}
                  <button 
                    onClick={(e) => handleDeleteQuote(e, q.id)}
                    className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <CyberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedQuoteId ? `Editar Cotización ${quotes.find(q=>q.id===selectedQuoteId)?.numero || ''}` : "Generar Cotización"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reuse Quote Search - only for new quotes */}
          {!selectedQuoteId && (
            <div className="relative">
              <div className="flex items-center gap-3 bg-gradient-to-r from-[#00A3E0]/10 to-transparent border border-[#00A3E0]/30 rounded-xl p-3 pr-4">
                <Copy size={18} className="text-[#00A3E0] shrink-0" />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Reutilizar cotización anterior... (buscar por # o cliente)"
                    className="w-full bg-transparent border-none outline-none text-sm font-mono text-white placeholder-gray-500"
                    value={reuseSearch}
                    onChange={e => { setReuseSearch(e.target.value); setShowReuseSuggestions(true); }}
                    onFocus={() => setShowReuseSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowReuseSuggestions(false), 200)}
                    autoComplete="off"
                  />
                </div>
                <Search size={16} className="text-gray-500 shrink-0" />
              </div>
              {showReuseSuggestions && reuseSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto custom-scrollbar bg-[#0f172a] border border-[#00A3E0]/30 rounded-xl z-50 shadow-2xl">
                  {quotes.filter(q => {
                    const search = reuseSearch.toLowerCase();
                    return (q.numero || '').toLowerCase().includes(search) ||
                           (q.cliente?.nombre || '').toLowerCase().includes(search);
                  }).length > 0 ? (
                    quotes.filter(q => {
                      const search = reuseSearch.toLowerCase();
                      return (q.numero || '').toLowerCase().includes(search) ||
                             (q.cliente?.nombre || '').toLowerCase().includes(search);
                    }).map(q => (
                      <div
                        key={q.id}
                        className="px-4 py-3 hover:bg-[#00A3E0]/20 cursor-pointer font-mono transition-colors border-b border-white/5 last:border-0"
                        onClick={() => handleReuseQuote(q)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[#00A3E0] font-bold text-sm">{q.numero}</span>
                          <span className="text-[#39ff8f] text-xs">${Number(q.total).toLocaleString('es-CO')}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{q.cliente?.nombre} — {q.items?.length || 0} ítems</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-gray-500 font-mono italic text-center">
                      No se encontraron cotizaciones.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Header Metadata */}
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-between bg-black/60 border border-white/10 p-4 rounded-xl text-sm font-mono shadow-[0_0_15px_rgba(0,163,224,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#00A3E0]"></div>
            <div className="flex items-center gap-3">
               <Calendar size={18} className="text-[#00A3E0]"/>
               <div>
                 <div className="text-[10px] text-gray-400 uppercase tracking-widest">Fecha Emisión</div>
                 <div className="text-white font-bold">{fechas.emision}</div>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <Calendar size={18} className="text-[#ffb800]"/>
               <div>
                 <div className="text-[10px] text-gray-400 uppercase tracking-widest">Vencimiento (+5 Días)</div>
                 <div className="text-[#ffb800] font-bold">{fechas.vencimiento}</div>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <CheckCircle2 size={18} className="text-[#39ff8f]"/>
               <div>
                 <div className="text-[10px] text-gray-400 uppercase tracking-widest">Estado Actual</div>
                 <div className="text-[#39ff8f] font-bold">{selectedQuoteId ? quotes.find(q => q.id === selectedQuoteId)?.estado : 'Nueva'}</div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-5 border border-white/10 bg-black/40 rounded-lg relative overflow-hidden group hover:border-[#00A3E0]/30 transition-colors">
              <div className="absolute top-0 left-0 w-1 h-full bg-white/20 group-hover:bg-[#00A3E0] transition-colors"></div>
              <h3 className="text-xs font-mono text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-2">
                <User size={14} className="text-[#00A3E0]"/> Identidad de Cliente
              </h3>
              
              <div className="relative">
                <CyberInput 
                  label="Nombre o Razón Social (Buscar)" 
                  required
                  value={clientForm.nombre}
                  onChange={handleClientNameChange}
                  onFocus={() => setShowClientSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowClientSuggestions(false), 200)}
                  autoComplete="off"
                />
                
                {showClientSuggestions && clientForm.nombre && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto custom-scrollbar bg-[#0f172a] border border-[#00A3E0]/30 rounded z-50 shadow-xl">
                    {clients.filter(c => (c.nombre || '').toLowerCase().includes(clientForm.nombre.toLowerCase())).length > 0 ? (
                      clients.filter(c => (c.nombre || '').toLowerCase().includes(clientForm.nombre.toLowerCase())).map(c => (
                        <div 
                          key={c.id} 
                          className="px-4 py-2 hover:bg-[#00A3E0]/20 cursor-pointer text-sm font-mono transition-colors border-b border-white/5 last:border-0"
                          onClick={() => handleSelectClient(c)}
                        >
                          <div className="font-bold text-white">{c.nombre}</div>
                          <div className="text-xs text-[#00A3E0]">NIT: {c.nit}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-gray-500 font-mono italic text-center">
                        Cliente no encontrado. Se creará uno nuevo al guardar.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5 col-span-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Tipo Doc.</label>
                  <select 
                    className={`bg-[#050505]/50 border border-[#00A3E0]/30 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#00A3E0] focus:ring-2 focus:ring-[#00A3E0]/50 shadow-inner transition-all duration-300 w-full ${!!clientForm.id ? 'opacity-50 cursor-not-allowed border-gray-700' : ''}`}
                    value={clientForm.tipoDocumento}
                    onChange={e => setClientForm({...clientForm, tipoDocumento: e.target.value})}
                    disabled={!!clientForm.id}
                  >
                    <option value="NIT" className="bg-[#050505]">NIT</option>
                    <option value="CC" className="bg-[#050505]">CC</option>
                  </select>
                </div>
                <CyberInput label="Número" required value={clientForm.nit} onChange={e => setClientForm({...clientForm, nit: e.target.value})} className="col-span-2" disabled={!!clientForm.id} />
              </div>
            </div>

            <div className="space-y-4 p-5 border border-white/10 bg-black/40 rounded-lg relative overflow-hidden group hover:border-[#00A3E0]/30 transition-colors">
              <div className="absolute top-0 left-0 w-1 h-full bg-white/20 group-hover:bg-[#00A3E0] transition-colors"></div>
              <h3 className="text-xs font-mono text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-2">
                <MapPin size={14} className="text-[#00A3E0]"/> Ubicación y Contacto
              </h3>
              <CyberInput label="Teléfono / Celular" required value={clientForm.telefono} onChange={e => setClientForm({...clientForm, telefono: e.target.value.replace(/\D/g, '')})} disabled={!!clientForm.id} />
              <div className="grid grid-cols-2 gap-3">
                <CyberInput label="Dirección" required value={clientForm.direccion} onChange={e => setClientForm({...clientForm, direccion: e.target.value})} disabled={!!clientForm.id} />
                <CyberInput label="Ciudad" required value={clientForm.ciudad} onChange={e => setClientForm({...clientForm, ciudad: e.target.value})} disabled={!!clientForm.id} />
              </div>
            </div>
          </div>

          <div className="p-4 border border-[#00A3E0]/30 bg-[#00A3E0]/5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <span className="text-xs font-mono text-white uppercase tracking-widest">Condición de Pago:</span>
             <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${tipoPago === 'Contado' ? 'border-[#00A3E0]' : 'border-gray-500 group-hover:border-gray-400'}`}>
                     {tipoPago === 'Contado' && <div className="w-2 h-2 rounded-full bg-[#00A3E0]"></div>}
                  </div>
                  <input type="radio" name="tipoPago" value="Contado" className="hidden" checked={tipoPago === 'Contado'} onChange={() => setTipoPago('Contado')} />
                  <span className={`text-sm font-mono transition-colors ${tipoPago === 'Contado' ? 'text-white' : 'text-gray-400'}`}>Contado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${tipoPago === 'Crédito' ? 'border-[#00A3E0]' : 'border-gray-500 group-hover:border-gray-400'}`}>
                     {tipoPago === 'Crédito' && <div className="w-2 h-2 rounded-full bg-[#00A3E0]"></div>}
                  </div>
                  <input type="radio" name="tipoPago" value="Crédito" className="hidden" checked={tipoPago === 'Crédito'} onChange={() => setTipoPago('Crédito')} />
                  <span className={`text-sm font-mono transition-colors ${tipoPago === 'Crédito' ? 'text-white' : 'text-gray-400'}`}>Crédito</span>
                </label>
             </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-mono text-white uppercase tracking-widest border-b border-white/10 pb-2 mb-4">Detalle de Productos / Servicios</h3>
            
            {items.map((item, index) => (
              <div key={index} className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-[#00A3E0]/30 transition-all group relative">
                {/* Bloque 1: Descripción (100%) */}
                <div className="relative w-full">
                  <CyberInput 
                    label="Descripción del Item" 
                    className="w-full text-center"
                    required
                    value={item.nombre} 
                    onChange={e => handleItemChange(index, 'nombre', e.target.value)} 
                    onFocus={() => setActiveProductRow(index)}
                    onBlur={() => setTimeout(() => setActiveProductRow(null), 200)}
                    autoComplete="off"
                  />
                  {activeProductRow === index && item.nombre && (
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto custom-scrollbar bg-[#0f172a] border border-[#00A3E0]/30 rounded-xl z-50 shadow-2xl">
                      {products.filter(p => (p.nombre || '').toLowerCase().includes(item.nombre.toLowerCase())).length > 0 ? (
                        products.filter(p => (p.nombre || '').toLowerCase().includes(item.nombre.toLowerCase())).map(p => (
                          <div 
                            key={p.id} 
                            className="px-4 py-3 hover:bg-[#00A3E0]/20 cursor-pointer text-sm font-mono transition-colors flex justify-between border-b border-white/5 last:border-0"
                            onClick={() => handleSelectProduct(index, p)}
                          >
                            <span className="font-bold text-white truncate pr-2">{p.nombre}</span>
                            <span className="text-[#39ff8f] shrink-0 font-bold">${Number(p.precioBase || 0).toLocaleString('es-CO')}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-xs text-gray-500 font-mono italic text-center">
                          Item no encontrado en inventario.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Bloque 2: Valor Unitario, Cantidad, Total y Acciones */}
                <div className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-4 sm:col-span-4 text-center">
                    <CyberInput 
                      label="Valor Unitario" 
                      type="text" 
                      className="w-full text-center"
                      required
                      value={item.precio ? Number(String(item.precio).replace(/\D/g, '')).toLocaleString('es-CO') : ''} 
                      onChange={e => handleItemChange(index, 'precio', Number(e.target.value.replace(/\D/g, '')) || 0)} 
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-center">
                    <CyberInput 
                      label="Cantidad" 
                      type="text" 
                      className="w-full text-center"
                      required
                      value={item.cantidad} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        handleItemChange(index, 'cantidad', val === '' ? '' : parseInt(val));
                      }} 
                    />
                  </div>
                  
                  <div className="col-span-4 sm:col-span-5 text-center">
                    <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">Total</div>
                    <div className="text-sm font-mono text-[#00A3E0] font-bold truncate py-2.5">
                      ${(item.precio * (Number(item.cantidad) || 0)).toLocaleString('es-CO')}
                    </div>
                  </div>

                  <div className="col-span-1 flex justify-end pb-1.5">
                     {items.length > 1 && (
                       <button 
                         type="button" 
                         onClick={() => handleRemoveItem(index)} 
                         className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-red-400 transition-all bg-black/40 rounded-xl border border-white/5 hover:border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                         title="Eliminar item"
                       >
                         <Trash2 size={16} />
                       </button>
                     )}
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={handleAddItem} 
              className="mt-4 w-full py-3 bg-[#00A3E0]/10 border border-[#00A3E0]/30 text-[#00A3E0] hover:bg-[#00A3E0]/20 hover:border-[#00A3E0]/50 transition-colors text-xs font-mono tracking-widest flex items-center justify-center gap-2 uppercase rounded-lg"
            >
              <Plus size={16} /> Agregar Nueva Fila
            </button>
          </div>

          <div className="flex justify-between items-center bg-[#00A3E0]/10 p-5 border border-[#00A3E0]/30 rounded-lg">
            <span className="font-mono text-sm text-gray-300 uppercase tracking-widest">Costo Total</span>
            <span className="font-mono text-3xl font-bold text-[#00A3E0] text-shadow-neon">
              ${calculateTotal().toLocaleString('es-CO')}
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <CyberButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Procesando..." : selectedQuoteId ? "Actualizar Cotización" : "Emitir Cotización"}
            </CyberButton>
          </div>
        </form>
      </CyberModal>

      <CyberConfirm 
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Eliminar Cotización"
        message="¿Está seguro de que desea eliminar esta cotización? Esta acción no se puede deshacer."
      />

      <CyberConfirm 
        isOpen={statusConfirm.isOpen}
        onClose={() => setStatusConfirm({ isOpen: false, quote: null })}
        onConfirm={confirmStatusChange}
        title="Confirmar Aceptación"
        message={`¿Está seguro de marcar la cotización ${statusConfirm.quote?.numero} como ACEPTADA? Esto confirma que el cliente acepta los precios y condiciones.`}
      />

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

export const QuoteManager = () => (
  <ErrorBoundary>
    <AuthProvider>
      <QuoteManagerInner />
    </AuthProvider>
  </ErrorBoundary>
);

export const ProviderManager = () => (
  <ErrorBoundary>
    <AuthProvider>
      <ProviderManagerInner />
    </AuthProvider>
  </ErrorBoundary>
);

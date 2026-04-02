import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Upload, FileText, CheckCircle2, AlertCircle, Plus, Trash2, File as FileIcon } from 'lucide-react';
import { Order, Shipment } from '../types';
import { cn } from '../lib/utils';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | Order[] | null;
  allOrders: Order[];
  onSave: (invoiceData: any) => void;
  editingShipment?: Shipment | null;
}

function StableText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={className} translate="no">{children}</span>;
}

export default function InvoiceModal({ isOpen, onClose, order, allOrders, onSave, editingShipment }: InvoiceModalProps) {
  const [step, setStep] = useState(1);
  const [sessionOrder, setSessionOrder] = useState<Order | Order[] | null>(order);
  const [sessionEditingShipment, setSessionEditingShipment] = useState<Shipment | null>(editingShipment ?? null);
  const initialOrders = Array.isArray(order) ? order : order ? [order] : [];

  const parsePriceValue = (value: string | number | undefined): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const raw = String(value || '').trim();
    if (!raw) return 0;
    const cleaned = raw.replace(/[^0-9,.-]/g, '');
    if (!cleaned) return 0;
    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');
    if (hasComma && hasDot) {
      if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
        return Number(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
      }
      return Number(cleaned.replace(/,/g, '')) || 0;
    }
    if (hasComma) {
      return Number(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return Number(cleaned) || 0;
  };

  const [selectedOrders, setSelectedOrders] = useState<Order[]>(initialOrders);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    priority: 'Media',
    etd: '',
    eta: '',
    loadingPort: '',
    dischargePort: '',
    reference: '',
    status: 'TRANSITO',
    customsAgent: '',
    transportMode: 'maritimo' as 'maritimo' | 'aereo' | 'terrestre',
    files: [] as File[],
  });

  const [quantities, setQuantities] = useState<{ [key: string]: number }>(
    initialOrders.reduce((acc, o) => ({ ...acc, [o.id]: o.pend }), {})
  );
  const [unitPrices, setUnitPrices] = useState<{ [key: string]: number }>(
    initialOrders.reduce((acc, o) => ({ ...acc, [o.id]: parsePriceValue(o.precioNetoUnitario) }), {})
  );
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.invoiceNumber.trim()) newErrors.invoiceNumber = 'El n\u00famero de factura es obligatorio';
    if (!formData.invoiceDate) newErrors.invoiceDate = 'La fecha de factura es obligatoria';
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: { [key: string]: string } = {};
    const dateFields: ('etd' | 'eta')[] = ['etd', 'eta'];
    dateFields.forEach(field => {
      const value = formData[field];
      if (value && typeof value === 'string' && value.trim() !== '') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          newErrors[field] = 'Formato de fecha inv\u00e1lido';
        }
      }
    });
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (isOpen && order) {
      setSessionOrder(order);
      setSessionEditingShipment(editingShipment ?? null);
      setStep(1);
      const currentOrders = Array.isArray(order) ? order : [order];
      setSelectedOrders(currentOrders);
      setQuantities(currentOrders.reduce((acc, o) => ({ ...acc, [o.id]: o.pend }), {}));
      setUnitPrices(currentOrders.reduce((acc, o) => ({ ...acc, [o.id]: parsePriceValue(o.precioNetoUnitario) }), {}));
      setShowItemDropdown(false);
      setCheckedItems(new Set());
      setFormErrors({});
      if (editingShipment) {
        setFormData({
          invoiceNumber: editingShipment.referenciaRemitente || editingShipment.referencia || '',
          invoiceDate: editingShipment.fechaFactura || '',
          priority: editingShipment.prioridad || 'Media',
          etd: editingShipment.etd || '',
          eta: editingShipment.eta || '',
          loadingPort: editingShipment.puertoOrigen || '',
          dischargePort: editingShipment.puertoDestino || '',
          reference: editingShipment.referencia || '',
          status: editingShipment.estado || 'TRANSITO',
          customsAgent: editingShipment.agenteAduana || '',
          transportMode: (editingShipment.tipoTransporte?.toLowerCase() as 'maritimo' | 'aereo' | 'terrestre') || 'maritimo',
          files: [],
        });
      } else {
        setFormData({
          invoiceNumber: '',
          invoiceDate: '',
          priority: 'Media',
          etd: '',
          eta: '',
          loadingPort: '',
          dischargePort: '',
          reference: '',
          status: 'TRANSITO',
          customsAgent: '',
          transportMode: 'maritimo',
          files: [],
        });
      }
    }
  }, [isOpen, order, editingShipment]);

  useEffect(() => {
    setShowItemDropdown(false);
    setCheckedItems(new Set());
  }, [step]);

  const modalOrder = sessionOrder ?? order;
  const activeEditingShipment = sessionEditingShipment ?? editingShipment ?? null;
  const mainOrder = Array.isArray(modalOrder) ? modalOrder[0] : modalOrder;

  const totalsByCurrency = selectedOrders.reduce((acc, o) => {
    const currency = String(o.moneda || 'USD').trim().toUpperCase() || 'USD';
    const rawQuant = Number(quantities[o.id] || 0);
    const rawUnitPrice = Number(unitPrices[o.id] || 0);
    const quant = Number.isFinite(rawQuant) ? rawQuant : 0;
    const unitPrice = Number.isFinite(rawUnitPrice) ? rawUnitPrice : 0;
    acc[currency] = (acc[currency] || 0) + (quant * unitPrice);
    return acc;
  }, {} as Record<string, number>);

  if (!mainOrder) return null;

  // Lista ESTABLE: todos los ítems del mismo pedido excepto el principal.
  // NUNCA se filtra por selectedOrders para que el .map() siempre produzca
  // la misma cantidad de nodos DOM y React no llame removeChild.
  const allSameOrderItems = allOrders.filter(o => o.pedido === mainOrder.pedido && o.id !== mainOrder.id);
  const selectedIds = new Set(selectedOrders.map(o => o.id));
  // Ítems disponibles para agregar (solo para lógica, NO para renderizar)
  const availableItems = allSameOrderItems.filter(o => !selectedIds.has(o.id));

  const handleQuantityChange = (id: string, value: number) => {
    const sanitized = Number.isFinite(value) ? Math.max(0, value) : 0;
    setQuantities(prev => ({ ...prev, [id]: sanitized }));
  };

  const handleUnitPriceChange = (id: string, value: number) => {
    const sanitized = Number.isFinite(value) ? Math.max(0, value) : 0;
    setUnitPrices(prev => ({ ...prev, [id]: sanitized }));
  };

  const lineErrors = selectedOrders.reduce((acc, o) => {
    const qRaw = Number(quantities[o.id] || 0);
    const q = Number.isFinite(qRaw) ? qRaw : 0;
    if (q < 0) {
      acc[o.id] = 'Debe ser mayor o igual a 0';
    } else if (q > o.pend) {
      acc[o.id] = `Máximo ${o.pend}`;
    } else {
      acc[o.id] = '';
    }
    return acc;
  }, {} as Record<string, string>);

  const hasErrors = Object.values(lineErrors).some(e => e !== '');

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && hasErrors) return;
    setStep(s => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    setFormErrors({});
    setStep(s => Math.max(s - 1, 1));
  };

  const handleAddOrder = (orderToAdd: Order) => {
    if (!selectedOrders.find(o => o.id === orderToAdd.id)) {
      setSelectedOrders(prev => [...prev, orderToAdd]);
      setQuantities(prev => ({ ...prev, [orderToAdd.id]: orderToAdd.pend }));
      setUnitPrices(prev => ({ ...prev, [orderToAdd.id]: parsePriceValue(orderToAdd.precioNetoUnitario) }));
      setShowItemDropdown(false);
      setCheckedItems(new Set());
    }
  };

  const handleBulkAddOrders = () => {
    const ordersToAdd = allSameOrderItems.filter(i => checkedItems.has(i.id));
    if (ordersToAdd.length === 0) return;
    const existingIds = new Set(selectedOrders.map(o => o.id));
    const uniqueToAdd = ordersToAdd.filter(o => !existingIds.has(o.id));
    if (uniqueToAdd.length === 0) return;
    setSelectedOrders(prev => [...prev, ...uniqueToAdd]);
    setQuantities(prev => {
      const n = { ...prev };
      uniqueToAdd.forEach(o => { n[o.id] = o.pend; });
      return n;
    });
    setUnitPrices(prev => {
      const n = { ...prev };
      uniqueToAdd.forEach(o => { n[o.id] = parsePriceValue(o.precioNetoUnitario); });
      return n;
    });
    setShowItemDropdown(false);
    setCheckedItems(new Set());
  };

  const toggleCheckedItem = (id: string) => {
    if (selectedIds.has(id)) return; // ya agregado, no permitir check
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) newChecked.delete(id);
    else newChecked.add(id);
    setCheckedItems(newChecked);
  };

  const toggleSelectAll = () => {
    if (checkedItems.size === availableItems.length) {
      setCheckedItems(new Set());
    } else {
      setCheckedItems(new Set(availableItems.map(i => i.id)));
    }
  };

  const handleRemoveOrder = (orderId: string) => {
    if (selectedOrders.length > 1) {
      setSelectedOrders(selectedOrders.filter(o => o.id !== orderId));
      const newQuants = { ...quantities };
      delete newQuants[orderId];
      setQuantities(newQuants);
      const newPrices = { ...unitPrices };
      delete newPrices[orderId];
      setUnitPrices(newPrices);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  };

  const handleRemoveFile = (index: number) => {
    setFormData(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  };

  const handleSave = () => {
    if (validateStep3()) {
      onSave({
        ...formData,
        selectedOrders,
        quantities,
        unitPrices,
        shipmentId: activeEditingShipment?.id
      });
      onClose();
    }
  };

  /* =================================================================
   * RENDER: Todos los pasos y el dropdown SIEMPRE est\u00e1n en el DOM.
   * Solo se muestran/ocultan con style.display, NUNCA se montan/desmontan.
   * Esto elimina por completo el error removeChild de React.
   * ================================================================= */
  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm notranslate"
      translate="no"
      style={{ display: isOpen ? undefined : 'none' }}
      aria-hidden={!isOpen}
    >

      {/* ===== DROPDOWN OVERLAY (siempre montado, oculto con display) ===== */}
      <div
        style={{ display: showItemDropdown && allSameOrderItems.length > 0 ? undefined : 'none' }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowItemDropdown(false);
            setCheckedItems(new Set());
          }
        }}
      >
        <div className="w-96 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <button
              onClick={toggleSelectAll}
              className="text-[10px] font-bold text-lufussa-teal hover:underline flex items-center gap-2"
            >
              <div className={cn(
                "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all",
                checkedItems.size === availableItems.length && availableItems.length > 0 ? "bg-lufussa-teal border-lufussa-teal" : "border-slate-300 bg-white"
              )}>
                {checkedItems.size === availableItems.length && availableItems.length > 0 && <CheckCircle2 size={10} className="text-white" />}
              </div>
              <StableText>{checkedItems.size === availableItems.length && availableItems.length > 0 ? 'Desmarcar Todos' : 'Seleccionar Todos'}</StableText>
            </button>
            <StableText className="text-[10px] font-bold text-slate-400 uppercase">{availableItems.length} ítems disponibles</StableText>
          </div>
          <div className="max-h-96 overflow-y-auto p-1">
            {allSameOrderItems.map(item => {
              const alreadyAdded = selectedIds.has(item.id);
              return (
              <div
                key={item.id}
                onClick={() => !alreadyAdded && toggleCheckedItem(item.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 group",
                  alreadyAdded ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer",
                  checkedItems.has(item.id) && !alreadyAdded && "bg-lufussa-teal/5"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0",
                  alreadyAdded ? "bg-slate-300 border-slate-300" :
                  checkedItems.has(item.id) ? "bg-lufussa-teal border-lufussa-teal" : "border-slate-300 bg-white group-hover:border-lufussa-teal"
                )}>
                  {alreadyAdded ? <CheckCircle2 size={12} className="text-white" /> : checkedItems.has(item.id) && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                  <div className="flex justify-between items-center gap-2">
                    <StableText className="font-bold text-slate-700 text-xs truncate">{item.material}</StableText>
                    <StableText className="text-[10px] font-bold text-lufussa-teal shrink-0">+{item.pend}</StableText>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <StableText>{item.numMaterial || 'S/N'}</StableText>
                    <StableText>{item.moneda} {item.precioNetoUnitario}</StableText>
                  </div>
                  <div className="text-[10px] text-slate-400" translate="no">
                    Modelo: {item.modelo || 'N/A'}
                  </div>
                  {alreadyAdded && <StableText className="text-[9px] font-bold text-emerald-500 uppercase">Ya agregado</StableText>}
                </div>
              </div>
              );
            })}
          </div>
          <div className="p-3 border-t border-slate-50 bg-slate-50/30 flex gap-2">
            <button
              onClick={() => { setShowItemDropdown(false); setCheckedItems(new Set()); }}
              className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition-all"
            >
              <StableText>Cancelar</StableText>
            </button>
            <button
              onClick={handleBulkAddOrders}
              disabled={checkedItems.size === 0}
              className="flex-1 py-2 bg-lufussa-teal text-white rounded-lg text-xs font-bold shadow-md shadow-lufussa-teal/10 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              <StableText>Agregar {checkedItems.size > 0 ? checkedItems.size : ''}</StableText>
            </button>
          </div>
        </div>
      </div>

      {/* ===== MODAL PRINCIPAL ===== */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              <StableText>{editingShipment ? 'Editar Factura de Importación' : 'Agregar Factura de Importación'}</StableText>
            </h2>
            <p className="text-sm text-slate-500">
              <StableText>Paso {step} de 3: {step === 1 ? 'Información General' : step === 2 ? 'Cantidades e Ítems' : 'Logística y Documentación'}</StableText>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 flex">
          <div className={cn("h-full bg-lufussa-teal transition-all duration-500", step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full')} />
        </div>

        {/* Content - todos los pasos siempre montados, solo display toggle */}
        <div className="flex-1 overflow-y-auto p-8">

          {/* ===== PASO 1: Informaci\u00f3n General ===== */}
          <div style={{ display: step === 1 ? undefined : 'none' }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">N\u00famero de Factura</label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={e => {
                    setFormData({...formData, invoiceNumber: e.target.value});
                    if (formErrors.invoiceNumber) setFormErrors(prev => { const { invoiceNumber, ...rest } = prev; return rest; });
                  }}
                  placeholder="Ej: INV-2024-001"
                  className={cn(
                    "w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 transition-all",
                    formErrors.invoiceNumber ? "border-red-300 focus:ring-red-200 focus:border-red-500" : "border-slate-200 focus:ring-lufussa-teal/20 focus:border-lufussa-teal"
                  )}
                />
                {formErrors.invoiceNumber && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.invoiceNumber}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha de Factura</label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={e => {
                    setFormData({...formData, invoiceDate: e.target.value});
                    if (formErrors.invoiceDate) setFormErrors(prev => { const { invoiceDate, ...rest } = prev; return rest; });
                  }}
                  className={cn(
                    "w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 transition-all",
                    formErrors.invoiceDate ? "border-red-300 focus:ring-red-200 focus:border-red-500" : "border-slate-200 focus:ring-lufussa-teal/20 focus:border-lufussa-teal"
                  )}
                />
                {formErrors.invoiceDate && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.invoiceDate}</p>}
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText size={18} className="text-lufussa-teal" />
                Detalles del \u00cdtem Principal
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pedido</p>
                  <p className="text-sm text-slate-700 font-bold">{mainOrder.pedido}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material</p>
                  <p className="text-sm text-slate-700 font-bold">{mainOrder.numMaterial || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Modelo</p>
                  <p className="text-sm text-slate-700 font-bold">{mainOrder.modelo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Descripci\u00f3n</p>
                  <p className="text-sm text-slate-700 font-bold truncate">{mainOrder.material}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Prioridad de Importaci\u00f3n</label>
              <div className="flex gap-4">
                {['Alta', 'Media', 'Baja'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setFormData({...formData, priority: p})}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all",
                      formData.priority === p
                        ? "bg-lufussa-teal border-lufussa-teal text-white shadow-lg shadow-lufussa-teal/20"
                        : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ===== PASO 2: Cantidades e \u00cdtems ===== */}
          <div style={{ display: step === 2 ? undefined : 'none' }} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">\u00cdtems Incluidos en la Factura</h3>
                <button
                    style={{ display: availableItems.length > 0 ? undefined : 'none' }}
                    onClick={() => { setShowItemDropdown(true); setCheckedItems(new Set()); }}
                    className="flex items-center gap-2 text-xs font-bold text-lufussa-teal hover:bg-lufussa-teal/5 px-3 py-2 rounded-lg transition-all"
                  >
                    <Plus size={14} />
                    <StableText>Agregar más ítems del pedido {mainOrder.pedido}</StableText>
                  </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total de \u00edtems (sumatoria)</p>
                  <p className="text-sm font-bold text-slate-700">Comparar con el valor total de la factura</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {Object.keys(totalsByCurrency).length === 0 ? (
                    <StableText className="text-sm font-bold text-slate-500">0.00</StableText>
                  ) : (
                    Object.entries(totalsByCurrency).map(([currency, total]) => (
                      <div key={currency} className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-700">
                        <StableText>{currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StableText>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {selectedOrders.map((o) => {
                  const quantRaw = Number(quantities[o.id] || 0);
                  const unitPriceRaw = Number(unitPrices[o.id] || 0);
                  const quant = Number.isFinite(quantRaw) ? quantRaw : 0;
                  const unitPrice = Number.isFinite(unitPriceRaw) ? unitPriceRaw : 0;
                  const totalValue = quant * unitPrice;
                  const isComplete = quant >= o.pend;

                  return (
                    <div key={o.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-lufussa-teal/30 transition-all">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex-1 min-w-[200px] space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-800"><StableText>{o.material}</StableText></p>
                            <StableText className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                              isComplete ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                            )}>
                              {isComplete ? 'Completo' : `Pendiente: ${o.pend - quant}`}
                            </StableText>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase">
                            <StableText>Material: {o.numMaterial || 'N/A'}</StableText>
                            <StableText>Modelo: {o.modelo || 'N/A'}</StableText>
                            <StableText>Pendiente: {o.pend} unidades</StableText>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-8 items-end">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cant. Facturada</label>
                            <div className="relative">
                              <input
                                type="number"
                                value={quant}
                                onChange={e => handleQuantityChange(o.id, Number(e.target.value))}
                                className={cn(
                                  "w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-bold outline-none focus:ring-2 transition-all",
                                  lineErrors[o.id] ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-lufussa-teal/20"
                                )}
                              />
                            </div>
                            {lineErrors[o.id] && (
                              <p className="text-[9px] font-bold text-red-500 flex items-center gap-1">
                                <AlertCircle size={10} />
                                {lineErrors[o.id]}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Precio Unitario ({o.moneda})</label>
                            <input
                              type="number"
                              step="0.01"
                              value={unitPrice}
                              onChange={e => handleUnitPriceChange(o.id, Number(e.target.value))}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-lufussa-teal/20 transition-all"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor Total ({o.moneda})</label>
                            <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                              {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {o.id !== mainOrder.id && (
                            <button
                              onClick={() => handleRemoveOrder(o.id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Quitar \u00edtem"
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ===== PASO 3: Log\u00edstica y Documentaci\u00f3n ===== */}
          <div style={{ display: step === 3 ? undefined : 'none' }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ETD (Salida Estimada)</label>
                <input
                  type="date"
                  value={formData.etd}
                  onChange={e => {
                    setFormData({...formData, etd: e.target.value});
                    if (formErrors.etd) setFormErrors(prev => { const { etd, ...rest } = prev; return rest; });
                  }}
                  className={cn(
                    "w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 transition-all",
                    formErrors.etd ? "border-red-300 focus:ring-red-200 focus:border-red-500" : "border-slate-200 focus:ring-lufussa-teal/20 focus:border-lufussa-teal"
                  )}
                />
                {formErrors.etd && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.etd}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ETA (Llegada Estimada)</label>
                <input
                  type="date"
                  value={formData.eta}
                  onChange={e => {
                    setFormData({...formData, eta: e.target.value});
                    if (formErrors.eta) setFormErrors(prev => { const { eta, ...rest } = prev; return rest; });
                  }}
                  className={cn(
                    "w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 transition-all",
                    formErrors.eta ? "border-red-300 focus:ring-red-200 focus:border-red-500" : "border-slate-200 focus:ring-lufussa-teal/20 focus:border-lufussa-teal"
                  )}
                />
                {formErrors.eta && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{formErrors.eta}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Puerto de Carga</label>
                <input
                  type="text"
                  value={formData.loadingPort}
                  onChange={e => setFormData({...formData, loadingPort: e.target.value})}
                  placeholder="Ej: Puerto de Hamburgo"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-lufussa-teal/20 focus:border-lufussa-teal transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Puerto de Descarga</label>
                <input
                  type="text"
                  value={formData.dischargePort}
                  onChange={e => setFormData({...formData, dischargePort: e.target.value})}
                  placeholder="Ej: Puerto Cort\u00e9s"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-lufussa-teal/20 focus:border-lufussa-teal transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">N\u00famero de Referencia (Env\u00edo)</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={e => setFormData({...formData, reference: e.target.value})}
                  placeholder="Ej: 7-00853-2603"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-lufussa-teal/20 focus:border-lufussa-teal transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Modo de Transporte</label>
                <select
                  value={formData.transportMode}
                  onChange={e => setFormData({...formData, transportMode: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-lufussa-teal/20 focus:border-lufussa-teal transition-all appearance-none"
                >
                  <option value="maritimo">Mar\u00edtimo</option>
                  <option value="aereo">A\u00e9reo</option>
                  <option value="terrestre">Terrestre</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estatus</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-lufussa-teal/20 focus:border-lufussa-teal transition-all appearance-none"
                >
                  <option value="RECOLECTA">Recolecta</option>
                  <option value="CONTEX">Contex</option>
                  <option value="SOLBOX">Solbox</option>
                  <option value="TRANSITO">Transito</option>
                  <option value="ADUANA">Aduana</option>
                  <option value="PLANTA">Planta</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Agente Aduanal</label>
                <input
                  type="text"
                  value={formData.customsAgent}
                  onChange={e => setFormData({ ...formData, customsAgent: e.target.value })}
                  placeholder="Ej: Agencia XYZ"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-lufussa-teal/20 focus:border-lufussa-teal transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Documentaci\u00f3n Adjunta (Factura, AWB, BL, etc.)</label>
              <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-lufussa-teal/50 transition-all cursor-pointer bg-slate-50/50"
              >
                <div className="p-4 bg-white rounded-full shadow-sm text-lufussa-teal">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">Haga clic o arrastre archivos aqu\u00ed</p>
                  <p className="text-xs text-slate-400">PDF, Excel, JPG hasta 10MB</p>
                </div>
              </div>
              {formData.files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Archivos seleccionados ({formData.files.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl group hover:border-lufussa-teal/30 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                            <FileIcon size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveFile(index); }}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
              step === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-200"
            )}
          >
            <ChevronLeft size={20} />
            <StableText>Anterior</StableText>
          </button>

          <div>
            <button
              style={{ display: step < 3 ? undefined : 'none' }}
              onClick={handleNext}
              disabled={step === 2 && hasErrors}
              className={cn(
                "flex items-center gap-2 px-8 py-3 bg-lufussa-teal text-white rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-lufussa-teal/20",
                step === 2 && hasErrors && "opacity-50 cursor-not-allowed"
              )}
            >
              <StableText>Siguiente</StableText>
              <ChevronRight size={20} />
            </button>
            <button
              style={{ display: step === 3 ? undefined : 'none' }}
              onClick={handleSave}
              className="flex items-center gap-2 px-8 py-3 bg-lufussa-teal text-white rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-lufussa-teal/20"
            >
              <CheckCircle2 size={20} />
              <StableText>Guardar Factura y Logística</StableText>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Save, Copy, User, Package, Truck, DollarSign, AlertCircle, Bookmark } from 'lucide-react';
import { Order, OrderTemplate, Vendor } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (order: Partial<Order>) => void;
  initialData?: Partial<Order>;
  templates: OrderTemplate[];
  onSaveTemplate: (template: OrderTemplate) => void;
  vendors: Vendor[];
  pastOrders?: Order[];
}

export default function OrderForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  templates, 
  onSaveTemplate,
  vendors,
  pastOrders = []
}: OrderFormProps) {
  // ... existing state ...
  const [formData, setFormData] = useState<Partial<Order>>({
    pedido: '',
    numMaterial: '',
    material: '',
    proveedor: '',
    cantPed: 1,
    moneda: 'USD',
    transp: 'maritimo',
    estado: 'Pendiente',
    prioridad: 'Media',
    valorNeto: '0.00',
    pend: 1,
    landedCostUnit: 0,
    reconciled: false,
    ...initialData
  });

  const [showTemplates, setShowTemplates] = useState(false);
  const [materialSuggestions, setMaterialSuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.pedido?.trim()) newErrors.pedido = 'El número de pedido es obligatorio';
    if (!formData.material?.trim()) newErrors.material = 'La descripción del material es obligatoria';
    if (!formData.proveedor?.trim()) newErrors.proveedor = 'El proveedor es obligatorio';
    
    if (formData.cantPed === undefined || formData.cantPed <= 0) {
      newErrors.cantPed = 'La cantidad debe ser mayor a 0';
    }

    if (formData.pend !== undefined && formData.cantPed !== undefined) {
      if (formData.pend < 0) newErrors.pend = 'La cantidad pendiente no puede ser negativa';
      if (formData.pend > formData.cantPed) {
        newErrors.pend = 'La cantidad pendiente no puede ser mayor a la cantidad pedida';
      }
    }

    // Validate dates if present
    const dateFields: (keyof Order)[] = ['etd', 'eta', 'fechaFactura'];
    dateFields.forEach(field => {
      const value = formData[field];
      if (value && typeof value === 'string' && value.trim() !== '') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          newErrors[field] = 'Formato de fecha inválido';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  useEffect(() => {
    if (formData.material && formData.material.length > 2) {
      const suggestions = Array.from(new Set(
        pastOrders
          .filter(o => o.material.toLowerCase().includes(formData.material!.toLowerCase()))
          .map(o => o.material)
      )).slice(0, 5);
      setMaterialSuggestions(suggestions);
    } else {
      setMaterialSuggestions([]);
    }
  }, [formData.material, pastOrders]);

  const selectMaterial = (material: string) => {
    const pastOrder = pastOrders.find(o => o.material === material);
    if (pastOrder) {
      setFormData(prev => ({
        ...prev,
        material: pastOrder.material,
        numMaterial: pastOrder.numMaterial,
        proveedor: pastOrder.proveedor,
        moneda: pastOrder.moneda,
        transp: pastOrder.transp
      }));
    } else {
      setFormData(prev => ({ ...prev, material }));
    }
    setMaterialSuggestions([]);
  };

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleVendorChange = (vendorName: string) => {
    const vendor = vendors.find(v => v.name === vendorName);
    if (vendor) {
      setFormData(prev => ({
        ...prev,
        proveedor: vendorName,
        moneda: vendor.defaultCurrency,
        transp: vendor.defaultTransport
      }));
    } else {
      setFormData(prev => ({ ...prev, proveedor: vendorName }));
    }
  };

  const applyTemplate = (template: OrderTemplate) => {
    setFormData(prev => ({
      ...prev,
      material: template.material,
      numMaterial: template.numMaterial,
      proveedor: template.proveedor,
      cantPed: template.cantPed,
      moneda: template.moneda,
      transp: template.transp,
      prioridad: template.prioridad || 'Media'
    }));
    setShowTemplates(false);
  };

  const saveAsTemplate = () => {
    const name = prompt('Nombre de la plantilla:');
    if (name) {
      onSaveTemplate({
        id: `tpl-${Date.now()}`,
        name,
        material: formData.material || '',
        numMaterial: formData.numMaterial || '',
        proveedor: formData.proveedor || '',
        cantPed: formData.cantPed || 1,
        moneda: formData.moneda || 'USD',
        transp: formData.transp || 'maritimo',
        prioridad: formData.prioridad
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-lufussa-teal/10 rounded-xl text-lufussa-teal">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {initialData?.id ? 'Editar Pedido' : 'Nuevo Pedido'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Complete la información del pedido</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className="p-2 text-slate-400 hover:text-lufussa-teal hover:bg-lufussa-teal/5 rounded-xl transition-all relative"
              title="Plantillas"
            >
              <Bookmark size={20} />
              {templates.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-lufussa-teal rounded-full border-2 border-white"></span>
              )}
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {showTemplates ? (
              <motion.div 
                key="templates"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Plantillas Guardadas</h3>
                  <button 
                    onClick={() => setShowTemplates(false)}
                    className="text-[10px] font-bold text-lufussa-teal hover:underline"
                  >
                    VOLVER AL FORMULARIO
                  </button>
                </div>
                {templates.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                    <Bookmark size={32} className="mx-auto mb-2 text-slate-200" />
                    <p className="text-xs text-slate-400">No hay plantillas guardadas aún</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(tpl => (
                      <button
                        key={tpl.id}
                        onClick={() => applyTemplate(tpl)}
                        className="p-4 text-left border border-slate-100 rounded-2xl hover:border-lufussa-teal/30 hover:bg-lufussa-teal/5 transition-all group"
                      >
                        <p className="text-sm font-bold text-slate-800 mb-1 group-hover:text-lufussa-teal">{tpl.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold truncate">{tpl.material}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase">{tpl.proveedor}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase">{tpl.transp}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">N.° Pedido</label>
                    <input 
                      type="text"
                      value={formData.pedido}
                      onChange={e => {
                        setFormData({ ...formData, pedido: e.target.value });
                        if (errors.pedido) setErrors(prev => {
                          const { pedido, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className={cn(
                        "w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 transition-all",
                        errors.pedido 
                          ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
                          : "border-slate-100 focus:ring-lufussa-teal/20 focus:border-lufussa-teal"
                      )}
                      placeholder="Ej: 4500123456"
                    />
                    {errors.pedido && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.pedido}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Proveedor</label>
                    <select 
                      value={formData.proveedor}
                      onChange={e => {
                        handleVendorChange(e.target.value);
                        if (errors.proveedor) setErrors(prev => {
                          const { proveedor, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className={cn(
                        "w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 transition-all",
                        errors.proveedor 
                          ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
                          : "border-slate-100 focus:ring-lufussa-teal/20 focus:border-lufussa-teal"
                      )}
                    >
                      <option value="">Seleccionar Proveedor</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.name}>{v.name}</option>
                      ))}
                      <option value="OTRO">Otro...</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-2 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Material / Descripción</label>
                    <input 
                      type="text"
                      value={formData.material}
                      onChange={e => {
                        setFormData({ ...formData, material: e.target.value });
                        if (errors.material) setErrors(prev => {
                          const { material, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className={cn(
                        "w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 transition-all",
                        errors.material 
                          ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
                          : "border-slate-100 focus:ring-lufussa-teal/20 focus:border-lufussa-teal"
                      )}
                      placeholder="Descripción del material"
                    />
                    {errors.material && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.material}</p>}
                    <AnimatePresence>
                      {materialSuggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden"
                        >
                          {materialSuggestions.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => selectMaterial(s)}
                              className="w-full px-4 py-2 text-left text-xs font-medium text-slate-600 hover:bg-lufussa-teal/5 hover:text-lufussa-teal transition-colors border-b border-slate-50 last:border-0"
                            >
                              {s}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">N.° Material</label>
                    <input 
                      type="text"
                      value={formData.numMaterial}
                      onChange={e => setFormData({ ...formData, numMaterial: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-lufussa-teal/20 focus:border-lufussa-teal transition-all"
                      placeholder="Código"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cantidad</label>
                    <input 
                      type="number"
                      value={formData.cantPed}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setFormData({ ...formData, cantPed: val, pend: val });
                        if (errors.cantPed || errors.pend) setErrors(prev => {
                          const { cantPed, pend, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className={cn(
                        "w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 transition-all",
                        errors.cantPed 
                          ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
                          : "border-slate-100 focus:ring-lufussa-teal/20 focus:border-lufussa-teal"
                      )}
                    />
                    {errors.cantPed && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.cantPed}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Moneda</label>
                    <select 
                      value={formData.moneda}
                      onChange={e => setFormData({ ...formData, moneda: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-lufussa-teal/20 focus:border-lufussa-teal transition-all"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="HNL">HNL (L)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Transporte</label>
                    <select 
                      value={formData.transp}
                      onChange={e => setFormData({ ...formData, transp: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-lufussa-teal/20 focus:border-lufussa-teal transition-all"
                    >
                      <option value="maritimo">Marítimo</option>
                      <option value="aereo">Aéreo</option>
                      <option value="terrestre">Terrestre</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Prioridad</label>
                    <select 
                      value={formData.prioridad}
                      onChange={e => setFormData({ ...formData, prioridad: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-lufussa-teal/20 focus:border-lufussa-teal transition-all"
                    >
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logistics Section */}
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Módulo Logístico</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Costo Landed Unitario (Estimado)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.landedCostUnit || ''}
                    onChange={(e) => setFormData({ ...formData, landedCostUnit: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-lufussa-teal/20 transition-all"
                    placeholder="0.00"
                  />
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Estado de Reconciliación</label>
                <div className="flex items-center gap-3 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <input 
                    type="checkbox" 
                    checked={formData.reconciled || false}
                    onChange={(e) => setFormData({ ...formData, reconciled: e.target.checked })}
                    className="w-4 h-4 text-lufussa-teal rounded focus:ring-lufussa-teal"
                  />
                  <span className="text-sm text-slate-600">Reconciliado con Factura</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          <button 
            onClick={saveAsTemplate}
            disabled={showTemplates}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:text-lufussa-teal transition-all disabled:opacity-30"
          >
            <Bookmark size={16} />
            GUARDAR COMO PLANTILLA
          </button>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-2.5 bg-lufussa-teal text-white rounded-xl hover:bg-opacity-90 transition-all text-xs font-bold shadow-lg shadow-lufussa-teal/20 uppercase tracking-widest"
            >
              <Save size={16} />
              {initialData?.id ? 'Guardar Cambios' : 'Crear Pedido'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

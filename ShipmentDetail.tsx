import React, { useState } from 'react';
import { ArrowLeft, Calendar, Ship, Plane, Clock, MapPin, FileText, Package, Truck, Info, CheckCircle2, RotateCcw, Download, DollarSign } from 'lucide-react';
import { Shipment, Order, SystemSettings, ShipmentDocument, ChangeLog } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import OrdersTable from './OrdersTable';
import DocumentManager from './DocumentManager';
import TimelineView from './TimelineView';

interface ShipmentDetailProps {
  shipment: Shipment;
  orders: Order[];
  onBack: () => void;
  onUpdateShipment: (shipment: Shipment) => void;
  systemSettings: SystemSettings;
  isMobile?: boolean;
}

type TabType = 'detalles' | 'pedidos' | 'logistica' | 'contenedor' | 'transporte' | 'documentos' | 'facturas' | 'historial';

export default function ShipmentDetail({ 
  shipment, 
  orders, 
  onBack, 
  onUpdateShipment, 
  systemSettings,
  isMobile
}: ShipmentDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('detalles');

  const handleUploadDoc = async (file: File, type: ShipmentDocument['type']) => {
    try {
      // Subir archivo al servidor
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Error al subir el archivo');
      }

      // Crear documento con la URL del servidor
      const newDoc: ShipmentDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type,
        uploadDate: new Date().toLocaleDateString('es-ES'),
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        url: data.file.url, // URL del servidor
        status: 'received'
      };

      const log: ChangeLog = {
        id: `log-${Date.now()}`,
        entityId: shipment.id,
        entityType: 'shipment',
        action: 'doc_upload',
        description: `Se subió el documento: ${file.name} (${type})`,
        userId: 'user-1', // Mock user
        userName: 'Admin Usuario',
        timestamp: new Date().toISOString(),
        newValue: file.name
      };

      const updatedShipment = {
        ...shipment,
        docs: [...(shipment.docs || []), newDoc],
        history: [log, ...(shipment.history || [])]
      };

      onUpdateShipment(updatedShipment);
    } catch (error) {
      console.error('Error al subir documento:', error);
      alert('Error al subir el documento. Por favor, intenta nuevamente.');
    }
  };

  const handleDeleteDoc = (docId: string) => {
    const docToDelete = shipment.docs?.find(d => d.id === docId);
    
    const log: ChangeLog = {
      id: `log-${Date.now()}`,
      entityId: shipment.id,
      entityType: 'shipment',
      action: 'doc_delete',
      description: `Se eliminó el documento: ${docToDelete?.name || docId}`,
      userId: 'user-1',
      userName: 'Admin Usuario',
      timestamp: new Date().toISOString(),
      oldValue: docToDelete?.name
    };

    const updatedShipment = {
      ...shipment,
      docs: (shipment.docs || []).filter(d => d.id !== docId),
      history: [log, ...(shipment.history || [])]
    };
    onUpdateShipment(updatedShipment);
  };

  const handleRevertChange = (log: ChangeLog) => {
    if (log.action !== 'update' || !log.field) return;

    const logRevert: ChangeLog = {
      id: `log-${Date.now()}`,
      entityId: shipment.id,
      entityType: 'shipment',
      action: 'update',
      description: `Reversión de cambio en campo: ${log.field}`,
      field: log.field,
      oldValue: (shipment as any)[log.field],
      newValue: log.oldValue,
      userId: 'user-1',
      userName: 'Admin Usuario',
      timestamp: new Date().toISOString()
    };

    const updatedShipment = {
      ...shipment,
      [log.field]: log.oldValue,
      history: [logRevert, ...(shipment.history || [])]
    };

    onUpdateShipment(updatedShipment);
  };

  // Filter orders related to this shipment
  // Intelligent matching: by invoice number or order numbers in the shipment
  const relatedOrders = orders.filter(o => {
    // 1. Match by invoice number (referenciaRemitente or referencia)
    if (o.factura && shipment.referenciaRemitente && o.factura.trim() === shipment.referenciaRemitente.trim()) {
      return true;
    }
    if (o.factura && shipment.referencia && o.factura.trim() === shipment.referencia.trim()) {
      return true;
    }
    
    // 2. Match by order number in numPedido field
    if (shipment.numPedido && o.pedido) {
      // Split numPedido by common separators (comma, semicolon, pipe, newline, space)
      const pedidoNumbers = shipment.numPedido
        .split(/[,;|\n\s]+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);
      
      // Check if order's pedido is in the list
      if (pedidoNumbers.some(p => p === o.pedido.trim())) {
        return true;
      }
    }
    
    return false;
  });

  const milestones = [
    { 
      date: shipment.eta ? new Date(shipment.eta).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase() : 'POR DETERMINAR', 
      title: `Llegada estimada a ${shipment.puertoDescarga || shipment.destino || 'Destino'}`, 
      time: shipment.eta || '—', 
      completed: false 
    },
    { 
      date: shipment.etd ? new Date(shipment.etd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase() : 'POR DETERMINAR', 
      title: `Salida estimada desde ${shipment.puertoCarga || shipment.origen || 'Origen'}`, 
      time: shipment.etd || '—', 
      completed: true 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {shipment.modo === 'maritimo' ? <Ship className="text-lufussa-teal" size={24} /> : <Plane className="text-lufussa-teal" size={24} />}
            <h2 className="text-xl font-bold text-slate-800">Envío n.° {shipment.referencia}</h2>
          </div>
          <div className="flex flex-wrap gap-4 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>Fecha estimada de recogida -</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>Fecha límite de entrega (ETD) {shipment.etd || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>Fecha límite de entrega (ETA) {shipment.eta || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck size={14} />
              <span>Entrega estimada -</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-lufussa-teal text-white rounded-lg hover:bg-opacity-90 transition-all text-sm font-semibold shadow-lg shadow-lufussa-teal/20"
        >
          <ArrowLeft size={18} />
          Volver a Envíos
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Proyecto de ley de la Cámara de Representantes N.°</p>
                <p className="text-sm text-slate-700 font-medium">-</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Origen</p>
                <p className="text-sm text-slate-700 font-bold">{shipment.origen}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Destino</p>
                <p className="text-sm text-slate-700 font-bold">{shipment.destino}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Número de pedido</p>
                <p className="text-sm text-lufussa-teal font-bold underline cursor-pointer break-all">
                  {shipment.numPedido || '—'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Referencia del remitente</p>
                <p className="text-sm text-slate-700 font-bold">{shipment.referenciaRemitente || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Etd</p>
                <p className="text-sm text-slate-700 font-bold">{shipment.etd || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hora estimada</p>
                <p className="text-sm text-slate-700 font-bold">{shipment.eta || '—'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Referencia de envío</p>
                <p className="text-sm text-slate-700 font-medium">-</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Atd</p>
                <p className="text-sm text-slate-700 font-medium">-</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ata</p>
                <p className="text-sm text-slate-700 font-medium">-</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Referencia de pedido</p>
                <p className="text-sm text-slate-700 font-medium">-</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 flex flex-wrap gap-6">
            {[
              { id: 'detalles', label: 'Detalles' },
              { id: 'pedidos', label: 'Pedidos' },
              { id: 'logistica', label: 'Logística & Aduana' },
              { id: 'contenedor', label: 'Detalles del contenedor' },
              { id: 'transporte', label: 'Transporte' },
              { id: 'documentos', label: 'Documentos' },
              { id: 'facturas', label: 'Facturas' },
              { id: 'historial', label: 'Historial' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "pb-3 text-xs font-bold uppercase tracking-wider transition-all relative",
                  activeTab === tab.id ? "text-lufussa-teal" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-lufussa-teal" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8">
            {activeTab === 'detalles' && (
              <>
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Información de mercancías</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Peso</p>
                      <p className="text-sm text-slate-700 font-medium">{shipment.peso || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Volumen</p>
                      <p className="text-sm text-slate-700 font-medium">{shipment.volumen || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cantidad</p>
                      <p className="text-sm text-slate-700 font-bold">{shipment.cantidad || '1'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Incoterms</p>
                      <p className="text-sm text-slate-700 font-medium">{shipment.incoterms || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tipo de lanzamiento</p>
                      <p className="text-sm text-slate-700 font-medium">{shipment.tipoLanzamiento || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">A bordo</p>
                      <p className="text-sm text-slate-700 font-medium">{shipment.aBordo || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Descripción de la mercancía</p>
                    <p className="text-sm text-slate-700 font-medium">{shipment.descripcionMercancia || '-'}</p>
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-dashed border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Información de detalles del envío</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expedidor</p>
                      <p className="text-sm text-slate-700 font-bold">{shipment.expedidor}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recogida desde</p>
                      <p className="text-sm text-slate-700 font-medium">{shipment.recogidaDesde || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha estimada de recogida</p>
                      <p className="text-sm text-slate-700 font-medium">-</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Consignatario</p>
                      <p className="text-sm text-slate-700 font-bold">{shipment.consignatario}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entregar a</p>
                      <p className="text-sm text-slate-700 font-medium">{shipment.entregarA || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entrega estimada</p>
                      <p className="text-sm text-slate-700 font-medium">-</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha real de recogida</p>
                      <p className="text-sm text-slate-700 font-medium">-</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mercancías entregadas</p>
                      <p className="text-sm text-slate-700 font-medium">-</p>
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeTab === 'pedidos' && (
              <div className="-mx-8 -my-8">
                {relatedOrders.length > 0 ? (
                  <OrdersTable 
                    orders={relatedOrders} 
                    systemSettings={systemSettings}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                    <Package size={64} className="text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">No hay pedidos asociados</h3>
                    <p className="text-sm text-slate-500 max-w-md">
                      No se encontraron pedidos relacionados con este envío. 
                      Verifica que el número de factura o los números de pedido estén correctamente asignados.
                    </p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'documentos' && (
              <DocumentManager 
                documents={shipment.docs || []}
                onUpload={handleUploadDoc}
                onDelete={handleDeleteDoc}
              />
            )}
            {activeTab === 'facturas' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Facturas del Embarque</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-lufussa-teal/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg text-lufussa-teal shadow-sm">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">Factura {shipment.referenciaRemitente || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Referencia: {shipment.referencia}</p>
                      </div>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-lufussa-teal">
                      <Download size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 italic">Esta factura contiene los ítems relacionados con este embarque.</p>
              </div>
            )}
            {activeTab === 'historial' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Registro de Auditoría</h3>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {shipment.history?.length || 0} Eventos Registrados
                  </div>
                </div>
                <TimelineView 
                  history={shipment.history || []} 
                  onRevert={handleRevertChange}
                />
              </div>
            )}
            {activeTab === 'logistica' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Ship size={14} />
                      Información de Aduana
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Estado Aduanal</p>
                        <p className="text-sm font-bold text-slate-700">{shipment.customsStatus || 'Pendiente'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Agente Aduanal</p>
                        <p className="text-sm font-bold text-slate-700">{shipment.customsAgent || 'No asignado'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Número de Contenedor</p>
                        <p className="text-sm font-bold text-slate-700">{shipment.containerNum || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Reconciliado</p>
                        <p className="text-sm font-bold text-slate-700">{shipment.reconciled ? 'SÍ' : 'NO'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <DollarSign size={14} />
                      Análisis de Costos (Landed Cost)
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-xs text-slate-500">Flete Internacional</span>
                        <span className="text-sm font-bold text-slate-700">${(shipment.freightCost || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-xs text-slate-500">Seguros</span>
                        <span className="text-sm font-bold text-slate-700">${(shipment.insuranceCost || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="text-xs text-slate-500">Aranceles (Duties)</span>
                        <span className="text-sm font-bold text-slate-700">${(shipment.dutyAmount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-xs font-bold text-slate-700">COSTO TOTAL LANDED</span>
                        <span className="text-lg font-black text-lufussa-teal">${(shipment.landedCost || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab !== 'detalles' && activeTab !== 'pedidos' && activeTab !== 'logistica' && activeTab !== 'documentos' && activeTab !== 'facturas' && activeTab !== 'historial' && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FileText size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">No hay información disponible en esta sección.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Milestones */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-slate-800 text-white rounded-lg">
                <Clock size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Hitos</h3>
            </div>

            <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {milestones.map((milestone, i) => (
                <div key={i} className="relative pl-8">
                  <div className={cn(
                    "absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10",
                    milestone.completed ? "bg-amber-500" : "bg-amber-500"
                  )}>
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{milestone.date}</p>
                    <p className="text-sm font-bold text-slate-700 leading-tight">{milestone.title}</p>
                    <p className="text-xs text-slate-500">{milestone.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Actions (Right side icons in image) */}
          <div className="flex flex-col gap-2 items-end">
             <button className="p-3 bg-white border border-slate-200 rounded-full shadow-sm text-slate-400 hover:text-lufussa-teal transition-all">
               <RotateCcw size={20} />
             </button>
             <button className="p-3 bg-white border border-slate-200 rounded-full shadow-sm text-slate-400 hover:text-lufussa-teal transition-all">
               <Package size={20} />
             </button>
             <button className="p-3 bg-white border border-slate-200 rounded-full shadow-sm text-slate-400 hover:text-lufussa-teal transition-all">
               <Info size={20} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

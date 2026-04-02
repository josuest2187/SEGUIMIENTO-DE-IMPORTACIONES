import React, { useState } from 'react';
import { Ship, Plane, Truck, MoreVertical, Download, Columns, ChevronDown, ChevronRight, FilePlus, CheckCircle2, FileSpreadsheet, FileText, Trash2, Edit3, X, Copy, RotateCcw, FileEdit } from 'lucide-react';
import { Order, SystemSettings, ChangeLog } from '../types';
import { cn } from '../lib/utils';
import { exportToExcel, exportToPDF } from '../services/exportService';
import TimelineView from './TimelineView';

interface OrdersTableProps {
  orders: Order[];
  onAddInvoice?: (order: Order) => void;
  onBulkAddInvoice?: (orders: Order[]) => void;
  onDeleteInvoice?: (order: Order) => void;
  onBulkDeleteInvoices?: (orderIds: string[]) => void;
  onUpdateStatus?: (orderId: string, newStatus: string) => void;
  onBulkUpdateStatus?: (orderIds: string[], newStatus: string) => void;
  onBulkDelete?: (orderIds: string[]) => void;
  onDuplicate?: (order: Order) => void;
  onEdit?: (order: Order) => void;
  onEditInvoice?: (order: Order, invoiceNumber?: string) => void;
  shipments?: any[];
  systemSettings: SystemSettings;
  isMobile?: boolean;
  userRole?: 'admin' | 'user';
}

export default function OrdersTable({ 
  orders, 
  onAddInvoice, 
  onBulkAddInvoice,
  onDeleteInvoice,
  onBulkDeleteInvoices,
  onUpdateStatus, 
  onBulkUpdateStatus,
  onBulkDelete,
  onDuplicate,
  onEdit,
  onEditInvoice,
  shipments = [],
  systemSettings,
  isMobile,
  userRole = 'user'
}: OrdersTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [invoiceSelectorOrder, setInvoiceSelectorOrder] = useState<Order | null>(null);
  const [availableInvoices, setAvailableInvoices] = useState<string[]>([]);
  const selectedInvoicedIds = Array.from(selectedIds).filter(id => {
    const order = orders.find(o => o.id === id);
    return Boolean(order?.factura?.trim());
  });

  const pageSize = systemSettings.ordersPageSize || 100;
  const totalPages = Math.ceil(orders.length / pageSize);
  
  // Reset to page 1 when orders change (filtering)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [orders]);

  const currentOrders = orders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Sync selectedIds with current orders
  React.useEffect(() => {
    const currentOrderIds = new Set(orders.map(o => o.id));
    const newSelected = new Set<string>();
    selectedIds.forEach(id => {
      if (currentOrderIds.has(id)) {
        newSelected.add(id);
      }
    });
    if (newSelected.size !== selectedIds.size) {
      setSelectedIds(newSelected);
    }
  }, [orders]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(orders.map(o => o.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExportExcel = (dataToExport?: Order[]) => {
    const targetData = dataToExport || orders;
    const data = targetData.map(o => ({
      'Pedido': o.pedido,
      'Material': o.material,
      'Proveedor': o.proveedor,
      'Cant. Ped': o.cantPed,
      'Valor Neto': o.valorNeto,
      'Estado': o.estado,
      'Factura': o.factura,
      'Pendiente': o.pend
    }));
    exportToExcel(data, `Pedidos_${new Date().getTime()}`);
    setShowExportMenu(false);
  };

  const handleExportPDF = (dataToExport?: Order[]) => {
    const targetData = dataToExport || orders;
    const columns = [
      { header: 'Pedido', dataKey: 'pedido' },
      { header: 'Material', dataKey: 'material' },
      { header: 'Proveedor', dataKey: 'proveedor' },
      { header: 'Cant. Ped', dataKey: 'cantPed' },
      { header: 'Valor Neto', dataKey: 'valorNeto' },
      { header: 'Estado', dataKey: 'estado' },
      { header: 'Pend', dataKey: 'pend' }
    ];
    exportToPDF(targetData, columns, 'Reporte de Pedidos', systemSettings);
    setShowExportMenu(false);
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  };

  const handleEditInvoices = (order: Order) => {
    // Buscar facturas asociadas a este pedido
    const orderInvoices = shipments
      .filter(s => s.numPedido && s.numPedido.includes(order.pedido))
      .map(s => s.referenciaRemitente || s.referencia)
      .filter(Boolean);

    if (orderInvoices.length === 0) {
      alert('No hay facturas registradas para este pedido');
      return;
    }

    if (orderInvoices.length === 1) {
      // Solo una factura, abrir directamente
      onEditInvoice?.(order, orderInvoices[0]);
      setActiveMenu(null);
    } else {
      // Múltiples facturas, mostrar selector
      setInvoiceSelectorOrder(order);
      setAvailableInvoices(orderInvoices);
      setActiveMenu(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-4 flex-1">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Lista de Pedidos</h3>
        </div>

        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2 text-slate-400 hover:text-lufussa-teal hover:bg-white rounded-lg transition-all flex items-center gap-2"
          >
            <Download size={20} />
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Exportar</span>
          </button>

          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-30 overflow-hidden">
                <button 
                  onClick={() => handleExportExcel()}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <FileSpreadsheet size={16} className="text-emerald-500" />
                  Exportar a Excel
                </button>
                <button 
                  onClick={() => handleExportPDF()}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors border-t border-slate-50"
                >
                  <FileText size={16} className="text-red-500" />
                  Exportar a PDF
                </button>
              </div>
            </>
          )}

          <button 
            onClick={() => window.location.reload()}
            className="p-2 text-slate-400 hover:text-lufussa-teal hover:bg-white rounded-lg transition-all"
            title="Actualizar"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto relative">
        {/* Bulk Actions Toolbar */}
        {selectedIds.size > 0 && userRole === 'admin' && (
          <div
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-white/10 backdrop-blur-xl",
              isMobile ? "w-[95%] min-w-[300px]" : "sm:px-6 sm:py-4 sm:rounded-3xl sm:w-auto min-w-[300px]"
            )}
          >
              <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                <div className="bg-lufussa-teal text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {selectedIds.size}
                </div>
                {!isMobile && <span className="text-xs font-bold uppercase tracking-wider">Seleccionados</span>}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const selectedOrders = orders.filter(o => selectedIds.has(o.id));
                    onBulkAddInvoice?.(selectedOrders);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                  title="Asignar Factura"
                >
                  <FilePlus size={16} className="text-lufussa-teal" />
                  {!isMobile && <span className="hidden sm:inline">Factura</span>}
                </button>

                <button 
                  onClick={() => {
                    if (selectedInvoicedIds.length === 0) return;
                    if (confirm(`¿Está seguro de borrar la factura de ${selectedInvoicedIds.length} pedido(s) seleccionado(s)?`)) {
                      onBulkDeleteInvoices?.(selectedInvoicedIds);
                      setSelectedIds(new Set());
                    }
                  }}
                  disabled={selectedInvoicedIds.length === 0}
                  className="p-2 hover:bg-amber-500/20 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Borrar Factura"
                >
                  <FileText size={16} />
                  {!isMobile && <span className="hidden sm:inline">Borrar Factura</span>}
                </button>

                <button 
                  onClick={() => onBulkUpdateStatus?.(Array.from(selectedIds), 'En Planta')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                  title="Marcar En Planta"
                >
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  {!isMobile && <span className="hidden sm:inline">En Planta</span>}
                </button>

                <button 
                  onClick={() => {
                    if (confirm(`¿Está seguro de eliminar ${selectedIds.size} pedidos?`)) {
                      onBulkDelete?.(Array.from(selectedIds));
                      setSelectedIds(new Set());
                    }
                  }}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400"
                  title="Eliminar Selección"
                >
                  <Trash2 size={16} />
                  {!isMobile && <span className="hidden sm:inline">Eliminar</span>}
                </button>
              </div>

              <button 
                onClick={() => setSelectedIds(new Set())}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
          </div>
        )}

        {isMobile ? (
          <div className="divide-y divide-slate-100">
            {currentOrders.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400">
                No hay pedidos disponibles.
              </div>
            ) : (
              currentOrders.map((order, index) => (
                <div key={order.id} className="relative overflow-hidden bg-slate-100">
                  {/* Swipe Actions Background */}
                  {userRole === 'admin' && (
                    <div className="absolute inset-0 flex items-center justify-end px-6 gap-4">
                      <button 
                        onClick={() => onEdit?.(order)}
                        className="p-3 bg-slate-200 text-slate-600 rounded-full shadow-lg"
                      >
                        <Edit3 size={20} />
                      </button>
                      <button 
                        onClick={() => onAddInvoice?.(order)}
                        className="p-3 bg-lufussa-teal text-white rounded-full shadow-lg"
                      >
                        <FilePlus size={20} />
                      </button>
                    </div>
                  )}

                  <div
                    className={cn(
                      "relative z-10 p-4 bg-white border-b border-slate-100 transition-colors",
                      expandedRows.has(order.id) && "bg-slate-50"
                    )}
                    onClick={() => toggleRow(order.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        {userRole === 'admin' && (
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-lufussa-teal focus:ring-lufussa-teal"
                            checked={selectedIds.has(order.id)}
                            onChange={(e) => { e.stopPropagation(); handleSelectItem(order.id); }}
                          />
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-800">{order.pedido}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[150px]">{order.material}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                          order.estado === 'En Planta' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                        )}>
                          {order.estado}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Cant. Ped</p>
                          <p className="text-xs text-slate-700 font-bold">{order.cantPed.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Pendiente</p>
                          <p className="text-xs text-amber-600 font-bold">{order.pend}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">{order.moneda} {order.valorNeto}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{order.proveedor}</p>
                      </div>
                    </div>

                    {/* Mobile Expanded Detail */}
                    <div
                      className={cn(
                        "mt-4 pt-4 border-t border-slate-200 space-y-4",
                        !expandedRows.has(order.id) && "hidden"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ETD</p>
                          <p className="text-xs text-slate-700 font-medium">{order.etd || '—'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ETA</p>
                          <p className="text-xs text-slate-700 font-medium">{order.eta || '—'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Factura</p>
                          <p className="text-xs text-lufussa-teal font-bold">{order.factura || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Prioridad</p>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold",
                            order.prioridad === 'Alta' ? "bg-red-50 text-red-600" : 
                            order.prioridad === 'Media' ? "bg-amber-50 text-amber-600" :
                            order.prioridad === 'Baja' ? "bg-emerald-50 text-emerald-600" :
                            "bg-slate-100 text-slate-400"
                          )}>
                            {order.prioridad || '-'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onAddInvoice?.(order)}
                          className="flex-1 py-2 bg-lufussa-teal/10 text-lufussa-teal rounded-lg text-[10px] font-bold uppercase"
                        >
                          Facturar
                        </button>
                        <button 
                          onClick={() => onEdit?.(order)}
                          className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-[10px] uppercase tracking-wider">
                {userRole === 'admin' && (
                  <th className="px-4 py-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-lufussa-teal focus:ring-lufussa-teal"
                      checked={selectedIds.size === orders.length && orders.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                <th className="px-2 py-4 w-10">#</th>
                <th className="px-4 py-4">Pedido</th>
                <th className="px-4 py-4">Num. de Material</th>
                <th className="px-4 py-4">Material</th>
                <th className="px-4 py-4">Proveedor</th>
                <th className="px-4 py-4 text-center">Cant. Ped</th>
                <th className="px-4 py-4 text-right">Valor Neto</th>
                <th className="px-4 py-4 text-center">Estado</th>
                <th className="px-4 py-4 text-center">Factura</th>
                <th className="px-4 py-4 text-center">Pend</th>
                <th className="px-4 py-4 text-center">Transp.</th>
                {userRole === 'admin' && (
                  <th className="px-4 py-4 w-10 text-center">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentOrders.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-12 text-center text-slate-400">
                    No hay pedidos disponibles.
                  </td>
                </tr>
              ) : (
                currentOrders.map((order, index) => (
                  <React.Fragment key={order.id}>
                    <tr 
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors group cursor-pointer",
                        expandedRows.has(order.id) && "bg-slate-50/50"
                      )}
                      onClick={() => toggleRow(order.id)}
                    >
                      {userRole === 'admin' && (
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-lufussa-teal focus:ring-lufussa-teal"
                            checked={selectedIds.has(order.id)}
                            onChange={() => handleSelectItem(order.id)}
                          />
                        </td>
                      )}
                      <td className="px-2 py-4 text-slate-400 text-xs">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="px-4 py-4 font-bold text-slate-800 text-sm">
                        <div className="flex items-center gap-2">
                          <ChevronRight
                            size={14}
                            className={cn(
                              "transition-transform text-slate-400",
                              expandedRows.has(order.id) && "rotate-90 text-lufussa-teal"
                            )}
                          />
                          {order.pedido}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-sm">{order.numMaterial || '—'}</td>
                      <td className="px-4 py-4 text-slate-500 text-sm italic">{order.material}</td>
                      <td className="px-4 py-4 text-slate-500 text-sm truncate max-w-[150px]">{order.proveedor}</td>
                      <td className="px-4 py-4 text-center text-slate-600 text-sm font-medium">{order.cantPed.toFixed(1)}</td>
                      <td className="px-4 py-4 text-right text-slate-800 text-sm font-bold">{order.valorNeto}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold",
                          order.estado === 'En Planta' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                        )}>
                          {order.estado}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="px-2 py-1 bg-lufussa-teal/5 text-lufussa-teal rounded text-[10px] font-bold border border-lufussa-teal/10">
                          {order.factura}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold">
                          {order.pend}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center">
                          {order.transp === 'maritimo' ? (
                            <Ship size={16} className="text-indigo-400" title="Marítimo" />
                          ) : order.transp === 'terrestre' ? (
                            <Truck size={16} className="text-emerald-500" title="Terrestre" />
                          ) : order.transp === 'aereo' ? (
                            <Plane size={16} className="text-sky-500" title="Aéreo" />
                          ) : (
                            <span className="text-slate-400 font-bold" title="Sin especificar">-</span>
                          )}
                        </div>
                      </td>
                      {userRole === 'admin' && (
                        <td className="px-4 py-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setActiveMenu(activeMenu === order.id ? null : order.id)}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-300 hover:text-slate-600"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenu === order.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActiveMenu(null)} 
                            />
                            <div className="absolute right-full top-0 mr-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden">
                                <button 
                                  onClick={() => {
                                    onAddInvoice?.(order);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                  <FilePlus size={16} className="text-lufussa-teal" />
                                  Agregar Factura
                                </button>

                                <button 
                                  onClick={() => handleEditInvoices(order)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors border-t border-slate-50"
                                >
                                  <FileEdit size={16} className="text-amber-500" />
                                  Editar Factura
                                </button>

                                {order.factura && (
                                  <button 
                                    onClick={() => {
                                      if (confirm(`¿Está seguro de borrar la factura ${order.factura} de este pedido?`)) {
                                        onDeleteInvoice?.(order);
                                      }
                                      setActiveMenu(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors border-t border-slate-50"
                                  >
                                    <Trash2 size={16} />
                                    Borrar Factura
                                  </button>
                                )}

                                <button 
                                  onClick={() => {
                                    onDuplicate?.(order);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors border-t border-slate-50"
                                >
                                  <Copy size={16} className="text-slate-400" />
                                  Duplicar Pedido
                                </button>

                                <button 
                                  onClick={() => {
                                    onEdit?.(order);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors border-t border-slate-50"
                                >
                                  <Edit3 size={16} className="text-slate-400" />
                                  Editar Pedido
                                </button>

                                {order.cantidadFacturada === order.cantPed && order.estado !== 'En Planta' && (
                                  <button 
                                    onClick={() => {
                                      onUpdateStatus?.(order.id, 'En Planta');
                                      setActiveMenu(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors border-t border-slate-50"
                                  >
                                    <CheckCircle2 size={16} />
                                    Marcar En Planta
                                  </button>
                                )}
                            </div>
                          </>
                        )}
                        </td>
                      )}
                    </tr>
                    
                    {/* Expanded Detail View */}
                    <tr
                      key={`desktop-expand-${order.id}`}
                      className={cn(!expandedRows.has(order.id) && "hidden")}
                      aria-hidden={!expandedRows.has(order.id)}
                    >
                      <td colSpan={13} className="px-0 py-0 border-none">
                        <div className="bg-slate-50/30">
                              <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-6 gap-x-4 border-t border-slate-100">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modelo</p>
                                  <p className="text-sm text-slate-700 font-medium">{order.modelo || '—'}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ETD (Salida)</p>
                                  <p className="text-sm text-slate-700 font-medium">{order.etd || '—'}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ETA (Llegada)</p>
                                  <p className="text-sm text-slate-700 font-medium">{order.eta || '—'}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha Factura</p>
                                  <p className="text-sm text-slate-700 font-medium">{order.fechaFactura || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Precio Neto Unitario</p>
                                  <p className="text-sm text-slate-700 font-medium">{order.precioNetoUnitario || '—'}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cantidad Facturada</p>
                                  <p className="text-sm text-slate-700 font-medium">{order.cantidadFacturada ?? 0}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioridad</p>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold",
                                    order.prioridad === 'Alta' ? "bg-red-50 text-red-600" : 
                                    order.prioridad === 'Media' ? "bg-amber-50 text-amber-600" :
                                    order.prioridad === 'Baja' ? "bg-emerald-50 text-emerald-600" :
                                    "bg-slate-100 text-slate-400"
                                  )}>
                                    {order.prioridad || '-'}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Documentos</p>
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">
                                    {order.docs && order.docs.length > 0 ? `${order.docs.length} Adjuntos` : 'No'}
                                  </span>
                                </div>
                              </div>

                              {/* Order History */}
                              <div className="px-6 pb-6 border-t border-slate-100 pt-6">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Historial del Pedido</h4>
                                <TimelineView history={order.history || []} />
                              </div>
                            </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="text-xs text-slate-500 font-medium">
            Mostrando <span className="font-bold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> a <span className="font-bold text-slate-700">{Math.min(currentPage * pageSize, orders.length)}</span> de <span className="font-bold text-slate-700">{orders.length}</span> pedidos
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 text-slate-400 hover:text-lufussa-teal disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            >
              <ChevronRight size={18} className="rotate-180" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                      currentPage === pageNum 
                        ? "bg-lufussa-teal text-white shadow-md shadow-lufussa-teal/20" 
                        : "text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-400 hover:text-lufussa-teal disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Selector de Facturas */}
      {invoiceSelectorOrder && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Seleccionar Factura</h3>
                <button
                  onClick={() => {
                    setInvoiceSelectorOrder(null);
                    setAvailableInvoices([]);
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Este pedido tiene múltiples facturas. Selecciona la que deseas editar:
              </p>
            </div>
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {availableInvoices.map((invoice, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onEditInvoice?.(invoiceSelectorOrder, invoice);
                    setInvoiceSelectorOrder(null);
                    setAvailableInvoices([]);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-lufussa-teal/10 border border-slate-200 hover:border-lufussa-teal rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg group-hover:bg-lufussa-teal/20 transition-colors">
                      <FileText size={20} className="text-lufussa-teal" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800 text-sm">{invoice}</p>
                      <p className="text-xs text-slate-500">Factura #{index + 1}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-lufussa-teal transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

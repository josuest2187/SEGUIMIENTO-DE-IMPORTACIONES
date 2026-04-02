import React, { useState } from 'react';
import { Ship, Plane, Star, Download, Columns, FileSpreadsheet, FileText, ChevronRight, RotateCcw } from 'lucide-react';
import { Shipment, SystemSettings } from '../types';
import { exportToExcel, exportToPDF } from '../services/exportService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ShipmentsTableProps {
  shipments: Shipment[];
  onSelectShipment: (shipment: Shipment) => void;
  systemSettings: SystemSettings;
  isMobile?: boolean;
}

export default function ShipmentsTable({ shipments, onSelectShipment, systemSettings, isMobile }: ShipmentsTableProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportExcel = () => {
    const data = shipments.map(s => ({
      'Modo': s.modo,
      'Referencia': s.referencia,
      'Expedidor': s.expedidor,
      'Consignatario': s.consignatario,
      'Origen': s.origen,
      'Destino': s.destino,
      'ETD': s.etd,
      'ETA': s.eta
    }));
    exportToExcel(data, `Envios_${new Date().getTime()}`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const columns = [
      { header: 'Modo', dataKey: 'modo' },
      { header: 'Referencia', dataKey: 'referencia' },
      { header: 'Expedidor', dataKey: 'expedidor' },
      { header: 'Origen', dataKey: 'origen' },
      { header: 'Destino', dataKey: 'destino' },
      { header: 'ETD', dataKey: 'etd' },
      { header: 'ETA', dataKey: 'eta' }
    ];
    exportToPDF(shipments, columns, 'Reporte de Envíos', systemSettings);
    setShowExportMenu(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-4 flex-1">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Lista de Envíos</h3>
        </div>

        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2 text-slate-400 hover:text-lufussa-teal hover:bg-white rounded-lg transition-all flex items-center gap-2"
          >
            <Download size={20} />
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Exportar</span>
          </button>

          <AnimatePresence>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowExportMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-30 overflow-hidden"
                >
                  <button 
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <FileSpreadsheet size={16} className="text-emerald-500" />
                    Exportar a Excel
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors border-t border-slate-50"
                  >
                    <FileText size={16} className="text-red-500" />
                    Exportar a PDF
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

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
      <div className="overflow-x-auto">
        {isMobile ? (
          <div className="divide-y divide-slate-100">
            {shipments.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400">
                No hay envíos disponibles.
              </div>
            ) : (
              shipments.map((shipment) => (
                <div key={shipment.id} className="relative overflow-hidden bg-slate-100">
                  {/* Swipe Actions Background */}
                  <div className="absolute inset-0 flex items-center justify-end px-6 gap-4">
                    <button 
                      onClick={() => onSelectShipment(shipment)}
                      className="p-3 bg-lufussa-teal text-white rounded-full shadow-lg"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  <motion.div 
                    drag="x"
                    dragConstraints={{ left: -100, right: 0 }}
                    dragElastic={0.1}
                    className="relative z-10 p-4 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors"
                    onClick={() => onSelectShipment(shipment)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                          {shipment.modo === 'maritimo' ? <Ship size={18} /> : <Plane size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-lufussa-teal">{shipment.referencia}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{shipment.expedidor}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                          shipment.estado === 'En Tránsito' ? "bg-blue-50 text-blue-600" : 
                          shipment.estado === 'Arribado' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                        )}>
                          {shipment.estado}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Origen</p>
                        <p className="text-xs text-slate-700 font-medium truncate">{shipment.origen}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Destino</p>
                        <p className="text-xs text-slate-700 font-medium truncate">{shipment.destino}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">ETD</p>
                        <p className="text-xs text-slate-700 font-medium">{shipment.etd || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">ETA</p>
                        <p className="text-xs text-slate-700 font-medium">{shipment.eta || '—'}</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Modo</th>
                <th className="px-6 py-4 font-semibold">N° de referencia</th>
                <th className="px-6 py-4 font-semibold">Expedidor</th>
                <th className="px-6 py-4 font-semibold">Consignatario</th>
                <th className="px-6 py-4 font-semibold">Origen</th>
                <th className="px-6 py-4 font-semibold">Destino</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No hay envíos disponibles.
                  </td>
                </tr>
              ) : (
                shipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      {shipment.modo === 'maritimo' ? (
                        <Ship size={20} className="text-slate-600" />
                      ) : (
                        <Plane size={20} className="text-slate-600" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Star size={16} className="text-amber-400 fill-amber-400" />
                        <span 
                          onClick={() => onSelectShipment(shipment)}
                          className="text-lufussa-teal font-medium hover:underline cursor-pointer"
                        >
                          {shipment.referencia}
                        </span>
                        {shipment.docs && shipment.docs.length > 0 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold">
                            <FileText size={10} />
                            {shipment.docs.length}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{shipment.expedidor}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{shipment.consignatario}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{shipment.origen}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{shipment.destino}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Eye, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Plus,
  File,
  Search
} from 'lucide-react';
import { ShipmentDocument } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface DocumentManagerProps {
  documents: ShipmentDocument[];
  onUpload: (file: File, type: ShipmentDocument['type']) => void;
  onDelete: (docId: string) => void;
}

const REQUIRED_DOCS: ShipmentDocument['type'][] = ['Invoice', 'BL', 'Packing List', 'Certificate'];

export default function DocumentManager({ documents, onUpload, onDelete }: DocumentManagerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedType, setSelectedType] = useState<ShipmentDocument['type']>('Other');
  const [previewDoc, setPreviewDoc] = useState<ShipmentDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0], selectedType);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0], selectedType);
    }
  };

  const getDocStatus = (type: ShipmentDocument['type']) => {
    return documents.some(d => d.type === type);
  };

  return (
    <div className="space-y-6">
      {/* Required Documents Checklist */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Estado de Documentación Requerida</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {REQUIRED_DOCS.map(type => {
            const isReceived = getDocStatus(type);
            return (
              <div 
                key={type}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-bold transition-all",
                  isReceived 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                    : "bg-white border-slate-200 text-slate-400"
                )}
              >
                {isReceived ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {type === 'Invoice' ? 'Factura' : type === 'BL' ? 'Bill of Lading' : type === 'Packing List' ? 'Lista Empaque' : 'Certificado'}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Documento</label>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-lufussa-teal/20 outline-none transition-all"
            >
              <option value="Invoice">Factura Comercial</option>
              <option value="BL">Bill of Lading (BL)</option>
              <option value="Packing List">Lista de Empaque</option>
              <option value="Certificate">Certificado de Origen</option>
              <option value="Other">Otro Documento</option>
            </select>
          </div>

          <div 
            className={cn(
              "relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center gap-3 group cursor-pointer",
              dragActive ? "border-lufussa-teal bg-lufussa-teal/5" : "border-slate-200 hover:border-lufussa-teal/50 hover:bg-slate-50"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              onChange={handleFileChange}
            />
            <div className="p-3 bg-white rounded-xl shadow-sm text-lufussa-teal group-hover:scale-110 transition-transform">
              <Upload size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Haz clic o arrastra un archivo</p>
              <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG hasta 10MB</p>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Archivos Recibidos ({documents.length})</h4>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-full text-xs focus:ring-2 focus:ring-lufussa-teal/20 outline-none w-40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence mode="popLayout">
              {documents.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl"
                >
                  <File size={32} className="mb-2 opacity-20" />
                  <p className="text-xs font-medium">No hay documentos adjuntos</p>
                </motion.div>
              ) : (
                documents.map(doc => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={doc.id} 
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-lufussa-teal/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-slate-50 rounded-lg text-lufussa-teal group-hover:bg-lufussa-teal group-hover:text-white transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-700">{doc.name}</p>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase">
                            {doc.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-[10px] text-slate-400 font-medium">{doc.size}</p>
                          <div className="w-1 h-1 bg-slate-200 rounded-full" />
                          <p className="text-[10px] text-slate-400 font-medium">{doc.uploadDate}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setPreviewDoc(doc)}
                        className="p-2 text-slate-400 hover:text-lufussa-teal hover:bg-slate-50 rounded-lg transition-all"
                        title="Vista Previa"
                      >
                        <Eye size={18} />
                      </button>
                      <a 
                        href={doc.url} 
                        download={doc.name}
                        className="p-2 text-slate-400 hover:text-lufussa-teal hover:bg-slate-50 rounded-lg transition-all"
                        title="Descargar"
                      >
                        <Download size={18} />
                      </a>
                      <button 
                        onClick={() => onDelete(doc.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-lufussa-teal/10 text-lufussa-teal rounded-lg">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{previewDoc.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{previewDoc.type} • {previewDoc.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={previewDoc.url} 
                    download={previewDoc.name}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all text-xs font-bold"
                  >
                    <Download size={16} />
                    Descargar
                  </a>
                  <button 
                    onClick={() => setPreviewDoc(null)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-slate-100 overflow-hidden flex flex-col">
                {/* Barra de acciones rápidas para PDFs */}
                {(() => {
                  const fileExt = previewDoc.name.split('.').pop()?.toLowerCase();
                  const isPDF = fileExt === 'pdf';
                  
                  if (isPDF) {
                    return (
                      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-center gap-3">
                        <p className="text-xs text-slate-500">¿No se visualiza correctamente?</p>
                        <a 
                          href={previewDoc.url} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-bold text-xs"
                        >
                          <Eye size={14} />
                          Abrir en Nueva Pestaña
                        </a>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                <div className="flex-1 overflow-hidden flex items-center justify-center">
                  {(() => {
                    const fileExt = previewDoc.name.split('.').pop()?.toLowerCase();
                    const isPDF = fileExt === 'pdf';
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt || '');

                    if (isPDF) {
                      return (
                        <object
                          data={previewDoc.url}
                          type="application/pdf"
                          className="w-full h-full"
                        >
                          <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
                            <FileText size={64} className="text-slate-300" />
                            <div className="text-center space-y-2">
                              <p className="text-lg font-bold text-slate-700">No se pudo cargar el PDF</p>
                              <p className="text-sm text-slate-500">Por favor, descarga el archivo para visualizarlo</p>
                            </div>
                            <a 
                              href={previewDoc.url} 
                              download={previewDoc.name}
                              className="flex items-center gap-2 px-6 py-3 bg-lufussa-teal text-white rounded-xl hover:bg-opacity-90 transition-all font-bold text-sm shadow-lg shadow-lufussa-teal/20"
                            >
                              <Download size={18} />
                              Descargar PDF
                            </a>
                          </div>
                        </object>
                      );
                    } else if (isImage) {
                      return (
                        <div className="w-full h-full overflow-auto p-8 flex items-center justify-center">
                          <img 
                            src={previewDoc.url} 
                            alt={previewDoc.name}
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                          />
                        </div>
                      );
                    } else {
                      // Fallback para otros tipos de archivo
                      return (
                        <div className="bg-white shadow-2xl w-full max-w-3xl p-12 flex flex-col items-center justify-center gap-4 rounded-2xl mx-8">
                          <FileText size={64} className="text-slate-300" />
                          <div className="text-center space-y-2">
                            <p className="text-lg font-bold text-slate-700">Vista previa no disponible</p>
                            <p className="text-sm text-slate-500">Este tipo de archivo no puede ser visualizado en el navegador</p>
                            <p className="text-xs text-slate-400 font-mono bg-slate-100 px-3 py-1 rounded-lg inline-block mt-2">
                              {previewDoc.name}
                            </p>
                          </div>
                          <a 
                            href={previewDoc.url} 
                            download={previewDoc.name}
                            className="mt-4 flex items-center gap-2 px-6 py-3 bg-lufussa-teal text-white rounded-xl hover:bg-opacity-90 transition-all font-bold text-sm shadow-lg shadow-lufussa-teal/20"
                          >
                            <Download size={18} />
                            Descargar archivo para visualizar
                          </a>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React from 'react';
import { 
  Clock, 
  User, 
  ArrowRight, 
  RotateCcw, 
  Plus, 
  Trash2, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  Ship,
  Plane
} from 'lucide-react';
import { ChangeLog } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface TimelineViewProps {
  history: ChangeLog[];
  onRevert?: (log: ChangeLog) => void;
}

const getActionIcon = (action: ChangeLog['action']) => {
  switch (action) {
    case 'create': return <Plus size={14} />;
    case 'update': return <RotateCcw size={14} />;
    case 'delete': return <Trash2 size={14} />;
    case 'status_change': return <CheckCircle2 size={14} />;
    case 'doc_upload': return <FileText size={14} />;
    case 'doc_delete': return <Trash2 size={14} />;
    default: return <AlertCircle size={14} />;
  }
};

const getActionColor = (action: ChangeLog['action']) => {
  switch (action) {
    case 'create': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'update': return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'delete': return 'bg-red-50 text-red-600 border-red-100';
    case 'status_change': return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'doc_upload': return 'bg-purple-50 text-purple-600 border-purple-100';
    case 'doc_delete': return 'bg-red-50 text-red-600 border-red-100';
    default: return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

export default function TimelineView({ history, onRevert }: TimelineViewProps) {
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sortedHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
        <Clock size={32} className="mb-2 opacity-20" />
        <p className="text-xs font-medium">No hay historial de cambios disponible</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
      {sortedHistory.map((log, index) => (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          key={log.id} 
          className="relative flex items-start gap-6 group"
        >
          {/* Icon/Dot */}
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center z-10 shadow-sm transition-transform group-hover:scale-110",
            getActionColor(log.action)
          )}>
            {getActionIcon(log.action)}
          </div>

          {/* Content */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-lufussa-teal/30 transition-all">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">{log.description}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                  getActionColor(log.action)
                )}>
                  {log.action.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(log.timestamp).toLocaleString('es-ES', { 
                    day: '2-digit', 
                    month: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="flex items-center gap-1">
                  <User size={12} />
                  {log.userName}
                </div>
              </div>
            </div>

            {/* Change Details */}
            {(log.oldValue !== undefined || log.newValue !== undefined) && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Anterior</p>
                  <p className="text-xs font-medium text-slate-600 truncate">
                    {log.oldValue === null || log.oldValue === undefined ? '—' : String(log.oldValue)}
                  </p>
                </div>
                <ArrowRight size={14} className="text-slate-300" />
                <div className="flex-1 space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nuevo</p>
                  <p className="text-xs font-bold text-lufussa-teal truncate">
                    {log.newValue === null || log.newValue === undefined ? '—' : String(log.newValue)}
                  </p>
                </div>
              </div>
            )}

            {/* Revert Action */}
            {onRevert && log.action === 'update' && (
              <div className="mt-3 flex justify-end">
                <button 
                  onClick={() => onRevert(log)}
                  className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-lufussa-teal hover:bg-lufussa-teal/5 rounded-lg transition-all border border-transparent hover:border-lufussa-teal/20"
                >
                  <RotateCcw size={12} />
                  REVERTIR CAMBIO
                </button>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

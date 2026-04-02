import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle, DollarSign, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { LogisticsInsight } from '../types';
import { cn } from '../lib/utils';

interface AIInsightsProps {
  insights: LogisticsInsight[];
  isLoading: boolean;
  onGenerate: () => void;
  onAction?: (insight: LogisticsInsight) => void;
}

export default function AIInsights({ insights, isLoading, onGenerate, onAction }: AIInsightsProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-lufussa-teal/10 text-lufussa-teal rounded-lg">
            <Sparkles size={18} />
          </div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Insights de IA Logística</h3>
        </div>
        <button 
          onClick={onGenerate}
          disabled={isLoading}
          className="text-xs font-bold text-lufussa-teal hover:underline disabled:opacity-50 flex items-center gap-1"
        >
          {isLoading ? 'Analizando...' : 'Generar Insights'}
          {!isLoading && <ArrowRight size={14} />}
        </button>
      </div>

      <div className="p-4">
        {insights.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Sparkles size={24} />
            </div>
            <div className="max-w-xs mx-auto">
              <p className="text-sm font-medium text-slate-600">No hay insights generados</p>
              <p className="text-xs text-slate-400 mt-1">Haz clic en "Generar Insights" para que Gemini analice tus datos logísticos actuales.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight, i) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "p-4 rounded-xl border transition-all hover:shadow-md",
                  insight.impact === 'high' ? "bg-red-50/30 border-red-100" :
                  insight.impact === 'medium' ? "bg-amber-50/30 border-amber-100" :
                  "bg-blue-50/30 border-blue-100"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    insight.type === 'optimization' ? "bg-blue-100 text-blue-600" :
                    insight.type === 'risk' ? "bg-red-100 text-red-600" :
                    "bg-emerald-100 text-emerald-600"
                  )}>
                    {insight.type === 'optimization' && <TrendingUp size={14} />}
                    {insight.type === 'risk' && <AlertTriangle size={14} />}
                    {insight.type === 'cost' && <DollarSign size={14} />}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    insight.impact === 'high' ? "text-red-600" :
                    insight.impact === 'medium' ? "text-amber-600" :
                    "text-blue-600"
                  )}>
                    Impacto {insight.impact === 'high' ? 'Alto' : insight.impact === 'medium' ? 'Medio' : 'Bajo'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">{insight.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{insight.content}</p>
                {insight.actionable && (
                  <button 
                    onClick={() => onAction?.(insight)}
                    className="mt-3 text-[10px] font-bold text-lufussa-teal uppercase tracking-wider hover:underline flex items-center gap-1"
                  >
                    Ver Recomendación <ArrowRight size={10} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

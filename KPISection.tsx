import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Ship, 
  Plane, 
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Shipment } from '../types';

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color: string;
}

function KPICard({ label, value, unit, icon, trend, color }: KPICardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-xl", color)}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
            trend.isUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {trend.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend.value}%
          </div>
        )}
      </div>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-3xl font-bold text-slate-800">{value}</span>
        {unit && <span className="text-slate-400 text-sm font-medium">{unit}</span>}
      </div>
    </div>
  );
}

interface KPISectionProps {
  stats: {
    avgTransitTime: number;
    delayedCount: number;
    onTimeRate: number;
    criticalCount: number;
  };
  trendData: any[];
  modeData: any[];
  criticalShipments: Shipment[];
  onSelectShipment: (shipment: Shipment) => void;
  isMobile?: boolean;
}

export default function KPISection({ stats, trendData, modeData, criticalShipments, onSelectShipment, isMobile }: KPISectionProps) {
  const COLORS = ['#1E4B7A', '#2DD4BF', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className={cn(
        "grid gap-6",
        isMobile ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      )}>
        <KPICard 
          label="Tiempo Promedio Tránsito" 
          value={stats.avgTransitTime} 
          unit="Días" 
          icon={<Clock size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <KPICard 
          label="Envíos Retrasados" 
          value={stats.delayedCount} 
          unit="Envíos" 
          icon={<AlertTriangle size={20} className="text-amber-600" />}
          color="bg-amber-50"
        />
        <KPICard 
          label="Eficiencia de Entrega" 
          value={stats.onTimeRate} 
          unit="%" 
          icon={<CheckCircle2 size={20} className="text-emerald-600" />}
          color="bg-emerald-50"
        />
        <KPICard 
          label="Envíos Críticos" 
          value={stats.criticalCount} 
          unit="Alertas" 
          icon={<TrendingUp size={20} className="text-red-600" />}
          color="bg-red-50"
        />
      </div>

      {/* Charts and Alerts Grid */}
      <div className={cn(
        "grid gap-8",
        isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
      )}>
        {/* Trend Chart */}
        <div className={cn(
          "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm",
          !isMobile && "lg:col-span-2"
        )}>
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800">Tendencia de Envíos Mensuales</h3>
            {!isMobile && (
              <select className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none">
                <option>Últimos 6 meses</option>
                <option>Este año</option>
              </select>
            )}
          </div>
          <div className={cn(
            "w-full",
            isMobile ? "h-[200px]" : "h-[300px]"
          )}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="envios" 
                  stroke="#1E4B7A" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#1E4B7A', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pedidos" 
                  stroke="#2DD4BF" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#2DD4BF', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-8">Distribución por Modo</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {modeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {modeData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs font-medium text-slate-600">{item.name}</span>
                <span className="text-xs font-bold text-slate-800 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
          
          {/* Critical Alerts List */}
          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-800">Alertas Críticas</h4>
              <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {criticalShipments.length}
              </span>
            </div>
            <div className="space-y-3">
              {criticalShipments.length > 0 ? (
                criticalShipments.slice(0, 3).map((s) => (
                  <div 
                    key={s.id} 
                    onClick={() => onSelectShipment(s)}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-700 truncate">{s.referencia}</p>
                      <p className="text-[10px] text-slate-400">ETA: {s.eta || 'N/A'}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No hay alertas críticas</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

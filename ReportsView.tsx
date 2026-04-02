import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Download, FileSpreadsheet, TrendingUp, PieChart as PieChartIcon, BarChart3, Calendar, Truck, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Order, Shipment } from '../types';
import { motion } from 'motion/react';

interface ReportsViewProps {
  orders: Order[];
  shipments: Shipment[];
  isMobile?: boolean;
}

export default function ReportsView({ orders, shipments, isMobile }: ReportsViewProps) {
  // Safety check
  if (!orders || !shipments) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Cargando datos de reportes...</p>
      </div>
    );
  }

  // 1. Data for Status Pie Chart
  const statusData = [
    { name: 'Pendiente', value: orders.filter(o => o.estado === 'Pendiente').length, color: '#94a3b8' },
    { name: 'En Planta', value: orders.filter(o => o.estado === 'En Planta').length, color: '#10b981' },
    { name: 'En Tránsito', value: shipments.length, color: '#008080' },
  ].filter(d => d.value > 0);

  // 2. Data for Orders by Supplier (Top 5)
  const supplierCounts: Record<string, number> = {};
  orders.forEach(o => {
    const supplier = o.proveedor || 'Desconocido';
    supplierCounts[supplier] = (supplierCounts[supplier] || 0) + 1;
  });

  const supplierData = Object.entries(supplierCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // 3. Data for Monthly Trend (Calculated from real data)
  const monthlyData = React.useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        month: months[d.getMonth()],
        mIdx: d.getMonth(),
        yIdx: d.getFullYear(),
        pedidos: 0,
        envios: 0
      });
    }

    orders.forEach(o => {
      if (!o.fechaFactura) return;
      const d = new Date(o.fechaFactura);
      const m = last6Months.find(m => m.mIdx === d.getMonth() && m.yIdx === d.getFullYear());
      if (m) m.pedidos++;
    });

    shipments.forEach(s => {
      if (!s.etd) return;
      const d = new Date(s.etd);
      const m = last6Months.find(m => m.mIdx === d.getMonth() && m.yIdx === d.getFullYear());
      if (m) m.envios++;
    });

    return last6Months;
  }, [orders, shipments]);

  const totalsByCurrency = orders.reduce((acc, o) => {
    const currency = o.moneda === '$' ? 'USD' : o.moneda === '€' ? 'EUR' : o.moneda;
    const value = parseFloat(o.valorNeto.replace(/[^0-9.]/g, '') || '0');
    if (value > 0) {
      acc[currency] = (acc[currency] || 0) + value;
    }
    return acc;
  }, {} as Record<string, number>);

  const downloadExecutiveReport = () => {
    if (orders.length === 0 && shipments.length === 0) {
      alert('No hay datos para generar el reporte.');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Orders Sheet
    const ordersData = orders.map(o => ({
      'ID Pedido': o.pedido,
      'Material': o.material,
      'Proveedor': o.proveedor,
      'Cantidad Pedida': o.cantPed,
      'Cantidad Facturada': o.cantidadFacturada,
      'Valor Neto': o.valorNeto,
      'Estado': o.estado,
      'Estatus Logistico': o.estatusLogistico || '',
      'Agente Aduanal': o.agenteAduanal || ''
    }));
    const wsOrders = XLSX.utils.json_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(wb, wsOrders, "Pedidos");

    // Shipments Sheet
    const shipmentsData = shipments.map(s => ({
      'Referencia': s.referencia,
      'Expedidor': s.expedidor,
      'Consignatario': s.consignatario,
      'Origen': s.origen,
      'Destino': s.destino,
      'ETD': s.etd,
      'ETA': s.eta,
      'Modo': s.modo
    }));
    const wsShipments = XLSX.utils.json_to_sheet(shipmentsData);
    XLSX.utils.book_append_sheet(wb, wsShipments, "Envíos");

    // Summary Sheet
    const summaryRows = [
      { 'Categoría': 'Total Pedidos', 'Valor': orders.length },
      { 'Categoría': 'Pedidos en Planta', 'Valor': orders.filter(o => o.estado === 'En Planta').length },
      { 'Categoría': 'Pedidos Pendientes', 'Valor': orders.filter(o => o.estado === 'Pendiente').length },
      { 'Categoría': 'Total Envíos', 'Valor': shipments.length },
    ];

    // Add currency totals to summary
    Object.entries(totalsByCurrency).forEach(([currency, total]) => {
      summaryRows.push({ 'Categoría': `Valor Total (${currency})`, 'Valor': Number(total.toFixed(2)) });
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen Ejecutivo");

    XLSX.writeFile(wb, `Reporte_Ejecutivo_Lufussa_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadInventoryReport = () => {
    if (orders.length === 0) {
      alert('No hay datos de pedidos para generar el reporte de inventario.');
      return;
    }
    const wb = XLSX.utils.book_new();
    const data = orders.map(o => ({
      'Material': o.material,
      'Número Material': o.numMaterial,
      'Proveedor': o.proveedor,
      'Cantidad Pedida': o.cantPed,
      'Pendiente': o.pend,
      'Estado': o.estado,
      'Estatus Logistico': o.estatusLogistico || '',
      'Agente Aduanal': o.agenteAduanal || '',
      'Factura': o.factura
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `Reporte_Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadLogisticsReport = () => {
    if (shipments.length === 0) {
      alert('No hay datos de envíos para generar el reporte logístico.');
      return;
    }
    const wb = XLSX.utils.book_new();
    const data = shipments.map(s => ({
      'Referencia': s.referencia,
      'Modo': s.modo,
      'Expedidor': s.expedidor,
      'Consignatario': s.consignatario,
      'Origen': s.origen,
      'Destino': s.destino,
      'ETD': s.etd,
      'ETA': s.eta,
      'Estado': s.estado || 'En Tránsito'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Logistica");
    XLSX.writeFile(wb, `Reporte_Logistico_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadCostAnalysisReport = () => {
    if (orders.length === 0) {
      alert('No hay datos de pedidos para generar el análisis de costos.');
      return;
    }
    const wb = XLSX.utils.book_new();
    const data = orders.map(o => ({
      'Proveedor': o.proveedor,
      'Material': o.material,
      'Cantidad': o.cantPed,
      'Precio Unitario': o.precioNetoUnitario,
      'Valor Neto': o.valorNeto,
      'Moneda': o.moneda,
      'Estatus Logistico': o.estatusLogistico || '',
      'Agente Aduanal': o.agenteAduanal || '',
      'Factura': o.factura
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Analisis de Costos");
    XLSX.writeFile(wb, `Analisis_Costos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Delivery Efficiency Calculation
  const arrivedShipments = shipments.filter(s => s.ata);
  const onTimeShipments = arrivedShipments.filter(s => {
    if (!s.eta || !s.ata) return true;
    return new Date(s.ata) <= new Date(s.eta);
  });
  const onTimeRate = arrivedShipments.length > 0
    ? Math.round((onTimeShipments.length / arrivedShipments.length) * 100)
    : 0; // Default fallback

  return (
    <div className="space-y-8 pb-12">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Valor Total de Pedidos</p>
          <div className="space-y-3">
            {Object.entries(totalsByCurrency).length > 0 ? (
              Object.entries(totalsByCurrency).map(([currency, total]) => (
                <div key={currency} className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-slate-500">{currency}</span>
                  <span className="text-2xl font-bold text-slate-800">
                    {total.toLocaleString('en-US', { 
                      style: 'currency', 
                      currency: currency === 'USD' || currency === '$' ? 'USD' : currency === 'EUR' || currency === '€' ? 'EUR' : 'USD' 
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-2xl font-bold text-slate-800">$0.00</p>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-4 flex items-center gap-1 border-t border-slate-50 pt-2">
            <TrendingUp size={12} className="text-emerald-500" />
            Basado en datos cargados actualmente
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Eficiencia de Entrega</p>
          <p className="text-3xl font-bold text-slate-800">
            {onTimeRate}%
          </p>
          <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-lufussa-teal" />
            Envíos a tiempo vs total arribados
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Envíos Activos</p>
          <p className="text-3xl font-bold text-slate-800">{shipments.length}</p>
          <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
            <Truck size={12} className="text-blue-500" />
            Tránsito marítimo y aéreo
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-lufussa-teal" size={20} />
            Análisis de Operaciones
          </h3>
          <p className="text-sm text-slate-500">Visualización de métricas clave y generación de reportes</p>
        </div>
        <button 
          onClick={downloadExecutiveReport}
          className="flex items-center gap-2 px-6 py-3 bg-lufussa-teal text-white rounded-xl hover:bg-opacity-90 transition-all font-bold shadow-lg shadow-lufussa-teal/20"
        >
          <Download size={20} />
          Descargar Reporte Ejecutivo (Excel)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-700 flex items-center gap-2">
              <PieChartIcon size={18} className="text-lufussa-teal" />
              Distribución de Estados
            </h4>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Suppliers */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-700 flex items-center gap-2">
              <BarChart3 size={18} className="text-lufussa-teal" />
              Top 5 Proveedores (por Pedidos)
            </h4>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120} 
                  axisLine={false} 
                  tickLine={false}
                  style={{ fontSize: '10px', fontWeight: 'bold', fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#008080" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Monthly Trend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-700 flex items-center gap-2">
              <Calendar size={18} className="text-lufussa-teal" />
              Tendencia de Actividad
            </h4>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  style={{ fontSize: '12px', fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  style={{ fontSize: '12px', fill: '#64748b' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" align="right" height={36}/>
                <Line 
                  type="monotone" 
                  dataKey="pedidos" 
                  stroke="#008080" 
                  strokeWidth={3} 
                  dot={{ r: 6, fill: '#008080', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="envios" 
                  stroke="#94a3b8" 
                  strokeWidth={3} 
                  dot={{ r: 6, fill: '#94a3b8', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={downloadInventoryReport}
          className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-lufussa-teal transition-colors group cursor-pointer"
        >
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-lufussa-teal group-hover:text-white transition-colors">
            <FileSpreadsheet size={24} />
          </div>
          <h5 className="font-bold text-slate-800 mb-1">Reporte de Inventario</h5>
          <p className="text-xs text-slate-500">Detalle completo de materiales en planta y pendientes.</p>
        </div>
        <div 
          onClick={downloadLogisticsReport}
          className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-lufussa-teal transition-colors group cursor-pointer"
        >
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-lufussa-teal group-hover:text-white transition-colors">
            <Truck size={24} />
          </div>
          <h5 className="font-bold text-slate-800 mb-1">Reporte Logístico</h5>
          <p className="text-xs text-slate-500">Tiempos de tránsito, ETAs y estados de envíos marítimos/aéreos.</p>
        </div>
        <div 
          onClick={downloadCostAnalysisReport}
          className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-lufussa-teal transition-colors group cursor-pointer"
        >
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-lufussa-teal group-hover:text-white transition-colors">
            <TrendingUp size={24} />
          </div>
          <h5 className="font-bold text-slate-800 mb-1">Análisis de Costos</h5>
          <p className="text-xs text-slate-500">Resumen de valores netos por proveedor y categoría.</p>
        </div>
      </div>
    </div>
  );
}

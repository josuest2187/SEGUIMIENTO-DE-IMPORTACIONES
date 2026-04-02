import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Filter, 
  Search, 
  X, 
  Save, 
  Star, 
  ChevronDown, 
  ChevronUp,
  Truck,
  Package,
  Building2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export interface AdvancedFilterState {
  dateRange: {
    start: string;
    end: string;
    type: 'etd' | 'eta' | 'atd' | 'ata' | 'fechaFactura';
  } | null;
  statuses: string[];
  suppliers: string[];
  shippers: string[];
  search: string;
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: AdvancedFilterState) => void;
  availableStatuses: string[];
  availableSuppliers: string[];
  availableShippers: string[];
  type: 'orders' | 'shipments';
}

export default function AdvancedFilters({ 
  onFilterChange, 
  availableStatuses, 
  availableSuppliers, 
  availableShippers,
  type
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilterState>({
    dateRange: null,
    statuses: [],
    suppliers: [],
    shippers: [],
    search: ''
  });

  const [favorites, setFavorites] = useState<{name: string, filters: AdvancedFilterState}[]>([]);
  const [newFavoriteName, setNewFavoriteName] = useState('');
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`favorite_filters_${type}`);
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, [type]);

  const handleFilterChange = (newFilters: AdvancedFilterState) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    handleFilterChange({ ...filters, statuses: newStatuses });
  };

  const toggleSupplier = (supplier: string) => {
    const newSuppliers = filters.suppliers.includes(supplier)
      ? filters.suppliers.filter(s => s !== supplier)
      : [...filters.suppliers, supplier];
    handleFilterChange({ ...filters, suppliers: newSuppliers });
  };

  const toggleShipper = (shipper: string) => {
    const newShippers = filters.shippers.includes(shipper)
      ? filters.shippers.filter(s => s !== shipper)
      : [...filters.shippers, shipper];
    handleFilterChange({ ...filters, shippers: newShippers });
  };

  const clearFilters = () => {
    handleFilterChange({
      dateRange: null,
      statuses: [],
      suppliers: [],
      shippers: [],
      search: ''
    });
  };

  const saveFavorite = () => {
    if (!newFavoriteName) return;
    const newFavorites = [...favorites, { name: newFavoriteName, filters }];
    setFavorites(newFavorites);
    localStorage.setItem(`favorite_filters_${type}`, JSON.stringify(newFavorites));
    setNewFavoriteName('');
    setIsSavingFavorite(false);
  };

  const applyFavorite = (favFilters: AdvancedFilterState) => {
    handleFilterChange(favFilters);
  };

  const deleteFavorite = (name: string) => {
    const newFavorites = favorites.filter(f => f.name !== name);
    setFavorites(newFavorites);
    localStorage.setItem(`favorite_filters_${type}`, JSON.stringify(newFavorites));
  };

  const activeFilterCount = 
    (filters.dateRange ? 1 : 0) + 
    filters.statuses.length + 
    filters.suppliers.length + 
    filters.shippers.length +
    (filters.search ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <input
            type="text"
            placeholder={type === 'orders' ? "Buscar por pedido, material, proveedor..." : "Buscar por referencia, expedidor, origen..."}
            value={filters.search}
            onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-lufussa-teal/20 focus:border-lufussa-teal transition-all shadow-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          {filters.search && (
            <button
              onClick={() => handleFilterChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors p-1 hover:bg-slate-100 rounded-full"
              title="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm transition-all shadow-sm",
            isOpen || activeFilterCount > 0 
              ? "bg-lufussa-teal border-lufussa-teal text-white" 
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <Filter size={18} />
          Filtros Avanzados
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-white text-lufussa-teal w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
              {activeFilterCount}
            </span>
          )}
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {/* Date Range */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={14} className="text-lufussa-teal" />
                    Rango de Fechas
                  </h4>
                  <div className="space-y-2">
                    <select
                      value={filters.dateRange?.type || 'etd'}
                      onChange={(e) => handleFilterChange({ 
                        ...filters, 
                        dateRange: { 
                          start: filters.dateRange?.start || '', 
                          end: filters.dateRange?.end || '', 
                          type: e.target.value as any 
                        } 
                      })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                    >
                      <option value="etd">ETD (Salida)</option>
                      <option value="eta">ETA (Llegada)</option>
                      {type === 'shipments' && <option value="atd">ATD (Salida Real)</option>}
                      {type === 'shipments' && <option value="ata">ATA (Llegada Real)</option>}
                      {type === 'orders' && <option value="fechaFactura">Fecha Factura</option>}
                    </select>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={filters.dateRange?.start || ''}
                        onChange={(e) => handleFilterChange({ 
                          ...filters, 
                          dateRange: { 
                            start: e.target.value, 
                            end: filters.dateRange?.end || '', 
                            type: filters.dateRange?.type || 'etd' 
                          } 
                        })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                      />
                      <input
                        type="date"
                        value={filters.dateRange?.end || ''}
                        onChange={(e) => handleFilterChange({ 
                          ...filters, 
                          dateRange: { 
                            start: filters.dateRange?.start || '', 
                            end: e.target.value, 
                            type: filters.dateRange?.type || 'etd' 
                          } 
                        })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Statuses */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-lufussa-teal" />
                    Estados
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {availableStatuses.map(status => (
                      <button
                        key={status}
                        onClick={() => toggleStatus(status)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                          filters.statuses.includes(status)
                            ? "bg-lufussa-teal border-lufussa-teal text-white"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:border-lufussa-teal/30"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Suppliers / Shippers */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Building2 size={14} className="text-lufussa-teal" />
                    {type === 'orders' ? 'Proveedores' : 'Expedidores'}
                  </h4>
                  <div className="max-h-32 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                    {(type === 'orders' ? availableSuppliers : availableShippers).map(item => (
                      <label key={item} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={type === 'orders' ? filters.suppliers.includes(item) : filters.shippers.includes(item)}
                          onChange={() => type === 'orders' ? toggleSupplier(item) : toggleShipper(item)}
                          className="rounded border-slate-300 text-lufussa-teal focus:ring-lufussa-teal"
                        />
                        <span className="text-xs text-slate-600 group-hover:text-lufussa-teal transition-colors truncate">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Favorites */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Star size={14} className="text-amber-500" />
                    Filtros Guardados
                  </h4>
                  <div className="space-y-2">
                    {favorites.length > 0 ? (
                      <div className="space-y-1">
                        {favorites.map(fav => (
                          <div key={fav.name} className="flex items-center justify-between group">
                            <button
                              onClick={() => applyFavorite(fav.filters)}
                              className="text-xs text-slate-600 hover:text-lufussa-teal font-medium truncate flex-1 text-left"
                            >
                              {fav.name}
                            </button>
                            <button
                              onClick={() => deleteFavorite(fav.name)}
                              className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">No hay filtros guardados.</p>
                    )}
                    
                    {isSavingFavorite ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          placeholder="Nombre..."
                          autoFocus
                          value={newFavoriteName}
                          onChange={(e) => setNewFavoriteName(e.target.value)}
                          className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] outline-none"
                        />
                        <button
                          onClick={saveFavorite}
                          className="p-1 bg-lufussa-teal text-white rounded"
                        >
                          <Save size={12} />
                        </button>
                        <button
                          onClick={() => setIsSavingFavorite(false)}
                          className="p-1 bg-slate-200 text-slate-500 rounded"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsSavingFavorite(true)}
                        disabled={activeFilterCount === 0}
                        className="w-full py-1.5 border border-dashed border-slate-200 rounded-lg text-[10px] font-bold text-slate-400 hover:border-lufussa-teal hover:text-lufussa-teal transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        + Guardar Filtro Actual
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

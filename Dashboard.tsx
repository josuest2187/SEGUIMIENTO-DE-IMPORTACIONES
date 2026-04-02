import React, { useState, useRef, useEffect } from 'react';
import ReportsView from './ReportsView';
import SettingsView from './SettingsView';
import { 
  Menu, 
  Search, 
  Maximize2, 
  Bell, 
  ChevronDown, 
  Info, 
  MapPin, 
  X, 
  CheckCircle2,
  LayoutGrid,
  Package,
  Truck,
  Upload,
  FileSpreadsheet,
  ArrowLeft,
  BarChart3,
  Settings,
  AlertTriangle,
  Clock,
  FileText,
  Plus,
  Copy,
  Bookmark,
  Keyboard,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';
import { User, Shipment, Order, SystemSettings, AppNotification, ChangeLog, OrderTemplate, Vendor, Backup } from '../types';
import ShipmentsTable from './ShipmentsTable';
import OrdersTable from './OrdersTable';
import ShipmentDetail from './ShipmentDetail';
import InvoiceModal from './InvoiceModal';
import OrderForm from './OrderForm';
import Logo from './Logo';
import AdvancedFilters, { AdvancedFilterState } from './AdvancedFilters';
import KPISection from './KPISection';
import AIInsights from './AIInsights';
import AIAssistant from './AIAssistant';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  systemSettings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
}

type ViewMode = 'dashboard' | 'shipments' | 'orders' | 'shipment-detail' | 'reports' | 'settings';

export default function Dashboard({ user, onLogout, systemSettings, onUpdateSettings }: DashboardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'envios' | 'pedidos'>('envios');
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | Order[] | null>(null);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Order Templates & Vendors State
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Partial<Order> | null>(null);
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipmentFilter, setShipmentFilter] = useState<'all' | 'arrived'>('all');
  const [orderFilter, setOrderFilter] = useState<'all' | 'in-stock'>('all');
  const [orderAdvancedFilters, setOrderAdvancedFilters] = useState<AdvancedFilterState | null>(null);
  const [shipmentAdvancedFilters, setShipmentAdvancedFilters] = useState<AdvancedFilterState | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isAIInsightsLoading, setIsAIInsightsLoading] = useState(false);
  const [aiInsights, setAIInsights] = useState<any[]>([]);

  useEffect(() => {
    // Load all data from API
    const loadData = async () => {
      try {
        // Agregar timestamp para evitar caché del navegador
        const timestamp = Date.now();
        const headers = {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        };
        
        const [shipRes, orderRes, vendorRes, tempRes] = await Promise.all([
          fetch(`/api/shipments?_t=${timestamp}`, { headers }),
          fetch(`/api/orders?_t=${timestamp}`, { headers }),
          fetch(`/api/vendors?_t=${timestamp}`, { headers }),
          fetch(`/api/templates?_t=${timestamp}`, { headers })
        ]);

        if (shipRes.ok) setShipments(await shipRes.json());
        if (orderRes.ok) {
          const freshOrders = await orderRes.json();
          console.log(`📦 ${freshOrders.length} pedidos cargados (sin caché)`);
          setOrders(freshOrders);
        }
        if (vendorRes.ok) setVendors(await vendorRes.json());
        if (tempRes.ok) setTemplates(await tempRes.json());
      } catch (e) {
        console.error("Load data error", e);
      }
    };
    loadData();
  }, []);

  const handleSelectOrderByNumber = (poNumber: string) => {
    const order = orders.find(o => o.pedido === poNumber);
    if (order) {
      setViewMode('orders');
      setSearchTerm(poNumber);
      setIsSearchOpen(true);
      
      setNotifications(prev => [{
        id: `ai-nav-${Date.now()}`,
        type: 'info',
        title: 'Navegación Asistida',
        message: `Mostrando detalles del pedido ${poNumber}`,
        timestamp: new Date(),
        read: false
      }, ...prev]);
    } else {
      setNotifications(prev => [{
        id: `ai-nav-err-${Date.now()}`,
        type: 'warning',
        title: 'Pedido no encontrado',
        message: `No se pudo encontrar el pedido ${poNumber} en la base de datos actual.`,
        timestamp: new Date(),
        read: false
      }, ...prev]);
    }
  };

  const handleSelectShipmentByRef = (ref: string) => {
    const shipment = shipments.find(s => s.referencia === ref);
    if (shipment) {
      setSelectedShipment(shipment);
      setViewMode('shipment-detail');
      
      setNotifications(prev => [{
        id: `ai-nav-${Date.now()}`,
        type: 'info',
        title: 'Navegación Asistida',
        message: `Mostrando detalles del envío ${ref}`,
        timestamp: new Date(),
        read: false
      }, ...prev]);
    } else {
      setNotifications(prev => [{
        id: `ai-nav-err-${Date.now()}`,
        type: 'warning',
        title: 'Envío no encontrado',
        message: `No se pudo encontrar el envío ${ref} en la base de datos actual.`,
        timestamp: new Date(),
        read: false
      }, ...prev]);
    }
  };

  const generateAIInsights = async () => {
    setIsAIInsightsLoading(true);
    try {
      // El backend ahora carga todos los datos directamente de la BD
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setAIInsights(data.insights);
        
        setNotifications(prev => [{
          id: `ai-success-${Date.now()}`,
          type: 'success',
          title: 'Insights Generados',
          message: 'Gemini ha analizado tus datos logísticos con éxito.',
          timestamp: new Date(),
          read: false
        }, ...prev]);
      } else {
        throw new Error(data.message || 'Error al generar insights');
      }
    } catch (e: any) {
      console.error("AI Insights error", e);
      const errorMessage = e.message?.includes('no disponible')
        ? 'El servicio de IA no está disponible. Por favor, contacta al administrador para configurar la API key.'
        : 'No se pudieron generar los insights. Por favor, intenta de nuevo.';
      
      setNotifications(prev => [{
        id: `ai-error-${Date.now()}`,
        type: 'error',
        title: 'Error de IA',
        message: errorMessage,
        timestamp: new Date(),
        read: false
      }, ...prev]);
    } finally {
      setIsAIInsightsLoading(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const gKeyPressedRef = useRef<boolean>(false);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in an input/textarea
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        // Only Esc should work in inputs
        if (e.key === 'Escape') {
          if (isSearchOpen) setIsSearchOpen(false);
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      // Ctrl+N: New order
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsOrderFormOpen(true);
        setNotifications(prev => [{
          id: `shortcut-n-${Date.now()}`,
          type: 'info',
          title: 'Atajo: Nuevo Pedido',
          message: 'Abriendo formulario de nuevo pedido',
          timestamp: new Date(),
          read: false
        }, ...prev]);
      }
      
      // Ctrl+S: Save/Sync (Manual Backup)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleCreateBackup('Manual');
        setNotifications(prev => [{
          id: `shortcut-s-${Date.now()}`,
          type: 'success',
          title: 'Atajo: Sincronizar',
          message: 'Copia de seguridad manual creada con éxito',
          timestamp: new Date(),
          read: false
        }, ...prev]);
      }

      // Ctrl+F: Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }

      // /: Focus on search
      if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }

      // ?: Help
      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }

      // M: Toggle Menu
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsMenuOpen(!isMenuOpen);
      }

      // F: Toggle Fullscreen
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }

      // B: Toggle Notifications
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsNotificationsOpen(!isNotificationsOpen);
      }

      // Sequential Shortcuts (G then ...)
      if (e.key.toLowerCase() === 'g') {
        gKeyPressedRef.current = true;
        setTimeout(() => { gKeyPressedRef.current = false; }, 1000); // 1 second window
        return;
      }

      if (gKeyPressedRef.current) {
        const key = e.key.toLowerCase();
        if (key === 'd') { setViewMode('dashboard'); e.preventDefault(); }
        if (key === 's') { setViewMode('shipments'); e.preventDefault(); }
        if (key === 'o') { setViewMode('orders'); e.preventDefault(); }
        if (key === 'r') { setViewMode('reports'); e.preventDefault(); }
        if (key === 'c') { setViewMode('settings'); e.preventDefault(); }
        gKeyPressedRef.current = false;
      }

      // Ctrl+E: Export
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (viewMode === 'shipments') {
          import('../services/exportService').then(m => {
            m.exportToExcel(shipments, 'Envios_Lufussa');
          });
        } else if (viewMode === 'orders') {
          import('../services/exportService').then(m => {
            m.exportToExcel(orders, 'Pedidos_Lufussa');
          });
        }
        setNotifications(prev => [{
          id: `shortcut-e-${Date.now()}`,
          type: 'info',
          title: 'Atajo: Exportar',
          message: 'Iniciando exportación a Excel',
          timestamp: new Date(),
          read: false
        }, ...prev]);
      }

      // Esc: Close modals
      if (e.key === 'Escape') {
        if (isOrderFormOpen) setIsOrderFormOpen(false);
        if (isInvoiceModalOpen) setIsInvoiceModalOpen(false);
        if (selectedShipment) setSelectedShipment(null);
        if (isNotificationsOpen) setIsNotificationsOpen(false);
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        if (isSearchOpen) setIsSearchOpen(false);
        if (isMenuOpen) setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, selectedShipment, isOrderFormOpen, isInvoiceModalOpen, isNotificationsOpen, isShortcutsOpen, isSearchOpen, isMenuOpen, shipments, orders, systemSettings]);

  // Auto-Logout por Inactividad
  useEffect(() => {
    const updateActivity = () => {
      localStorage.setItem('lufussa_last_activity', Date.now().toString());
    };

    // Detectar actividad del usuario
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    // Verificar sesión cada 60 segundos
    const sessionCheckInterval = setInterval(() => {
      const lastActivity = localStorage.getItem('lufussa_last_activity');
      const sessionTimeout = parseInt(systemSettings.sessionTimeout || '30');

      if (lastActivity) {
        const now = Date.now();
        const lastActivityTime = parseInt(lastActivity);
        const minutesInactive = (now - lastActivityTime) / 1000 / 60;

        if (minutesInactive >= sessionTimeout) {
          console.log(`⏱️ Sesión cerrada automáticamente por inactividad (${sessionTimeout} minutos)`);
          alert(`Su sesión ha expirado por inactividad de ${sessionTimeout} minutos. Debe iniciar sesión nuevamente.`);
          onLogout();
        }
      }
    }, 60000); // Verificar cada 60 segundos

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(sessionCheckInterval);
    };
  }, [systemSettings.sessionTimeout, onLogout]);

  // Backup State
  const [backups, setBackups] = useState<Backup[]>([]);

  // Load backups from localStorage on mount
  useEffect(() => {
    const savedBackups = localStorage.getItem('lufussa_backups');
    if (savedBackups) {
      try {
        setBackups(JSON.parse(savedBackups));
      } catch (e) {
        console.error('Failed to parse backups', e);
      }
    }
  }, []);

  // Auto-backup effect
  useEffect(() => {
    if (systemSettings.autoBackupInterval <= 0) return;

    const intervalMs = systemSettings.autoBackupInterval * 60 * 60 * 1000;
    
    const checkAndBackup = () => {
      const lastBackup = systemSettings.lastBackupAt ? new Date(systemSettings.lastBackupAt).getTime() : 0;
      const now = Date.now();
      
      if (now - lastBackup >= intervalMs) {
        handleCreateBackup('Automático');
      }
    };

    const timer = setInterval(checkAndBackup, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [systemSettings.autoBackupInterval, systemSettings.lastBackupAt, orders, shipments, templates, vendors, systemSettings]);

  const handleCreateBackup = (type: string = 'Manual') => {
    const backupData = {
      orders,
      shipments,
      templates,
      vendors,
      settings: systemSettings
    };

    const newBackup: Backup = {
      id: `bak-${Date.now()}`,
      timestamp: new Date().toISOString(),
      size: `${(JSON.stringify(backupData).length / 1024).toFixed(2)} KB`,
      data: backupData
    };

    const updatedBackups = [newBackup, ...backups].slice(0, systemSettings.maxBackups);
    setBackups(updatedBackups);
    localStorage.setItem('lufussa_backups', JSON.stringify(updatedBackups));

    onUpdateSettings({
      ...systemSettings,
      lastBackupAt: newBackup.timestamp
    });

    setNotifications(prev => [{
      id: `bak-notif-${Date.now()}`,
      type: 'success',
      title: 'Backup Realizado',
      message: `Se ha creado un backup ${type.toLowerCase()} correctamente.`,
      timestamp: new Date(),
      read: false
    }, ...prev]);
  };

  const handleRestoreBackup = (backup: Backup) => {
    if (confirm('¿Está seguro de restaurar este backup? Se perderán los datos actuales no guardados.')) {
      setOrders(backup.data.orders);
      setShipments(backup.data.shipments);
      setTemplates(backup.data.templates);
      setVendors(backup.data.vendors);
      onUpdateSettings(backup.data.settings);
      
      setNotifications(prev => [{
        id: `restore-notif-${Date.now()}`,
        type: 'success',
        title: 'Restauración Completada',
        message: 'Los datos han sido restaurados desde el backup seleccionado.',
        timestamp: new Date(),
        read: false
      }, ...prev]);
    }
  };

  const handleDownloadBackup = (backup: Backup) => {
    const wb = XLSX.utils.book_new();
    
    // Orders
    const ordersData = backup.data.orders.map(({ history, docs, ...rest }) => rest);
    const ordersSheet = XLSX.utils.json_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(wb, ordersSheet, "Pedidos");
    
    // Shipments
    const shipmentsData = backup.data.shipments.map(({ history, docs, ...rest }) => rest);
    const shipmentsSheet = XLSX.utils.json_to_sheet(shipmentsData);
    XLSX.utils.book_append_sheet(wb, shipmentsSheet, "Envíos");
    
    XLSX.writeFile(wb, `LUFUSSA_Backup_${new Date(backup.timestamp).toISOString().split('T')[0]}.xlsx`);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Smart Notifications Logic
  useEffect(() => {
    const newNotifications: AppNotification[] = [];
    const now = new Date();

    shipments.forEach(s => {
      // 1. Alert 3 days before ETA
      if (s.eta && s.estado !== 'Entregado' && s.estado !== 'Arribado') {
        const etaDate = new Date(s.eta);
        const diffDays = (etaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diffDays > 0 && diffDays <= 3) {
          newNotifications.push({
            id: `eta-soon-${s.id}`,
            type: 'info',
            title: 'Arribo Próximo',
            message: `El envío ${s.referencia} llegará en ${Math.ceil(diffDays)} días.`,
            timestamp: new Date(),
            read: false,
            shipmentId: s.id
          });
        }
      }

      // 2. Notify delayed shipments
      if (s.eta && s.estado !== 'Entregado' && s.estado !== 'Arribado') {
        const etaDate = new Date(s.eta);
        if (etaDate < now) {
          newNotifications.push({
            id: `delayed-${s.id}`,
            type: 'error',
            title: 'Envío Retrasado',
            message: `El envío ${s.referencia} ha superado su fecha estimada de llegada.`,
            timestamp: new Date(),
            read: false,
            shipmentId: s.id
          });
        }
      }

      // 3. Missing documentation reminders
      if (!s.docs || s.docs.length === 0) {
        newNotifications.push({
          id: `missing-docs-${s.id}`,
          type: 'warning',
          title: 'Documentación Faltante',
          message: `El envío ${s.referencia} no tiene documentos adjuntos.`,
          timestamp: new Date(),
          read: false,
          shipmentId: s.id
        });
      }
    });

    // Avoid duplicate notifications (simple check by ID)
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
      return [...uniqueNew, ...prev].slice(0, 50); // Keep last 50
    });
  }, [shipments]);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const handleSyncFromExcel = async () => {
    console.log('🔄 Iniciando sincronización bidireccional desde Excel...');
    try {
      setNotifications(prev => [{
        id: `sync-start-${Date.now()}`,
        type: 'info',
        title: '🔄 Sincronización Bidireccional',
        message: 'Leyendo Excel → Actualizando sistema → Completando Excel con datos faltantes',
        timestamp: new Date(),
        read: false
      }, ...prev]);
      
      // Abrir panel de notificaciones para mostrar progreso
      setIsNotificationsOpen(true);

      console.log('📡 Enviando petición a /api/sync/excel');
      const res = await fetch('/api/sync/excel', {
        method: 'POST'
      });

      console.log('📥 Respuesta recibida:', res.status);
      const result = await res.json();
      console.log('📊 Resultado:', result);

      if (result.success) {
        // Reload orders SIN CACHÉ
        console.log('✅ Sincronización exitosa, recargando pedidos sin caché...');
        const timestamp = Date.now();
        const orderRes = await fetch(`/api/orders?_t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        if (orderRes.ok) {
          const freshOrders = await orderRes.json();
          console.log(`📦 ${freshOrders.length} pedidos cargados (FORZANDO RECARGA)`);
          console.log('🔍 Muestra de primeros 3 pedidos:', freshOrders.slice(0, 3).map((o: any) => ({
            pedido: o.pedido,
            transporte: o.transp,
            prioridad: o.prioridad
          })));
          setOrders(freshOrders);
        }

        setNotifications(prev => [{
          id: `sync-success-${Date.now()}`,
          type: 'success',
          title: '✅ Sincronización Bidireccional Exitosa',
          message: `${result.count} pedidos sincronizados (Excel ↔ Sistema)\n\n✓ Excel actualizado con datos del sistema\n✓ Sistema actualizado con datos del Excel\n✓ Columnas creadas automáticamente\n✓ Datos existentes protegidos`,
          timestamp: new Date(),
          read: false
        }, ...prev]);

        // Abrir panel de notificaciones para mostrar confirmación
        setIsNotificationsOpen(true);

        // Mostrar alert de confirmación detallado
        alert(
          `✅ Sincronización Bidireccional Completada\n\n` +
          `📊 ${result.count} pedidos sincronizados\n\n` +
          `🔄 Operaciones realizadas:\n` +
          `  ✓ Excel → Sistema (datos importados)\n` +
          `  ✓ Sistema → Excel (celdas vacías completadas)\n` +
          `  ✓ Columnas nuevas creadas automáticamente\n` +
          `  ✓ Datos existentes protegidos (sin borrado)\n\n` +
          `🛡️ Tus datos manuales en Excel están seguros`
        );

        // Auto-switch to orders view
        if (result.count > 0) {
          setViewMode('orders');
        }
      } else {
        throw new Error(result.message || 'Error al sincronizar');
      }
    } catch (error: any) {
      console.error('❌ Error en sincronización:', error);
      setNotifications(prev => [{
        id: `sync-error-${Date.now()}`,
        type: 'error',
        title: 'Error de Sincronización',
        message: error.message || 'No se pudo sincronizar con el archivo Excel',
        timestamp: new Date(),
        read: false
      }, ...prev]);
      
      // Abrir panel de notificaciones para mostrar error
      setIsNotificationsOpen(true);
      
      // Mostrar alert de error
      alert(`❌ Error en la sincronización\n\n${error.message || 'No se pudo sincronizar con el archivo Excel'}\n\nVerifica que el archivo importaciones.xlsx esté en la raíz del proyecto.`);
    }
  };

  const handleExportToExcel = async () => {
    console.log('📤 Exportando cambios al Excel...');
    
    try {
      setNotifications(prev => [{
        id: `export-start-${Date.now()}`,
        type: 'info',
        title: '📤 Exportando Cambios',
        message: 'Guardando tus modificaciones en el Excel...',
        timestamp: new Date(),
        read: false
      }, ...prev]);
      
      setIsNotificationsOpen(true);

      const res = await fetch('/api/export-to-excel', {
        method: 'POST'
      });

      const result = await res.json();
      console.log('📊 Resultado de exportación:', result);

      if (result.success) {
        if (result.modificaciones === 0) {
          setNotifications(prev => [{
            id: `export-nochanges-${Date.now()}`,
            type: 'info',
            title: 'ℹ️ Sin Cambios',
            message: 'No hay modificaciones que exportar al Excel',
            timestamp: new Date(),
            read: false
          }, ...prev]);
          
          alert('ℹ️ No hay cambios que exportar\n\nEl Excel ya está actualizado con todos tus datos.');
        } else {
          setNotifications(prev => [{
            id: `export-success-${Date.now()}`,
            type: 'success',
            title: '✅ Excel Actualizado',
            message: `${result.modificaciones} pedido(s) actualizado(s) en el Excel\n\nTus cambios han sido guardados correctamente.`,
            timestamp: new Date(),
            read: false
          }, ...prev]);
          
          alert(
            `✅ Excel Actualizado Exitosamente\n\n` +
            `📝 ${result.modificaciones} pedido(s) modificado(s)\n\n` +
            `Los siguientes campos se exportaron:\n` +
            `  • Factura\n` +
            `  • Estado\n` +
            `  • Prioridad\n` +
            `  • ETD / ETA\n` +
            `  • Tipo de Transporte\n\n` +
            `✓ Los datos del Excel están actualizados\n` +
            `✓ No se borraron datos existentes\n` +
            `✓ Solo se escribieron cambios manuales`
          );
        }
      } else {
        throw new Error(result.message || 'Error al exportar');
      }
    } catch (error: any) {
      console.error('❌ Error en exportación:', error);
      
      const errorMessage = error.message || 'No se pudo exportar al Excel';
      const isFileLocked = errorMessage.includes('está abierto') || errorMessage.includes('EBUSY') || errorMessage.includes('EPERM');
      
      setNotifications(prev => [{
        id: `export-error-${Date.now()}`,
        type: 'error',
        title: isFileLocked ? '🔒 Excel Abierto' : '❌ Error al Exportar',
        message: errorMessage,
        timestamp: new Date(),
        read: false
      }, ...prev]);
      
      setIsNotificationsOpen(true);
      
      if (isFileLocked) {
        alert(
          `⚠️ No se puede actualizar el Excel\n\n` +
          `El archivo "importaciones.xlsx" está abierto.\n\n` +
          `Por favor:\n` +
          `  1. Cierra el archivo Excel\n` +
          `  2. Haz clic nuevamente en "Exportar cambios"\n\n` +
          `Tus cambios están guardados en el sistema.`
        );
      } else {
        alert(`❌ Error al exportar\n\n${errorMessage}`);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      // Detect if it's Shipments or Orders based on columns
      const firstRow = data[0] || {};
      const isOrderFile = 'Pedido' in firstRow || 'PEDIDO' in firstRow;

      if (isOrderFile) {
        const mappedOrders: Order[] = data.map((row, index) => {
          const cantPed = Number(row['Cant. Ped'] || row['CANT. PED'] || row['Cant.Ped'] || row['CANT.PED'] || row['Cantidad'] || row['CANTIDAD'] || row['Cant.'] || 0);
          const pend = Number(row.Pend || row.PEND || row['Pendiente'] || row['PENDIENTE'] || row['Pend.'] || row['Cant. por entregar'] || row['Cantidad por entregar'] || row['Open Quantity'] || row['Still to be delivered'] || cantPed);
          
          // Currency detection logic
          const currency = String(row.Moneda || row.MONEDA || row.Currency || row.CURRENCY || row.WAERS || row.Crcy || row.CRCY || row.HWAER || '').toUpperCase();
          
          // Helper to find column by multiple possible names with priority
          const findValue = (exactKeys: string[], partialKeys: string[], defaultValue: string = '0.00') => {
            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normalizedExact = exactKeys.map(normalize);
            const normalizedPartial = partialKeys.map(normalize);
            
            const rowKeys = Object.keys(row);
            
            // 1. Try exact normalized match (Highest Priority)
            for (const rk of rowKeys) {
              const nrk = normalize(rk);
              if (normalizedExact.includes(nrk)) {
                return String(row[rk]);
              }
            }
            
            // 2. Try partial match with specific keywords (Medium Priority)
            for (const rk of rowKeys) {
              const nrk = normalize(rk);
              if (normalizedPartial.some(nk => nrk.includes(nk))) {
                return String(row[rk]);
              }
            }
            
            return defaultValue;
          };

          // Specific keys for Net Value (Total)
          const rawNetValue = findValue(
            [
              'Valor neto de pedido', 'VALOR NETO DE PEDIDO', 'Valor neto pedido', 
              'Valor Neto', 'VALOR NETO', 'Valor neto', 'Importe neto', 'IMPORTE NETO', 
              'Net value', 'Net Value', 'NET VALUE', 'Netwr', 'NETWR', 'Wrbtr', 'WRBTR', 
              'Dmbtr', 'DMBTR'
            ],
            ['total', 'monto', 'importe'],
            '0.00'
          );

          // Specific keys for Unit Price
          const rawUnitPrice = findValue(
            ['Precio Neto Unitario', 'PRECIO NETO UNITARIO', 'Precio neto', 'PRECIO NETO', 'Net price', 'Net Price', 'NET PRICE', 'Precio Unitario', 'PRECIO UNITARIO', 'Netpr', 'NETPR'],
            ['unitario', 'unit', 'precio'],
            ''
          );

          const getCurrencySymbol = (val: string, cur: string) => {
            const combined = (val + cur).toUpperCase();
            if (combined.includes('USD') || combined.includes('$')) return '$';
            if (combined.includes('EUR') || combined.includes('€')) return '€';
            return '';
          };

          const formatWithCurrency = (val: string, cur: string) => {
            if (!val || val === '0.00' && cur === '') return val;
            const symbol = getCurrencySymbol(val, cur);
            const num = val.replace(/[^0-9.,-]+/g, "");
            return symbol ? `${symbol} ${num}` : num;
          };

          return {
            id: String(Date.now() + index),
            pedido: String(row.Pedido || row.PEDIDO || row['N° pedido'] || row['N° pedido'] || row['Documento compras'] || 'N/A'),
            numMaterial: String(row['Num. de Material'] || row['NUM. DE MATERIAL'] || row['Num. Material'] || row['NUM. MATERIAL'] || row['Material'] || row['MATERIAL'] || ''),
            material: String(row.Texto || row.TEXTO || row.Material || row.MATERIAL || row['Texto breve'] || 'N/A'),
            proveedor: String(row.Proveedor || row.PROVEEDOR || row['Nombre del proveedor'] || row['Nombre'] || 'N/A'),
            cantPed,
            valorNeto: formatWithCurrency(rawNetValue, currency),
            moneda: getCurrencySymbol(rawNetValue, currency) || currency || 'USD',
            estado: String(row.Estado || row.ESTADO || row.Status || row.STATUS || (pend === 0 ? 'En Planta' : 'Pendiente')),
            factura: String(row.Factura || row.FACTURA || row.Invoice || row.INVOICE || 'N/A'),
            pend,
            transp: String(row.Transp || row.TRANSP || row['Modo'] || '').toLowerCase().includes('aereo') ? 'aereo' : 'maritimo',
            // New detail fields
            modelo: String(row.Modelo || row.MODELO || ''),
            etd: String(row['ETD (Salida)'] || row['ETD (SALIDA)'] || row.ETD || row.etd || ''),
            eta: String(row['ETA (Llegada)'] || row['ETA (LLEGADA)'] || row.ETA || row.eta || ''),
            fechaFactura: String(row['Fecha Factura'] || row['FECHA FACTURA'] || ''),
            precioNetoUnitario: formatWithCurrency(rawUnitPrice, currency),
            cantidadFacturada: Number(row['Cantidad Facturada'] || row['CANTIDAD FACTURADA'] || row['Cant. facturada'] || row['Cantidad facturada'] || 0),
            prioridad: String(row.Prioridad || row.PRIORIDAD || ''),
            docs: [],
          };
        });
        setOrders(mappedOrders);
        setViewMode('orders');
        
        // Persist to backend
        fetch('/api/orders/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mappedOrders)
        }).catch(err => console.error("Bulk orders upload error", err));

        // Notification for orders upload
        setNotifications(prev => [{
          id: `upload-orders-${Date.now()}`,
          type: 'success',
          title: 'Pedidos Cargados',
          message: `Se han importado ${mappedOrders.length} pedidos exitosamente.`,
          timestamp: new Date(),
          read: false
        }, ...prev]);

        alert('Pedidos cargados exitosamente');
      } else {
        const mappedShipments: Shipment[] = data.map((row, index) => ({
          id: String(Date.now() + index),
          modo: String(row.Modo || row.MODO || '').toLowerCase().includes('aereo') ? 'aereo' : 'maritimo',
          referencia: row.Referencia || row['N° de referencia'] || row.REFERENCIA || 'N/A',
          expedidor: row.Expedidor || row.EXPEDIDOR || 'N/A',
          consignatario: row.Consignatario || row.CONSIGNATARIO || 'Luz y Fuerza de San Lorenzo SA de CV',
          origen: row.Origen || row.ORIGEN || 'N/A',
          destino: row.Destino || row.DESTINO || 'N/A',
          // Detailed fields
          referenciaRemitente: String(row['Referencia del remitente'] || row['REFERENCIA DEL REMITENTE'] || ''),
          etd: String(row.Etd || row.ETD || ''),
          atd: String(row.Atd || row.ATD || ''),
          eta: String(row.Eta || row.ETA || row['Hora estimada'] || ''),
          ata: String(row.Ata || row.ATA || ''),
          numPedido: String(row['Número de pedido'] || row['NÚMERO DE PEDIDO'] || ''),
          peso: String(row.Peso || row.PESO || ''),
          volumen: String(row.Volumen || row.VOLUMEN || ''),
          cantidad: String(row.Cantidad || row.CANTIDAD || ''),
          incoterms: String(row.Incoterms || row.INCOTERMS || ''),
          tipoLanzamiento: String(row['Tipo de lanzamiento'] || row['TIPO DE LANZAMIENTO'] || ''),
          aBordo: String(row['A bordo'] || row['A BORDO'] || ''),
          descripcionMercancia: String(row['Descripción de la mercancía'] || row['DESCRIPCIÓN DE LA MERCANCÍA'] || ''),
          recogidaDesde: String(row['Recogida desde'] || row['RECOGIDA DESDE'] || ''),
          entregarA: String(row['Entregar a'] || row['ENTREGAR A'] || ''),
          fechaRealRecogida: String(row['Fecha real de recogida'] || row['FECHA REAL DE RECOGIDA'] || ''),
          mercanciasEntregadas: String(row['Mercancías entregadas'] || row['MERCANCÍAS ENTREGADAS'] || ''),
        }));
        setShipments(mappedShipments);
        setViewMode('shipments');

        // Persist to backend
        fetch('/api/shipments/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mappedShipments)
        }).catch(err => console.error("Bulk shipments upload error", err));

        // Notification for shipments upload
        setNotifications(prev => [{
          id: `upload-shipments-${Date.now()}`,
          type: 'success',
          title: 'Envíos Cargados',
          message: `Se han importado ${mappedShipments.length} envíos logísticos exitosamente.`,
          timestamp: new Date(),
          read: false
        }, ...prev]);

        alert('Envíos cargados exitosamente');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSelectShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setViewMode('shipment-detail');
  };

  const handleUpdateShipment = async (updatedShipment: Shipment) => {
    console.log('📦 Actualizando envío:', updatedShipment.referencia);
    
    // Update local state FIRST
    setShipments(prev => prev.map(s => s.id === updatedShipment.id ? updatedShipment : s));
    setSelectedShipment(updatedShipment);
    
    try {
      // Save to database
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedShipment)
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar en el servidor');
      }
      
      console.log('✅ Envío guardado en BD:', updatedShipment.referencia);
      
      // Show success notification
      setNotifications(prev => [{
        id: `shipment-updated-${Date.now()}`,
        type: 'success',
        title: 'Envío Actualizado',
        message: `El envío ${updatedShipment.referencia} se ha actualizado correctamente.`,
        timestamp: new Date(),
        read: false,
        shipmentId: updatedShipment.id
      }, ...prev]);
      
      // Reload data from server to ensure consistency
      const timestamp = Date.now();
      const freshResponse = await fetch(`/api/shipments?_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (freshResponse.ok) {
        const freshShipments = await freshResponse.json();
        console.log('🔄 Envíos recargados desde BD:', freshShipments.length);
        setShipments(freshShipments);
        
        // Update selected shipment with fresh data
        const freshSelected = freshShipments.find((s: Shipment) => s.id === updatedShipment.id);
        if (freshSelected) {
          setSelectedShipment(freshSelected);
        }
      }
      
    } catch (e) {
      console.error("❌ Error al actualizar envío:", e);
      
      // Show error notification
      setNotifications(prev => [{
        id: `shipment-error-${Date.now()}`,
        type: 'error',
        title: 'Error al Guardar',
        message: `No se pudo actualizar el envío ${updatedShipment.referencia}. Por favor, intenta nuevamente.`,
        timestamp: new Date(),
        read: false
      }, ...prev]);
      
      // Revert local state if save failed
      const original = shipments.find(s => s.id === updatedShipment.id);
      if (original) {
        setShipments(prev => prev.map(s => s.id === updatedShipment.id ? original : s));
        setSelectedShipment(original);
      }
    }
  };

  const handleOrderSubmit = async (orderData: Partial<Order>) => {
    let finalOrder: Order;
    const isEditing = !!orderData.id;
    
    if (orderData.id) {
      // Edit existing
      const existing = orders.find(o => o.id === orderData.id);
      finalOrder = { ...existing, ...orderData } as Order;
      
      console.log('📝 Editando pedido:', orderData.pedido, 'ID:', orderData.id);
      
      // Log edit
      const log: ChangeLog = {
        id: `log-${Date.now()}`,
        entityId: orderData.id,
        entityType: 'order',
        action: 'update',
        description: `Pedido ${orderData.pedido} actualizado manualmente`,
        userId: 'user-1',
        userName: user.name,
        timestamp: new Date().toISOString()
      };
      
      finalOrder.history = [log, ...(finalOrder.history || [])];
      
      // Update local state FIRST
      setOrders(prev => prev.map(o => o.id === orderData.id ? finalOrder : o));
    } else {
      // Create new
      finalOrder = {
        id: `o-${Date.now()}`,
        pedido: orderData.pedido || 'N/A',
        numMaterial: orderData.numMaterial || '',
        material: orderData.material || 'N/A',
        proveedor: orderData.proveedor || 'N/A',
        cantPed: orderData.cantPed || 0,
        valorNeto: orderData.valorNeto || '0.00',
        moneda: orderData.moneda || 'USD',
        estado: orderData.estado || 'Pendiente',
        factura: 'N/A',
        pend: orderData.cantPed || 0,
        transp: orderData.transp || 'maritimo',
        prioridad: orderData.prioridad || 'Media',
        history: [{
          id: `log-${Date.now()}`,
          entityId: `o-${Date.now()}`,
          entityType: 'order',
          action: 'create',
          description: 'Pedido creado manualmente',
          userId: 'user-1',
          userName: user.name,
          timestamp: new Date().toISOString()
        }]
      } as Order;
      
      console.log('➕ Creando nuevo pedido:', orderData.pedido);
      
      // Update local state FIRST
      setOrders(prev => [finalOrder, ...prev]);
    }

    try {
      // Save to database
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalOrder)
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar en el servidor');
      }
      
      console.log('✅ Pedido guardado en BD:', finalOrder.pedido);
      
      // Show success notification
      setNotifications(prev => [{
        id: `order-saved-${Date.now()}`,
        type: 'success',
        title: isEditing ? 'Pedido Actualizado' : 'Pedido Creado',
        message: `El pedido ${finalOrder.pedido} se ha ${isEditing ? 'actualizado' : 'creado'} correctamente.`,
        timestamp: new Date(),
        read: false,
        orderId: finalOrder.id
      }, ...prev]);
      
      // Reload data from server to ensure consistency
      const timestamp = Date.now();
      const freshResponse = await fetch(`/api/orders?_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (freshResponse.ok) {
        const freshOrders = await freshResponse.json();
        console.log('🔄 Datos recargados desde BD:', freshOrders.length, 'pedidos');
        setOrders(freshOrders);
      }
      
    } catch (e) {
      console.error("❌ Error al guardar pedido:", e);
      
      // Show error notification
      setNotifications(prev => [{
        id: `order-error-${Date.now()}`,
        type: 'error',
        title: 'Error al Guardar',
        message: `No se pudo guardar el pedido ${finalOrder.pedido}. Por favor, intenta nuevamente.`,
        timestamp: new Date(),
        read: false
      }, ...prev]);
      
      // Revert local state if save failed
      if (isEditing) {
        const original = orders.find(o => o.id === orderData.id);
        if (original) {
          setOrders(prev => prev.map(o => o.id === orderData.id ? original : o));
        }
      } else {
        setOrders(prev => prev.filter(o => o.id !== finalOrder.id));
      }
    }

    setIsOrderFormOpen(false);
    setEditingOrder(null);
  };

  const handleDuplicateOrder = (order: Order) => {
    const { id, history, docs, ...rest } = order;
    setEditingOrder({
      ...rest,
      pedido: `${rest.pedido} (Copia)`,
    });
    setIsOrderFormOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsOrderFormOpen(true);
  };

  const handleSaveTemplate = (template: OrderTemplate) => {
    setTemplates(prev => [template, ...prev]);
    setNotifications(prev => [{
      id: `tpl-saved-${Date.now()}`,
      type: 'success',
      title: 'Plantilla Guardada',
      message: `La plantilla "${template.name}" ha sido guardada correctamente.`,
      timestamp: new Date(),
      read: false
    }, ...prev]);
  };

  const handleAddInvoice = (order: Order | Order[]) => {
    setEditingShipment(null);
    setSelectedOrderForInvoice(order);
    setIsInvoiceModalOpen(true);
  };

  const handleBulkAddInvoice = (selectedOrders: Order[]) => {
    setEditingShipment(null);
    setSelectedOrderForInvoice(selectedOrders); 
    setIsInvoiceModalOpen(true);
  };

  const handleEditInvoice = (order: Order, invoiceNumber?: string) => {
    if (!invoiceNumber) return;
    
    // Buscar el shipment por número de factura
    const shipmentToEdit = shipments.find(s => 
      (s.referenciaRemitente === invoiceNumber || s.referencia === invoiceNumber) &&
      s.numPedido && s.numPedido.includes(order.pedido)
    );
    
    if (!shipmentToEdit) {
      alert('No se encontró la factura para editar');
      return;
    }
    
    setEditingShipment(shipmentToEdit);
    setSelectedOrderForInvoice(order);
    setIsInvoiceModalOpen(true);
  };

  const handleBulkUpdateStatus = (orderIds: string[], newStatus: string) => {
    setOrders(prev => prev.map(o => orderIds.includes(o.id) ? { ...o, estado: newStatus } : o));
    
    setNotifications(prev => [{
      id: `bulk-status-change-${Date.now()}`,
      type: 'success',
      title: 'Actualización en Lote',
      message: `Se ha actualizado el estado de ${orderIds.length} pedidos a: ${newStatus}`,
      timestamp: new Date(),
      read: false
    }, ...prev]);
    
    alert(`Se han actualizado ${orderIds.length} pedidos.`);
  };

  const handleBulkDelete = (orderIds: string[]) => {
    setOrders(prev => prev.filter(o => !orderIds.includes(o.id)));
    
    setNotifications(prev => [{
      id: `bulk-delete-${Date.now()}`,
      type: 'warning',
      title: 'Eliminación en Lote',
      message: `Se han eliminado ${orderIds.length} pedidos del sistema.`,
      timestamp: new Date(),
      read: false
    }, ...prev]);
  };

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, estado: newStatus } : o));
    
    // 4. Status change notification
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setNotifications(prev => [{
        id: `status-change-${Date.now()}`,
        type: 'success',
        title: 'Estado Actualizado',
        message: `El pedido ${order.pedido} ha cambiado a: ${newStatus}`,
        timestamp: new Date(),
        read: false,
        orderId: orderId
      }, ...prev]);
    }
    
    alert(`Estado del pedido actualizado a: ${newStatus}`);
  };

  const reloadOrdersAndShipments = async () => {
    const timestamp = Date.now();
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };

    const [freshOrdersResponse, freshShipmentsResponse] = await Promise.all([
      fetch(`/api/orders?_t=${timestamp}`, { headers }),
      fetch(`/api/shipments?_t=${timestamp}`, { headers })
    ]);

    if (freshOrdersResponse.ok) {
      const freshOrders = await freshOrdersResponse.json();
      console.log('✅ Pedidos recargados:', freshOrders.length);
      setOrders(freshOrders);
    }

    if (freshShipmentsResponse.ok) {
      const freshShipments = await freshShipmentsResponse.json();
      console.log('✅ Envíos recargados:', freshShipments.length);
      setShipments(freshShipments);
    }
  };

  const clearInvoiceDataFromOrder = (order: Order): Order => ({
    ...order,
    factura: '',
    fechaFactura: '',
    prioridad: '',
    etd: '',
    eta: '',
    transp: '-',
    estatusLogistico: '',
    agenteAduanal: '',
    pend: order.cantPed,
    cantidadFacturada: 0,
    precioNetoUnitario: '',
    estado: 'Pendiente'
  });

  const handleDeleteInvoices = async (orderIds: string[]) => {
    const targetOrders = orders.filter(order => orderIds.includes(order.id) && order.factura?.trim());
    if (targetOrders.length === 0) {
      alert('Los pedidos seleccionados no tienen factura registrada.');
      return;
    }

    const targetOrderIds = new Set(targetOrders.map(order => order.id));
    const targetInvoices = Array.from(new Set(targetOrders.map(order => order.factura).filter(Boolean)));

    const updatedOrders = orders.map(order => (
      targetOrderIds.has(order.id) ? clearInvoiceDataFromOrder(order) : order
    ));

    const shipmentsToDelete = new Set<string>();
    const shipmentsToUpsert = new Map<string, Shipment>();

    targetInvoices.forEach(invoiceNumber => {
      const shipmentMatches = shipments.filter(shipment =>
        shipment.referenciaRemitente === invoiceNumber || shipment.referencia === invoiceNumber
      );

      shipmentMatches.forEach(shipment => {
        const invoiceOrders = orders.filter(order => order.factura === invoiceNumber);
        const remainingOrders = invoiceOrders.filter(order => !targetOrderIds.has(order.id));

        if (remainingOrders.length === 0) {
          shipmentsToDelete.add(shipment.id);
          return;
        }

        shipmentsToUpsert.set(shipment.id, {
          ...shipment,
          expedidor: remainingOrders[0]?.proveedor || shipment.expedidor,
          numPedido: Array.from(new Set(remainingOrders.map(order => order.pedido))).join(', '),
          cantidad: String(remainingOrders.length),
          descripcionMercancia: remainingOrders.map(order => order.material).join(', ').substring(0, 100) + '...',
          history: [
            ...(shipment.history || []),
            {
              id: `log-${Date.now()}-${shipment.id}`,
              entityId: shipment.id,
              entityType: 'shipment',
              action: 'update',
              description: `Factura ${invoiceNumber} ajustada por eliminación de ítems`,
              userId: 'user-1',
              userName: user.name,
              timestamp: new Date().toISOString()
            }
          ]
        });
      });
    });

    setOrders(updatedOrders);
    setShipments(prev => prev
      .filter(shipment => !shipmentsToDelete.has(shipment.id))
      .map(shipment => shipmentsToUpsert.get(shipment.id) || shipment)
    );

    try {
      await fetch('/api/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrders)
      });

      await Promise.all([
        ...Array.from(shipmentsToUpsert.values()).map(shipment =>
          fetch(`/api/shipments/${shipment.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shipment)
          })
        ),
        ...Array.from(shipmentsToDelete).map(shipmentId =>
          fetch(`/api/shipments/${shipmentId}`, {
            method: 'DELETE'
          })
        )
      ]);

      try {
        await fetch('/api/sync/excel', {
          method: 'POST'
        });
      } catch (syncError) {
        console.warn('⚠️ No se pudo escribir al Excel tras borrar la factura:', syncError);
      }

      await reloadOrdersAndShipments();

      setNotifications(prev => [{
        id: `deleted-invoice-${Date.now()}`,
        type: 'success',
        title: 'Facturas Eliminadas',
        message: `Se eliminaron las facturas de ${targetOrders.length} pedido(s).`,
        timestamp: new Date(),
        read: false
      }, ...prev]);

      alert(`✅ Se eliminaron las facturas de ${targetOrders.length} pedido(s).`);
    } catch (error) {
      console.error('Error al borrar facturas:', error);
      alert('Error al borrar las facturas seleccionadas.');
    }
  };

  const handleSaveInvoice = async (invoiceData: any) => {
    const { invoiceNumber, invoiceDate, priority, etd, eta, loadingPort, dischargePort, reference, transportMode, status, customsAgent, selectedOrders, quantities, unitPrices, files, shipmentId } = invoiceData;

    // Modo edición: actualizar shipment existente
    if (shipmentId) {
      // 1. Actualizar los pedidos relacionados con la información de la factura
      const updatedOrders = orders.map(o => {
        const selected = selectedOrders.find((so: Order) => so.id === o.id);
        if (selected) {
          const facturado = quantities[o.id] || 0;
          const newUnitPrice = unitPrices[o.id];
          const symbol = o.moneda === 'USD' ? '$' : o.moneda === 'EUR' ? '€' : '';
          const formattedUnitPrice = symbol ? `${symbol} ${newUnitPrice.toFixed(2)}` : newUnitPrice.toFixed(2);
          
          return {
            ...o,
            factura: invoiceNumber,
            fechaFactura: invoiceDate,
            prioridad: priority,
            etd,
            eta,
            estatusLogistico: status,
            agenteAduanal: customsAgent,
            transp: transportMode,
            pend: Math.max(0, o.cantPed - facturado),
            cantidadFacturada: facturado,
            precioNetoUnitario: formattedUnitPrice,
            estado: (o.cantPed - facturado) <= 0 ? 'En Planta' : 'Pendiente'
          };
        }
        return o;
      });
      
      console.log('📝 Actualizando', selectedOrders.length, 'pedidos con datos de factura');
      setOrders(updatedOrders);

      const currentShipment = shipments.find(s => s.id === shipmentId);
      const updatedShipment = currentShipment ? {
        ...currentShipment,
        modo: transportMode,
        referencia: reference || invoiceNumber,
        referenciaRemitente: invoiceNumber,
        fechaFactura: invoiceDate,
        prioridad: priority,
        origen: loadingPort || 'N/A',
        destino: dischargePort || 'N/A',
        estado: status,
        customsAgent: customsAgent || 'No asignado',
        puertoCarga: loadingPort,
        puertoDescarga: dischargePort,
        puertoOrigen: loadingPort,
        puertoDestino: dischargePort,
        agenteAduana: customsAgent || 'No asignado',
        tipoTransporte: transportMode,
        etd,
        eta,
        numPedido: Array.from(new Set(selectedOrders.map((so: Order) => so.pedido))).join(', '),
        cantidad: String(selectedOrders.length),
        descripcionMercancia: selectedOrders.map((so: Order) => so.material).join(', ').substring(0, 100) + '...',
        history: [
          ...(currentShipment.history || []),
          {
            id: `log-${Date.now()}`,
            entityId: shipmentId,
            entityType: 'shipment',
            action: 'update',
            description: `Factura ${invoiceNumber} actualizada`,
            userId: 'user-1',
            userName: user.name,
            timestamp: new Date().toISOString()
          }
        ]
      } : null;

      if (updatedShipment) {
        setShipments(prev => prev.map(s => s.id === shipmentId ? updatedShipment : s));
      }

      // 3. Persist to backend
      try {
        // Guardar pedidos actualizados
        console.log('💾 Guardando pedidos en base de datos...');
        await fetch('/api/orders/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedOrders)
        });
        console.log('✅ Pedidos guardados en BD');

        // Guardar shipment actualizado
        if (updatedShipment) {
          await fetch(`/api/shipments/${shipmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedShipment)
          });
        }

        console.log('🔄 Recargando datos desde BD...');
        await reloadOrdersAndShipments();

        // Notificación de actualización
        setNotifications(prev => [{
          id: `updated-shipment-${Date.now()}`,
          type: 'success',
          title: 'Factura Actualizada',
          message: `Se actualizó la factura ${invoiceNumber} y ${selectedOrders.length} pedido(s).`,
          timestamp: new Date(),
          read: false
        }, ...prev]);

        alert(`✅ Factura actualizada exitosamente\n\n📝 ${selectedOrders.length} pedido(s) actualizado(s)`);

      } catch (error) {
        console.error('Error al actualizar la factura:', error);
        alert('Error al actualizar la factura');
      }
      return;
    }

    // 1. Update orders
    const updatedOrders = orders.map(o => {
      const selected = selectedOrders.find((so: Order) => so.id === o.id);
      if (selected) {
        const facturado = quantities[o.id] || 0;
        const newUnitPrice = unitPrices[o.id];
        const symbol = o.moneda === 'USD' ? '$' : o.moneda === 'EUR' ? '€' : '';
        const formattedUnitPrice = symbol ? `${symbol} ${newUnitPrice.toFixed(2)}` : newUnitPrice.toFixed(2);
        
        return {
          ...o,
          factura: invoiceNumber,
          fechaFactura: invoiceDate,
          prioridad: priority,
          etd,
          eta,
          transp: transportMode,
          estatusLogistico: status,
          agenteAduanal: customsAgent,
          pend: Math.max(0, o.pend - facturado),
          cantidadFacturada: (o.cantidadFacturada || 0) + facturado,
          precioNetoUnitario: formattedUnitPrice,
          estado: (o.pend - facturado) <= 0 ? 'En Planta' : 'Pendiente'
        };
      }
      return o;
    });
    setOrders(updatedOrders);

    // 2. Create new shipment
    const newShipmentId = String(Date.now());
    const creationLog: ChangeLog = {
      id: `log-${Date.now()}`,
      entityId: newShipmentId,
      entityType: 'shipment',
      action: 'create',
      description: `Envío creado desde factura ${invoiceNumber}`,
      userId: 'user-1',
      userName: 'Admin Usuario',
      timestamp: new Date().toISOString()
    };

    const newShipment: Shipment = {
      id: newShipmentId,
      modo: transportMode,
      referencia: reference || invoiceNumber,
      expedidor: selectedOrders[0].proveedor,
      consignatario: 'Luz y Fuerza de San Lorenzo SA de CV',
      origen: loadingPort || 'N/A',
      destino: dischargePort || 'N/A',
      estado: status,
      fechaFactura: invoiceDate,
      prioridad: priority,
      customsAgent: customsAgent || 'No asignado',
      puertoCarga: loadingPort,
      puertoDescarga: dischargePort,
      puertoOrigen: loadingPort,
      puertoDestino: dischargePort,
      agenteAduana: customsAgent || 'No asignado',
      tipoTransporte: transportMode,
      referenciaRemitente: invoiceNumber,
      etd,
      eta,
      numPedido: Array.from(new Set(selectedOrders.map((so: Order) => so.pedido))).join(', '),
      cantidad: String(selectedOrders.length),
      descripcionMercancia: selectedOrders.map((so: Order) => so.material).join(', ').substring(0, 100) + '...',
      docs: files.map((f: File) => ({
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: f.name,
        type: f.name.toLowerCase().includes('factura') ? 'Invoice' : 
              f.name.toLowerCase().includes('bl') ? 'BL' : 
              f.name.toLowerCase().includes('packing') ? 'Packing List' : 'Other',
        uploadDate: new Date().toLocaleDateString('es-ES'),
        size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
        url: URL.createObjectURL(f),
        status: 'received'
      })),
      history: [creationLog]
    };
    setShipments(prev => [newShipment, ...prev]);

    // 3. Persist to backend
    try {
      // Save updated orders
      await fetch('/api/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrders)
      });

      // Save new shipment
      await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShipment)
      });

      console.log('🔄 Recargando datos desde BD...');
      await reloadOrdersAndShipments();

      // 🔄 Sincronización bidireccional automática para escribir al Excel
      console.log('🔄 Escribiendo cambios al Excel...');
      try {
        await fetch('/api/sync/excel', {
          method: 'POST'
        });
        console.log('✅ Excel actualizado con nuevos datos de factura');
      } catch (syncError) {
        console.warn('⚠️ No se pudo escribir al Excel (puede estar abierto):', syncError);
        // No detener el flujo si falla la escritura al Excel
      }

      // Notification for new shipment
      setNotifications(prev => [{
        id: `new-shipment-${Date.now()}`,
        type: 'success',
        title: 'Nuevo Envío Generado',
        message: `Se ha creado el envío ${newShipment.referencia} a partir de la factura ${invoiceNumber}.`,
        timestamp: new Date(),
        read: false,
        shipmentId: newShipment.id
      }, ...prev]);

      alert('Factura y datos logísticos guardados correctamente. Se ha generado un nuevo envío.');
      setViewMode('shipments');
    } catch (error) {
      console.error('Error guardando factura:', error);
      alert('Error al guardar los datos. Por favor, intente nuevamente.');
    }
  };

  const applyAdvancedFilters = (data: any[], filters: AdvancedFilterState | null) => {
    if (!filters) return data;
    
    return data.filter(item => {
      // 1. Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const searchString = Object.values(item).join(' ').toLowerCase();
        if (!searchString.includes(query)) return false;
      }
      
      // 2. Statuses
      if (filters.statuses.length > 0) {
        const itemStatus = item.estado || 'En Tránsito';
        if (!filters.statuses.includes(itemStatus)) return false;
      }
      
      // 3. Suppliers (for orders)
      if (filters.suppliers.length > 0 && item.proveedor) {
        if (!filters.suppliers.includes(item.proveedor)) return false;
      }
      
      // 4. Shippers (for shipments)
      if (filters.shippers.length > 0 && item.expedidor) {
        if (!filters.shippers.includes(item.expedidor)) return false;
      }
      
      // 5. Date Range
      if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
        const dateVal = item[filters.dateRange.type];
        if (!dateVal) return false;
        
        const date = new Date(dateVal);
        const start = new Date(filters.dateRange.start);
        const end = new Date(filters.dateRange.end);
        
        if (date < start || date > end) return false;
      }
      
      return true;
    });
  };

  const filteredShipments = applyAdvancedFilters(
    shipmentFilter === 'arrived' 
      ? shipments.filter(s => s.eta && new Date(s.eta) < new Date()) 
      : shipments,
    shipmentAdvancedFilters
  );

  const filteredOrders = applyAdvancedFilters(
    orderFilter === 'in-stock'
      ? orders.filter(o => o.estado === 'En Planta')
      : orders,
    orderAdvancedFilters
  );

  const stats = [
    { 
      label: 'En tránsito', 
      value: shipments.length, 
      unit: 'Envíos', 
      icon: <Truck size={18} className="text-lufussa-teal" />, 
      onClick: () => {
        setShipmentFilter('all');
        setViewMode('shipments');
      } 
    },
    { 
      label: 'Llegada', 
      value: shipments.filter(s => s.eta && new Date(s.eta) < new Date()).length, 
      unit: 'Envíos', 
      icon: <CheckCircle2 size={18} className="text-lufussa-teal" />,
      onClick: () => {
        setShipmentFilter('arrived');
        setViewMode('shipments');
      }
    },
    { 
      label: 'Aviso', 
      value: orders.length, 
      unit: 'Pedidos', 
      icon: <Package size={18} className="text-lufussa-teal" />, 
      onClick: () => {
        setOrderFilter('all');
        setViewMode('orders');
      } 
    },
    { 
      label: 'En stock', 
      value: orders.filter(o => o.estado === 'En Planta').length, 
      unit: 'Pedidos', 
      icon: <Package size={18} className="text-lufussa-teal" />,
      onClick: () => {
        setOrderFilter('in-stock');
        setViewMode('orders');
      }
    },
  ];

  // KPI Calculations
  const kpiData = React.useMemo(() => {
    const now = new Date();
    
    // Avg Transit Time (Mock logic if dates are missing)
    const transitTimes = shipments
      .filter(s => s.etd && s.eta)
      .map(s => {
        const start = new Date(s.etd!);
        const end = new Date(s.eta!);
        return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      });
    
    const avgTransitTime = transitTimes.length > 0 
      ? Math.round(transitTimes.reduce((a, b) => a + b, 0) / transitTimes.length)
      : 0; // Default fallback

    // Delayed Count
    const delayedShipments = shipments.filter(s => {
      if (!s.eta) return false;
      const etaDate = new Date(s.eta);
      return etaDate < now && s.estado !== 'Entregado' && s.estado !== 'Arribado';
    });
    const delayedCount = delayedShipments.length;

    // On-Time Rate
    const arrivedShipments = shipments.filter(s => s.ata);
    const onTimeShipments = arrivedShipments.filter(s => {
      if (!s.eta || !s.ata) return true;
      return new Date(s.ata) <= new Date(s.eta);
    });
    const onTimeRate = arrivedShipments.length > 0
      ? Math.round((onTimeShipments.length / arrivedShipments.length) * 100)
      : 0;

    // Critical Count & List
    const criticalShipments = shipments.filter(s => {
      if (!s.eta) return false;
      const etaDate = new Date(s.eta);
      const diffDays = (etaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return (diffDays < 2 && s.estado !== 'Entregado') || (etaDate < now && s.estado !== 'Entregado' && s.estado !== 'Arribado');
    });
    const criticalCount = criticalShipments.length;

    return { 
      stats: { avgTransitTime, delayedCount, onTimeRate, criticalCount },
      criticalShipments 
    };
  }, [shipments]);

  const trendData = React.useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        name: months[d.getMonth()],
        month: d.getMonth(),
        year: d.getFullYear(),
        envios: 0,
        pedidos: 0
      });
    }

    shipments.forEach(s => {
      if (!s.etd) return;
      const d = new Date(s.etd);
      const monthIdx = last6Months.findIndex(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (monthIdx !== -1) last6Months[monthIdx].envios++;
    });

    orders.forEach(o => {
      if (!o.fechaFactura) return;
      const d = new Date(o.fechaFactura);
      const monthIdx = last6Months.findIndex(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (monthIdx !== -1) last6Months[monthIdx].pedidos++;
    });

    return last6Months;
  }, [shipments, orders]);

  const modeData = React.useMemo(() => {
    const counts = {
      maritimo: shipments.filter(s => s.modo?.toLowerCase().includes('mar') || s.modo?.toLowerCase().includes('sea')).length,
      aereo: shipments.filter(s => s.modo?.toLowerCase().includes('aer') || s.modo?.toLowerCase().includes('air')).length,
      terrestre: shipments.filter(s => s.modo?.toLowerCase().includes('terr') || s.modo?.toLowerCase().includes('road') || s.modo?.toLowerCase().includes('truck')).length,
    };

    return [
      { name: 'Marítimo', value: counts.maritimo },
      { name: 'Aéreo', value: counts.aereo },
      { name: 'Terrestre', value: counts.terrestre },
    ].filter(d => d.value > 0);
  }, [shipments]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".xlsx, .xls" 
        className="hidden" 
      />

      {/* Invoice Modal */}
      <InvoiceModal 
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
        }}
        order={selectedOrderForInvoice}
        allOrders={orders}
        onSave={handleSaveInvoice}
        editingShipment={editingShipment}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
          >
            <Menu size={24} />
          </button>
          <div 
            onClick={() => setViewMode('dashboard')}
            className="cursor-pointer"
          >
            <Logo 
              className="scale-75 origin-left" 
              companyName={systemSettings.companyName}
              logoUrl={systemSettings.logoUrl}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-slate-500">
            {isSearchOpen && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                className="relative"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-4 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                  autoFocus
                />
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </motion.div>
            )}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isSearchOpen ? "bg-lufussa-teal/10 text-lufussa-teal" : "hover:bg-slate-100"
              )}
            >
              <Search size={20} />
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsShortcutsOpen(!isShortcutsOpen)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isShortcutsOpen ? "bg-lufussa-teal/10 text-lufussa-teal" : "hover:bg-slate-100"
                )}
                title="Atajos de Teclado"
              >
                <Keyboard size={20} />
              </button>

              <AnimatePresence>
                {isShortcutsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsShortcutsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h4 className="font-bold text-slate-800 text-sm">Atajos de Teclado</h4>
                      </div>
                      <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
                        <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</p>
                        {[
                          { key: 'Ctrl + N', desc: 'Nuevo Pedido/Envío' },
                          { key: 'Ctrl + S', desc: 'Sincronizar (Backup)' },
                          { key: 'Ctrl + F', desc: 'Buscar' },
                          { key: 'Ctrl + E', desc: 'Exportar a Excel' },
                          { key: '/', desc: 'Foco en Búsqueda' },
                          { key: '?', desc: 'Ayuda de Atajos' },
                          { key: 'Esc', desc: 'Cerrar Modales' },
                        ].map((s, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                            <span className="text-xs text-slate-600">{s.desc}</span>
                            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-500">{s.key}</kbd>
                          </div>
                        ))}

                        <p className="px-3 py-1 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Navegación</p>
                        {[
                          { key: 'G + D', desc: 'Ir a Panel' },
                          { key: 'G + S', desc: 'Ir a Envíos' },
                          { key: 'G + O', desc: 'Ir a Pedidos' },
                          { key: 'G + R', desc: 'Ir a Reportes' },
                          { key: 'G + C', desc: 'Ir a Configuración' },
                          { key: 'M', desc: 'Alternar Menú' },
                          { key: 'F', desc: 'Pantalla Completa' },
                          { key: 'B', desc: 'Notificaciones' },
                        ].map((s, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                            <span className="text-xs text-slate-600">{s.desc}</span>
                            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono font-bold text-slate-500">{s.key}</kbd>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={toggleFullscreen}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isFullscreen ? "bg-lufussa-teal/10 text-lufussa-teal" : "hover:bg-slate-100"
              )}
              title="Pantalla Completa"
            >
              <Maximize2 size={20} />
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isNotificationsOpen ? "bg-lufussa-teal/10 text-lufussa-teal" : "hover:bg-slate-100"
                )}
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 bg-lufussa-teal text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                  {notifications.length}
                </span>
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsNotificationsOpen(false)} 
                      id="notifications-overlay"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 overflow-hidden"
                      id="notifications-dropdown"
                    >
                      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <h4 className="font-bold text-slate-800">Notificaciones</h4>
                        {notifications.length > 0 && (
                          <button 
                            onClick={clearNotifications}
                            className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell size={32} className="mx-auto text-slate-200 mb-2" />
                            <p className="text-sm text-slate-400">No tienes notificaciones nuevas</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                markNotificationAsRead(n.id);
                                if (n.shipmentId) {
                                  const shipment = shipments.find(s => s.id === n.shipmentId);
                                  if (shipment) handleSelectShipment(shipment);
                                } else if (n.orderId) {
                                  setViewMode('orders');
                                }
                                setIsNotificationsOpen(false);
                              }}
                              className={cn(
                                "p-4 border-b border-slate-50 last:border-0 transition-colors cursor-pointer flex gap-3",
                                n.read ? "opacity-60 bg-white" : "bg-lufussa-teal/5 hover:bg-lufussa-teal/10"
                              )}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                n.type === 'info' ? "bg-blue-100 text-blue-600" :
                                n.type === 'warning' ? "bg-amber-100 text-amber-600" :
                                n.type === 'error' ? "bg-red-100 text-red-600" :
                                "bg-emerald-100 text-emerald-600"
                              )}>
                                {n.type === 'info' && <Clock size={14} />}
                                {n.type === 'warning' && <AlertTriangle size={14} />}
                                {n.type === 'error' && <AlertTriangle size={14} />}
                                {n.type === 'success' && <CheckCircle2 size={14} />}
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-800">{n.title}</p>
                                <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                  <Clock size={10} />
                                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-3 text-center border-t border-slate-100">
                        <button className="text-xs font-bold text-lufussa-teal hover:underline">
                          Ver historial completo
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={() => onUpdateSettings({ ...systemSettings, language: systemSettings.language === 'es' ? 'en' : 'es' })}
              className="border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-bold hover:bg-slate-50 transition-colors uppercase"
            >
              {systemSettings.language}
            </button>
          </div>

          <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />

          {user.role === 'admin' && (
            <button 
              onClick={() => setViewMode('settings')}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === 'settings' ? "bg-lufussa-teal text-white" : "text-slate-400 hover:bg-slate-100 hover:text-lufussa-teal"
              )}
            >
              <Settings size={20} />
            </button>
          )}

          <button className="flex items-center gap-3 text-left hover:bg-slate-50 p-1 rounded-lg transition-colors">
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-700 leading-tight">{user.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{systemSettings.companyName}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>
        </div>
      </header>

      {/* Sidebar Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-800 text-white">
                <div className="flex items-center gap-3">
                   <button onClick={() => setIsMenuOpen(false)} className="p-1 hover:bg-white/10 rounded">
                     <X size={24} />
                   </button>
                   <Logo 
                     className="invert brightness-0" 
                     companyName={systemSettings.companyName}
                     logoUrl={systemSettings.logoUrl}
                   />
                </div>
              </div>
              
              <div className="p-4 space-y-6 overflow-y-auto flex-1">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Reenvío</p>
                  
                  <button 
                    onClick={() => { setViewMode('dashboard'); setIsMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-start gap-4 p-3 rounded-xl transition-colors group",
                      viewMode === 'dashboard' ? "bg-slate-100" : "hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      viewMode === 'dashboard' ? "bg-lufussa-teal text-white" : "bg-slate-100 group-hover:bg-lufussa-teal group-hover:text-white"
                    )}>
                      <LayoutGrid size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-700">Panel</p>
                      <p className="text-xs text-slate-500">Panel de control en tiempo real para envíos y pedidos</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => { setViewMode('orders'); setIsMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-start gap-4 p-3 rounded-xl transition-colors group",
                      viewMode === 'orders' ? "bg-slate-100" : "hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      viewMode === 'orders' ? "bg-lufussa-teal text-white" : "bg-slate-100 group-hover:bg-lufussa-teal group-hover:text-white"
                    )}>
                      <Package size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-700">Pedidos</p>
                      <p className="text-xs text-slate-500">Organice los pedidos en grupos de fácil navegación</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => { setViewMode('shipments'); setIsMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-start gap-4 p-3 rounded-xl transition-colors group",
                      viewMode === 'shipments' ? "bg-slate-100" : "hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      viewMode === 'shipments' ? "bg-lufussa-teal text-white" : "bg-slate-100 group-hover:bg-lufussa-teal group-hover:text-white"
                    )}>
                      <Truck size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-700">Envíos</p>
                      <p className="text-xs text-slate-500">Utilice Envíos para programar y administrar rápidamente sus envíos</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => { setViewMode('reports'); setIsMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-start gap-4 p-3 rounded-xl transition-colors group",
                      viewMode === 'reports' ? "bg-slate-100" : "hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      viewMode === 'reports' ? "bg-lufussa-teal text-white" : "bg-slate-100 group-hover:bg-lufussa-teal group-hover:text-white"
                    )}>
                      <BarChart3 size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-700">Reportes</p>
                      <p className="text-xs text-slate-500">Genere y descargue reportes ejecutivos detallados</p>
                    </div>
                  </button>

                  {user.role === 'admin' && (
                    <button 
                      onClick={() => { setViewMode('settings'); setIsMenuOpen(false); }}
                      className={cn(
                        "w-full flex items-start gap-4 p-3 rounded-xl transition-colors group",
                        viewMode === 'settings' ? "bg-slate-100" : "hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        viewMode === 'settings' ? "bg-lufussa-teal text-white" : "bg-slate-100 group-hover:bg-lufussa-teal group-hover:text-white"
                      )}>
                        <Settings size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-700">Configuración</p>
                        <p className="text-xs text-slate-500">Administre usuarios y preferencias del sistema</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100">
                <button 
                  onClick={onLogout}
                  className="w-full py-2 text-sm text-slate-500 hover:text-red-600 transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={cn(
        "flex-1 max-w-7xl mx-auto w-full space-y-8",
        isMobile ? "p-4" : "p-8"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {viewMode !== 'dashboard' && (
                <button 
                  onClick={() => setViewMode(viewMode === 'shipment-detail' ? 'shipments' : 'dashboard')}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <h2 className={cn(
                "font-bold text-slate-800",
                isMobile ? "text-xl" : "text-2xl"
              )}>
                {viewMode === 'dashboard' ? 'Administrar el panel de control' : 
                 viewMode === 'shipments' ? 'Seguimiento de Envíos' : 
                 viewMode === 'orders' ? 'Gestión de Pedidos' : 
                 viewMode === 'reports' ? 'Dashboard y Reportes' : 
                 viewMode === 'settings' ? 'Configuración del Sistema' : 'Detalles del Envío'}
              </h2>
            </div>
            <p className="text-slate-500 text-sm">
              {viewMode === 'dashboard' ? 'Visibilidad y análisis en tiempo real para tomar decisiones logísticas más inteligentes' :
               viewMode === 'shipment-detail' ? 'Información completa sobre el embarque seleccionado' :
               viewMode === 'reports' ? 'Análisis detallado de la cadena de suministro y exportación de datos' :
               viewMode === 'settings' ? 'Panel de administración para usuarios y preferencias' :
               'Información detallada sobre el estado y ubicación de sus mercancías'}
            </p>
          </div>

          {viewMode !== 'dashboard' && viewMode !== 'shipment-detail' && user.role === 'admin' && (
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  console.log('🖱️ Click en botón de sincronización detectado');
                  handleSyncFromExcel();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-lufussa-teal text-white rounded-lg hover:bg-opacity-90 transition-all text-sm font-semibold shadow-lg shadow-lufussa-teal/20 cursor-pointer"
                title="Importar datos desde Excel y actualizar Excel con datos del sistema"
              >
                <FileSpreadsheet size={18} />
                Sincronizar importaciones.xlsx
              </button>
              <button 
                onClick={() => handleExportToExcel()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-opacity-90 transition-all text-sm font-semibold shadow-lg shadow-emerald-600/20"
                title="Exportar tus cambios al Excel (SOLO lo que modificaste)"
              >
                <Download size={18} />
                Exportar cambios a Excel
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-opacity-90 transition-all text-sm font-semibold shadow-lg shadow-slate-600/20"
                title="Cargar un archivo Excel diferente"
              >
                <Upload size={18} />
                Cargar otro Excel
              </button>
            </div>
          )}
        </div>

        {viewMode === 'dashboard' ? (
          <>
            {/* KPI Section */}
            <KPISection 
              stats={kpiData.stats}
              trendData={trendData}
              modeData={modeData}
              criticalShipments={kpiData.criticalShipments}
              onSelectShipment={handleSelectShipment}
              isMobile={isMobile}
            />

            {/* AI Insights Section */}
            <AIInsights 
              insights={aiInsights}
              isLoading={isAIInsightsLoading}
              onGenerate={generateAIInsights}
              onAction={(insight) => {
                setNotifications(prev => [{
                  id: `ai-rec-${Date.now()}`,
                  type: 'info',
                  title: `Recomendación: ${insight.title}`,
                  message: insight.recommendation || insight.content,
                  timestamp: new Date(),
                  read: false
                }, ...prev]);
                setIsNotificationsOpen(true);
              }}
            />

            {/* Stats Grid - Secondary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={stat.onClick}
                  className={cn(
                    "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative group",
                    stat.onClick && "cursor-pointer hover:border-lufussa-teal/50"
                  )}
                >
                  <div className="absolute top-4 right-4 text-slate-300 group-hover:text-lufussa-teal transition-colors">
                    <Info size={16} />
                  </div>
                  <p className="text-slate-700 font-semibold mb-2">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-lufussa-teal">{stat.value}</span>
                    <span className="text-slate-500 font-medium">{stat.unit}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tracking */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-slate-800">Seguimiento de envíos</h3>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <MapPin size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Número de seguimiento Ex. S003"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20 focus:border-lufussa-teal transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 text-slate-300">
                    <CheckCircle2 size={18} />
                    <X size={18} />
                  </div>
                </div>
              </div>

              {/* Favorites */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Favoritos</h3>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTab('envios')}
                      className={cn(
                        "px-4 py-1.5 text-xs font-semibold rounded-md transition-all",
                        activeTab === 'envios' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Envíos
                    </button>
                    <button
                      onClick={() => setActiveTab('pedidos')}
                      className={cn(
                        "px-4 py-1.5 text-xs font-semibold rounded-md transition-all",
                        activeTab === 'pedidos' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Pedidos
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <p className="text-sm">No hay favoritos para mostrar.</p>
                </div>
              </div>
            </div>
          </>
        ) : viewMode === 'shipments' ? (
          <div className="space-y-6">
            <AdvancedFilters 
              type="shipments"
              onFilterChange={setShipmentAdvancedFilters}
              availableStatuses={Array.from(new Set(shipments.map(s => s.estado || 'En Tránsito')))}
              availableSuppliers={[]}
              availableShippers={Array.from(new Set(shipments.map(s => s.expedidor)))}
            />
            <ShipmentsTable 
              shipments={filteredShipments} 
              onSelectShipment={handleSelectShipment} 
              systemSettings={systemSettings}
              isMobile={isMobile}
            />
          </div>
        ) : viewMode === 'orders' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Gestión de Pedidos</h2>
              {user.role === 'admin' && (
                <button 
                  onClick={() => {
                    setEditingOrder(null);
                    setIsOrderFormOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-lufussa-teal text-white rounded-xl hover:bg-opacity-90 transition-all text-xs font-bold shadow-lg shadow-lufussa-teal/20"
                >
                  <Plus size={16} />
                  NUEVO PEDIDO
                </button>
              )}
            </div>
            <AdvancedFilters 
              type="orders"
              onFilterChange={setOrderAdvancedFilters}
              availableStatuses={Array.from(new Set(orders.map(o => o.estado)))}
              availableSuppliers={Array.from(new Set(orders.map(o => o.proveedor)))}
              availableShippers={[]}
            />
            <OrdersTable 
              orders={filteredOrders} 
              onAddInvoice={handleAddInvoice} 
              onBulkAddInvoice={handleBulkAddInvoice}
              onDeleteInvoice={(order) => handleDeleteInvoices([order.id])}
              onBulkDeleteInvoices={handleDeleteInvoices}
              onUpdateStatus={handleUpdateStatus}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              onBulkDelete={handleBulkDelete}
              onDuplicate={handleDuplicateOrder}
              onEdit={handleEditOrder}
              systemSettings={systemSettings}
              isMobile={isMobile}
              shipments={shipments}
              onEditInvoice={handleEditInvoice}
              userRole={user.role}
            />
          </div>
        ) : viewMode === 'reports' ? (
          <div className="min-h-[400px]">
            <ReportsView orders={orders} shipments={shipments} isMobile={isMobile} />
          </div>
        ) : viewMode === 'settings' ? (
          <div className="min-h-[400px]">
            <SettingsView 
              currentUser={user} 
              systemSettings={systemSettings} 
              onUpdateSettings={onUpdateSettings}
              backups={backups}
              onCreateBackup={() => handleCreateBackup('Manual')}
              onRestoreBackup={handleRestoreBackup}
              onDownloadBackup={handleDownloadBackup}
              isMobile={isMobile}
            />
          </div>
        ) : viewMode === 'shipment-detail' && selectedShipment ? (
          <ShipmentDetail 
            shipment={selectedShipment} 
            orders={orders} 
            onBack={() => setViewMode('shipments')} 
            onUpdateShipment={handleUpdateShipment}
            systemSettings={systemSettings}
            isMobile={isMobile}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle className="text-slate-300 mb-4" size={64} />
            <p className="text-slate-600 text-lg font-semibold">Vista no disponible</p>
            <p className="text-slate-400 text-sm mb-6">Por favor, selecciona una vista válida</p>
            <button
              onClick={() => setViewMode('dashboard')}
              className="px-6 py-3 bg-lufussa-teal text-white rounded-xl hover:bg-opacity-90 transition-all font-semibold"
            >
              Volver al Dashboard
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest gap-4">
        <p>Derechos de autor 2026 {systemSettings.companyName} SA de CV</p>
        <p>Todas las fechas y horas mencionadas están en la hora estándar de Greenwich (UTC+00:00).</p>
      </footer>

      {/* Floating Action Buttons (Right) - Mobile Shortcuts */}
      <div className="fixed right-4 bottom-24 flex flex-col gap-4 z-40 sm:hidden">
           <button 
             onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
             className="p-3 bg-white shadow-lg rounded-full text-slate-400 hover:text-lufussa-teal active:scale-95 transition-all border border-slate-100"
             title="Ir al final"
           >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6 6-6"/><path d="m5 16 6 6 6-6"/></svg>
           </button>
           <button 
             onClick={() => setViewMode(viewMode === 'shipments' ? 'orders' : 'shipments')}
             className="p-3 bg-white shadow-lg rounded-full text-slate-400 hover:text-lufussa-teal active:scale-95 transition-all border border-slate-100"
             title="Cambiar Vista"
           >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
           </button>
           <button 
             onClick={() => {
               if (selectedShipment) setSelectedShipment(null);
               else if (viewMode !== 'shipments') setViewMode('shipments');
             }}
             className="p-3 bg-lufussa-teal text-white shadow-lg rounded-full active:scale-95 transition-all"
             title="Volver"
           >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
           </button>
      </div>

      <OrderForm 
        isOpen={isOrderFormOpen}
        onClose={() => {
          setIsOrderFormOpen(false);
          setEditingOrder(null);
        }}
        onSubmit={handleOrderSubmit}
        initialData={editingOrder || undefined}
        templates={templates}
        onSaveTemplate={handleSaveTemplate}
        vendors={vendors}
        pastOrders={orders}
      />
      {/* AI Assistant */}
      <AIAssistant 
        shipments={shipments} 
        orders={orders} 
        onSelectOrder={handleSelectOrderByNumber}
        onSelectShipment={handleSelectShipmentByRef}
      />
    </div>
  );
}

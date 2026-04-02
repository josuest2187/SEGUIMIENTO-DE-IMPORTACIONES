import React, { useState } from 'react';
import { 
  Users, 
  Settings as SettingsIcon, 
  UserPlus, 
  Trash2, 
  Shield, 
  Mail, 
  Building2, 
  Save,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Lock,
  Globe,
  Clock,
  BellRing,
  Eye,
  EyeOff,
  Database,
  Calendar,
  FileSpreadsheet,
  FileText,
  Plus,
  RotateCcw
} from 'lucide-react';
import { User, SystemSettings, ScheduledExport, Backup } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface SettingsViewProps {
  currentUser: User;
  systemSettings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
  backups: Backup[];
  onCreateBackup: () => void;
  onRestoreBackup: (backup: Backup) => void;
  onDownloadBackup: (backup: Backup) => void;
  isMobile?: boolean;
}

export default function SettingsView({ 
  currentUser, 
  systemSettings, 
  onUpdateSettings,
  backups,
  onCreateBackup,
  onRestoreBackup,
  onDownloadBackup,
  isMobile
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'general' | 'exports' | 'backups'>('users');
  const [users, setUsers] = useState<User[]>([]);

  const [scheduledExports, setScheduledExports] = useState<ScheduledExport[]>([]);
  const [isAddingExport, setIsAddingExport] = useState(false);
  const [newExport, setNewExport] = useState({
    name: '',
    frequency: 'diario' as 'diario' | 'semanal' | 'mensual',
    format: 'excel' as 'excel' | 'pdf',
    recipients: ''
  });

  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'user' as 'admin' | 'user', password: '' });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  // Local state for the form to avoid immediate global updates while typing
  const [localSettings, setLocalSettings] = useState<SystemSettings>(systemSettings);

  // Cargar usuarios desde localStorage al montar
  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        // Primero intentar cargar desde la API
        const res = await fetch('/api/users');
        if (res.ok) {
          const usersFromAPI = await res.json();
          setUsers(usersFromAPI);
          // Guardar en localStorage como backup
          localStorage.setItem('lufussa_users', JSON.stringify(usersFromAPI));
          return;
        }
      } catch (error) {
        console.error('Error al cargar usuarios desde API:', error);
      }

      // Si falla la API, cargar desde localStorage
      const savedUsers = localStorage.getItem('lufussa_users');
      if (savedUsers) {
        try {
          const parsedUsers = JSON.parse(savedUsers);
          setUsers(parsedUsers);
        } catch (e) {
          console.error('Error al cargar usuarios:', e);
        }
      } else {
        // Si no hay usuarios guardados, agregar el usuario actual
        if (currentUser) {
          setUsers([currentUser]);
        }
      }
    };

    loadUsers();
  }, []);

  // Asegurar que el usuario actual siempre esté en la lista
  React.useEffect(() => {
    if (currentUser && users.length > 0) {
      const currentUserExists = users.find(u => u.email === currentUser.email);
      if (!currentUserExists) {
        setUsers([currentUser, ...users]);
      }
    }
  }, [currentUser, users.length]);

  // Guardar usuarios en localStorage cada vez que cambian
  React.useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('lufussa_users', JSON.stringify(users));
    }
  }, [users]);

  // Sync local state if global settings change (e.g. from header toggle)
  React.useEffect(() => {
    setLocalSettings(systemSettings);
  }, [systemSettings]);

  // Safety check
  if (!currentUser || !systemSettings) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Cargando configuración...</p>
      </div>
    );
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    // Verificar que el email no exista ya
    if (users.find(u => u.email === newUser.email)) {
      alert('Ya existe un usuario con ese correo electrónico.');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          company: currentUser.company
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUsers([...users, data.user]);
        setNewUser({ name: '', email: '', role: 'user', password: '' });
        setIsAddingUser(false);
        alert(`Usuario ${data.user.name} creado exitosamente.`);
      } else {
        const error = await res.json();
        alert(error.message || 'Error al crear usuario');
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      alert('Error de conexión al crear usuario');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/users/${editingUser.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingUser.name,
          password: editingUser.password || undefined,
          role: editingUser.role
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(users.map(u => u.email === editingUser.email ? data.user : u));
        setEditingUser(null);
        alert('Usuario actualizado exitosamente.');
      } else {
        alert('Error al actualizar usuario');
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      alert('Error de conexión al actualizar usuario');
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (email === currentUser.email) {
      alert('No puedes eliminar tu propio usuario.');
      return;
    }
    
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    const deletedUser = users.find(u => u.email === email);
    
    try {
      const res = await fetch(`/api/users/${email}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setUsers(users.filter(u => u.email !== email));
        if (deletedUser) {
          alert(`Usuario ${deletedUser.name} eliminado exitosamente.`);
        }
      } else {
        alert('Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error de conexión al eliminar usuario');
    }
  };

  const handleToggleRole = async (email: string) => {
    const user = users.find(u => u.email === email);
    if (!user) return;

    const newRole = user.role === 'admin' ? 'user' : 'admin';

    try {
      const res = await fetch(`/api/users/${email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          role: newRole
        })
      });

      if (res.ok) {
        setUsers(users.map(u => {
          if (u.email === email) {
            return { ...u, role: newRole };
          }
          return u;
        }));
      } else {
        alert('Error al cambiar el rol del usuario');
      }
    } catch (error) {
      console.error('Error al cambiar rol:', error);
      alert('Error de conexión al cambiar rol');
    }
  };

  const handleSaveGeneralSettings = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      onUpdateSettings(localSettings);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 1000);
  };

  const handleAddExport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExport.name || !newExport.recipients) return;

    const exportToAdd: ScheduledExport = {
      id: `export-${Date.now()}`,
      name: newExport.name,
      frequency: newExport.frequency,
      format: newExport.format,
      recipients: newExport.recipients,
      status: 'active',
      lastRun: null
    };

    setScheduledExports([...scheduledExports, exportToAdd]);
    setNewExport({ name: '', frequency: 'diario', format: 'excel', recipients: '' });
    setIsAddingExport(false);
    alert(`Exportación "${exportToAdd.name}" programada exitosamente.`);
  };

  const handleDeleteExport = (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta exportación programada?')) {
      return;
    }
    setScheduledExports(scheduledExports.filter(exp => exp.id !== id));
  };

  if (currentUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
          <Shield size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Acceso Denegado</h3>
        <p className="text-slate-500 max-w-md">
          Lo sentimos, solo los usuarios con rol de administrador pueden acceder a la configuración del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            "px-6 py-4 text-sm font-bold transition-all border-b-2",
            activeTab === 'users' 
              ? "border-lufussa-teal text-lufussa-teal" 
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Gestión de Usuarios
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={cn(
            "px-6 py-4 text-sm font-bold transition-all border-b-2",
            activeTab === 'general' 
              ? "border-lufussa-teal text-lufussa-teal" 
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Configuración General
        </button>
        <button
          onClick={() => setActiveTab('exports')}
          className={cn(
            "px-6 py-4 text-sm font-bold transition-all border-b-2",
            activeTab === 'exports' 
              ? "border-lufussa-teal text-lufussa-teal" 
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Exportaciones Programadas
        </button>
        <button
          onClick={() => setActiveTab('backups')}
          className={cn(
            "px-6 py-4 text-sm font-bold transition-all border-b-2",
            activeTab === 'backups' 
              ? "border-lufussa-teal text-lufussa-teal" 
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Backups y Seguridad
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'users' ? (
          <motion.div 
            key="users-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Usuarios del Sistema</h3>
                <p className="text-sm text-slate-500">Administre quién tiene acceso y qué roles desempeñan.</p>
              </div>
            <button
              onClick={() => { setIsAddingUser(true); setEditingUser(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-lufussa-teal text-white rounded-lg hover:bg-opacity-90 transition-all text-sm font-semibold"
            >
              <UserPlus size={18} />
              Nuevo Usuario
            </button>
          </div>

          {(isAddingUser || editingUser) && (
            <div 
              className="bg-slate-50 p-6 rounded-2xl border border-slate-200 overflow-hidden animate-slide-down"
            >
                <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      value={editingUser ? editingUser.name : newUser.name}
                      onChange={e => editingUser 
                        ? setEditingUser({ ...editingUser, name: e.target.value })
                        : setNewUser({ ...newUser, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      disabled={!!editingUser}
                      value={editingUser ? editingUser.email : newUser.email}
                      onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20 disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="juan@lufussa.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Contraseña</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required={!editingUser}
                        value={editingUser ? (editingUser.password || '') : newUser.password}
                        onChange={e => editingUser
                          ? setEditingUser({ ...editingUser, password: e.target.value })
                          : setNewUser({ ...newUser, password: e.target.value })
                        }
                        className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                        placeholder={editingUser ? "Dejar en blanco para no cambiar" : "••••••••"}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Rol</label>
                    <select
                      value={editingUser ? editingUser.role : newUser.role}
                      onChange={e => editingUser
                        ? setEditingUser({ ...editingUser, role: e.target.value as 'admin' | 'user' })
                        : setNewUser({ ...newUser, role: e.target.value as 'admin' | 'user' })
                      }
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                    >
                      <option value="user">Usuario Estándar</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => { setIsAddingUser(false); setEditingUser(null); }}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-semibold bg-lufussa-teal text-white rounded-lg hover:bg-opacity-90 transition-all"
                    >
                      {editingUser ? 'Actualizar Usuario' : 'Guardar Usuario'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Usuario</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Correo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Rol</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user, i) => (
                  <tr key={user.email} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-lufussa-teal/10 text-lufussa-teal rounded-full flex items-center justify-center font-bold text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-700">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                        user.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          title="Editar Usuario"
                          className="p-2 text-slate-400 hover:text-lufussa-teal hover:bg-lufussa-teal/5 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleRole(user.email)}
                          title="Cambiar Rol"
                          className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                        >
                          <Shield size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.email)}
                          title="Eliminar Usuario"
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : activeTab === 'general' ? (
        <motion.div 
          key="general-tab"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* General Branding */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 size={20} className="text-lufussa-teal" />
              Identidad Corporativa
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nombre de la Empresa</label>
                <input
                  type="text"
                  value={localSettings.companyName}
                  onChange={e => setLocalSettings({ ...localSettings, companyName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">URL del Logo</label>
                <input
                  type="text"
                  value={localSettings.logoUrl}
                  onChange={e => setLocalSettings({ ...localSettings, logoUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700">Tamaño del Logo (%)</label>
                  <span className="text-xs font-bold text-lufussa-teal">{localSettings.logoSize}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="5"
                  value={localSettings.logoSize}
                  onChange={e => setLocalSettings({ ...localSettings, logoSize: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-lufussa-teal"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Pequeño</span>
                  <span>Normal</span>
                  <span>Grande</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Color Primario</label>
                <div className="flex gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg border border-slate-200" 
                    style={{ backgroundColor: localSettings.primaryColor }}
                  />
                  <input
                    type="text"
                    value={localSettings.primaryColor}
                    onChange={e => setLocalSettings({ ...localSettings, primaryColor: e.target.value })}
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Localization & System */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Globe size={20} className="text-lufussa-teal" />
              Localización y Sistema
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Idioma Predeterminado</label>
                <select
                  value={localSettings.language}
                  onChange={e => setLocalSettings({ ...localSettings, language: e.target.value as 'es' | 'en' })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Zona Horaria</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select
                    value={localSettings.timezone}
                    onChange={e => setLocalSettings({ ...localSettings, timezone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                  >
                    <option value="UTC-6">UTC-6 (Honduras)</option>
                    <option value="UTC-5">UTC-5 (EST)</option>
                    <option value="UTC+0">UTC+0 (GMT)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Tiempo de Sesión (min)</label>
                <input
                  type="number"
                  value={localSettings.sessionTimeout}
                  onChange={e => setLocalSettings({ ...localSettings, sessionTimeout: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Intervalo Auto-Backup (horas)</label>
                <input
                  type="number"
                  min="0"
                  max="72"
                  value={localSettings.autoBackupInterval}
                  onChange={e => setLocalSettings({ ...localSettings, autoBackupInterval: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                />
                <p className="text-[10px] text-slate-400 font-bold uppercase">0 para desactivar</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Pedidos por Página</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={localSettings.ordersPageSize}
                  onChange={e => setLocalSettings({ ...localSettings, ordersPageSize: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                />
                <p className="text-[10px] text-slate-400 font-bold uppercase">Predeterminado: 100</p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BellRing size={20} className="text-lufussa-teal" />
              Notificaciones Globales
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-bold text-slate-700 text-sm">Notificaciones por Correo</p>
                  <p className="text-xs text-slate-500">Enviar alertas de envíos críticos al correo</p>
                </div>
                <button 
                  onClick={() => setLocalSettings({ ...localSettings, emailNotifications: !localSettings.emailNotifications })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    localSettings.emailNotifications ? "bg-lufussa-teal" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    localSettings.emailNotifications ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-bold text-slate-700 text-sm">Notificaciones Push</p>
                  <p className="text-xs text-slate-500">Alertas en tiempo real en el navegador</p>
                </div>
                <button 
                  onClick={() => setLocalSettings({ ...localSettings, pushNotifications: !localSettings.pushNotifications })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    localSettings.pushNotifications ? "bg-lufussa-teal" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    localSettings.pushNotifications ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </div>

          {/* Maintenance & Save */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Database size={20} className="text-lufussa-teal" />
                Mantenimiento y Guardado
              </h3>
              
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl mb-6">
                <div>
                  <p className="font-bold text-red-700 text-sm">Modo Mantenimiento</p>
                  <p className="text-xs text-red-600">Bloquear acceso a usuarios no admin</p>
                </div>
                <button 
                  onClick={() => setLocalSettings({ ...localSettings, maintenanceMode: !localSettings.maintenanceMode })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    localSettings.maintenanceMode ? "bg-red-500" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    localSettings.maintenanceMode ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-2">
                {saveStatus === 'success' && (
                  <span 
                    className="text-emerald-500 text-sm font-bold flex items-center gap-1 animate-fade-in"
                  >
                    <CheckCircle2 size={16} />
                    Configuración actualizada
                  </span>
                )}
              </div>
              <button
                onClick={handleSaveGeneralSettings}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-2 px-8 py-3 bg-lufussa-teal text-white rounded-xl hover:bg-opacity-90 transition-all font-bold disabled:opacity-50 shadow-lg shadow-lufussa-teal/20"
              >
                {saveStatus === 'saving' ? 'Guardando...' : (
                  <>
                    <Save size={20} />
                    Guardar Cambios Globales
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      ) : activeTab === 'backups' ? (
        <motion.div 
          key="backups-tab"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Historial de Backups</h3>
              <p className="text-sm text-slate-500">Gestione las copias de seguridad del sistema y restaure datos.</p>
            </div>
            <button
              onClick={onCreateBackup}
              className="flex items-center gap-2 px-4 py-2 bg-lufussa-teal text-white rounded-lg hover:bg-opacity-90 transition-all text-sm font-semibold shadow-lg shadow-lufussa-teal/20"
            >
              <Database size={18} />
              Realizar Backup Ahora
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Fecha y Hora</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tamaño</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tipo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                      No hay backups disponibles.
                    </td>
                  </tr>
                ) : (
                  backups.map((bak) => (
                    <tr key={bak.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                            <Clock size={16} />
                          </div>
                          <span className="font-semibold text-slate-700">
                            {new Date(bak.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{bak.size}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase">
                          Sistema
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onDownloadBackup(bak)}
                            title="Descargar Excel"
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <FileSpreadsheet size={18} />
                          </button>
                          <button
                            onClick={() => onRestoreBackup(bak)}
                            title="Restaurar Backup"
                            className="p-2 text-slate-400 hover:text-lufussa-teal hover:bg-lufussa-teal/5 rounded-lg transition-all"
                          >
                            <RotateCcw size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl h-fit">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">Nota de Seguridad</p>
              <p className="text-xs text-amber-700 mt-1">
                Los backups se almacenan localmente en su navegador. Para mayor seguridad, se recomienda descargar periódicamente el archivo Excel y guardarlo en un almacenamiento externo seguro.
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="exports-tab"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Exportaciones Automáticas</h3>
              <p className="text-sm text-slate-500">Configure reportes automáticos que se enviarán por correo electrónico.</p>
            </div>
            <button
              onClick={() => setIsAddingExport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-lufussa-teal text-white rounded-lg hover:bg-opacity-90 transition-all text-sm font-semibold"
            >
              <Plus size={18} />
              Nueva Programación
            </button>
          </div>

          {isAddingExport && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 overflow-hidden animate-slide-down">
              <form onSubmit={handleAddExport} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nombre del Reporte</label>
                    <input
                      type="text"
                      required
                      value={newExport.name}
                      onChange={e => setNewExport({ ...newExport, name: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                      placeholder="Ej. Reporte Mensual de Pedidos"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Frecuencia</label>
                    <select
                      value={newExport.frequency}
                      onChange={e => setNewExport({ ...newExport, frequency: e.target.value as 'diario' | 'semanal' | 'mensual' })}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                    >
                      <option value="diario">Diario</option>
                      <option value="semanal">Semanal</option>
                      <option value="mensual">Mensual</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Formato de Exportación</label>
                    <select
                      value={newExport.format}
                      onChange={e => setNewExport({ ...newExport, format: e.target.value as 'excel' | 'pdf' })}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                    >
                      <option value="excel">Excel (.xlsx)</option>
                      <option value="pdf">PDF (.pdf)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Destinatarios (Emails)</label>
                    <input
                      type="email"
                      required
                      value={newExport.recipients}
                      onChange={e => setNewExport({ ...newExport, recipients: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-lufussa-teal/20"
                      placeholder="correo@lufussa.com"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingExport(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-semibold bg-lufussa-teal text-white rounded-lg hover:bg-opacity-90 transition-all"
                  >
                    Programar Exportación
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Reporte</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Frecuencia</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Formato</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Destinatarios</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Última Ejecución</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scheduledExports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                      No hay exportaciones programadas. Haz clic en "Nueva Programación" para crear una.
                    </td>
                  </tr>
                ) : (
                  scheduledExports.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                          <Calendar size={16} />
                        </div>
                        <span className="font-semibold text-slate-700">{exp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 capitalize">{exp.frequency}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {exp.format === 'excel' ? (
                          <FileSpreadsheet size={16} className="text-emerald-500" />
                        ) : (
                          <FileText size={16} className="text-red-500" />
                        )}
                        <span className="text-xs font-bold uppercase text-slate-500">{exp.format}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Mail size={14} />
                        <span className="text-xs truncate max-w-[150px]">{exp.recipients}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{exp.lastRun || 'Nunca'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setScheduledExports(scheduledExports.map(e => e.id === exp.id ? { ...e, status: e.status === 'active' ? 'paused' : 'active' } : e))}
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                            exp.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {exp.status === 'active' ? 'Activo' : 'Pausado'}
                        </button>
                        <button
                          onClick={() => handleDeleteExport(exp.id)}
                          title="Eliminar Exportación"
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

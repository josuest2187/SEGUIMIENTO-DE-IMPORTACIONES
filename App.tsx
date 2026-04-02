import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { User, SystemSettings } from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    companyName: 'Lufussa',
    logoUrl: '',
    logoSize: 100,
    primaryColor: '#008080',
    notificationEmail: 'logistica@lufussa.com',
    language: 'es',
    timezone: 'UTC-6',
    sessionTimeout: '30',
    emailNotifications: true,
    pushNotifications: false,
    maintenanceMode: false,
    autoBackupInterval: 24,
    maxBackups: 5,
    ordersPageSize: 100
  });

  useEffect(() => {
    // Load settings and check session
    const init = async () => {
      try {
        // 1. Cargar configuración primero
        let loadedSettings = systemSettings;
        const res = await fetch('/api/settings');
        if (res.ok) {
          const settings = await res.json();
          if (settings) {
            setSystemSettings(settings);
            loadedSettings = settings;
          }
        }

        // 2. Verificar sesión con la configuración cargada
        const savedUser = localStorage.getItem('lufussa_user');
        const lastActivity = localStorage.getItem('lufussa_last_activity');
        
        if (savedUser && lastActivity) {
          const sessionTimeout = parseInt(loadedSettings.sessionTimeout || '30');
          const now = Date.now();
          const lastActivityTime = parseInt(lastActivity);
          const timeElapsed = (now - lastActivityTime) / 1000 / 60; // minutos

          if (timeElapsed < sessionTimeout) {
            // Sesión válida
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
            localStorage.setItem('lufussa_last_activity', now.toString());
          } else {
            // Sesión expirada
            console.log(`⏱️ Sesión expirada por inactividad (${Math.floor(timeElapsed)} minutos)`);
            localStorage.removeItem('lufussa_user');
            localStorage.removeItem('lufussa_last_activity');
          }
        } else if (savedUser) {
          // Usuario guardado sin timestamp (sesión antigua), reautenticar
          localStorage.removeItem('lufussa_user');
        }
      } catch (e) {
        console.error("Init error", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleLogin = async (email: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('lufussa_user', JSON.stringify(data.user));
        localStorage.setItem('lufussa_last_activity', Date.now().toString());
        return true;
      } else {
        const error = await res.json();
        const errorMsg = error.message || "Error al iniciar sesión";
        
        // Si es modo mantenimiento (status 503), mostrar mensaje especial
        if (res.status === 503) {
          alert(errorMsg);
        } else {
          alert(errorMsg);
        }
        return false;
      }
    } catch (e) {
      console.error("Login error", e);
      alert("Error de conexión con el servidor");
      return false;
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('lufussa_last_activity');
    localStorage.removeItem('lufussa_user');
  };

  const handleUpdateSettings = async (newSettings: SystemSettings) => {
    setSystemSettings(newSettings);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
    } catch (e) {
      console.error("Update settings error", e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lufussa-teal"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="notranslate" translate="no">
        <Login 
          onLogin={handleLogin} 
          companyName={systemSettings.companyName}
          logoUrl={systemSettings.logoUrl}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="notranslate" translate="no">
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          systemSettings={systemSettings}
          onUpdateSettings={handleUpdateSettings}
        />
      </div>
    </ErrorBoundary>
  );
}

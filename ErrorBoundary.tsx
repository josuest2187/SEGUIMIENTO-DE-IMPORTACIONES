import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 border border-red-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">¡Oops! Algo salió mal</h1>
                <p className="text-slate-600">La aplicación encontró un error inesperado</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
              <p className="text-sm font-mono text-red-600 mb-2">
                {this.state.error?.toString()}
              </p>
              {this.state.errorInfo && (
                <details className="text-xs font-mono text-slate-600 mt-3">
                  <summary className="cursor-pointer text-slate-700 font-semibold mb-2">
                    Ver detalles técnicos
                  </summary>
                  <pre className="overflow-auto max-h-64 bg-white p-3 rounded border border-slate-200">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-lufussa-teal to-teal-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                <RefreshCw size={18} />
                Recargar Aplicación
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-semibold"
              >
                Ir al Inicio
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Sugerencia:</strong> Este error ha sido registrado. Si el problema persiste, 
                intenta limpiar la caché del navegador o contacta con soporte técnico.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

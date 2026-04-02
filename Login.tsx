import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import Logo from './Logo';

interface LoginProps {
  onLogin: (email: string, password?: string) => void;
  companyName: string;
  logoUrl: string;
}

export default function Login({ onLogin, companyName, logoUrl }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    onLogin(email, password);
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side: Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=2070&auto=format&fit=crop"
          alt="Container Port"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-4 left-4 text-white text-xs opacity-70">
          Número de compilación: 20260225.1.1919
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        <div className="absolute top-8 right-8 border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-600 uppercase">
          ES
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-start">
            <Logo 
              className="mb-8 scale-125 origin-left" 
              companyName={companyName}
              logoUrl={logoUrl}
            />
            <h2 className="text-4xl font-light text-slate-800 mb-2">Acceso</h2>
            <p className="text-slate-500 text-sm">
              Introduzca su dirección de correo electrónico registrada y contraseña para iniciar sesión en {companyName}.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Correo electrónico*
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lufussa-teal focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Contraseña*
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-lufussa-teal focus:border-transparent outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <a href="#" className="text-sm text-lufussa-teal hover:underline font-medium">
                ¿Has olvidado tu contraseña?
              </a>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="w-full bg-lufussa-teal text-white py-3 rounded-lg font-semibold text-lg shadow-lg shadow-lufussa-teal/20 hover:bg-opacity-90 transition-all"
            >
              Acceso
            </motion.button>
          </form>
        </div>

        {/* Floating Icons (Mocking the right side bar in image) */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
           <div className="p-2 bg-white shadow-md rounded-full text-slate-400 hover:text-lufussa-teal cursor-pointer">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6 6-6"/><path d="m5 16 6 6 6-6"/></svg>
           </div>
           <div className="p-2 bg-white shadow-md rounded-full text-slate-400 hover:text-lufussa-teal cursor-pointer">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
           </div>
           <div className="p-2 bg-lufussa-teal text-white shadow-md rounded-full cursor-pointer">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
           </div>
        </div>
      </div>
    </div>
  );
}

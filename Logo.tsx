import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
  companyName?: string;
  logoUrl?: string;
  logoSize?: number;
}

export default function Logo({ 
  className = "", 
  variant = 'full',
  companyName = "Lufussa",
  logoUrl = "",
  logoSize = 100
}: LogoProps) {
  const scale = logoSize / 100;

  if (variant === 'icon') {
    return (
      <div 
        className={`relative flex-shrink-0 ${className}`}
        style={{ width: `${40 * scale}px`, height: `${40 * scale}px` }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <>
            <div className="absolute inset-0 border-2 border-[#1e4b7a] rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width={20 * scale} height={20 * scale} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#2d89a4" stroke="#1e4b7a" strokeWidth="1" />
              </svg>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="relative flex-shrink-0"
        style={{ width: `${48 * scale}px`, height: `${48 * scale}px` }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <>
            <div className="absolute inset-0 border-4 border-[#1e4b7a] rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width={24 * scale} height={24 * scale} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#2d89a4" stroke="#1e4b7a" strokeWidth="1" />
              </svg>
            </div>
          </>
        )}
      </div>
      <div className="flex flex-col" style={{ transform: `scale(${scale})`, transformOrigin: 'left center' }}>
        <span className="text-3xl font-bold text-slate-600 leading-none tracking-tight">{companyName}</span>
        <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter whitespace-nowrap">
          {companyName === "Lufussa" ? "LUZ Y FUERZA DE SAN LORENZO, S.A." : "SISTEMA DE GESTIÓN LOGÍSTICA"}
        </span>
      </div>
    </div>
  );
}

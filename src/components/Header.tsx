"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  carregando?: boolean;
  nomeUsuario?: string;
  onLogout?: () => void;
}

export default function Header({ carregando, nomeUsuario, onLogout }: HeaderProps) {
  // Lemos a URL atual da página
  const pathname = usePathname();

  // Verifica se NÃO ESTÁ na página inicial
const destinoLink = pathname !== "/" ? "/" : "/trilhatech";
const textoLink = pathname !== "/" ? "Página Inicial" : "Painel Gestão";
const iconeLink = pathname !== "/" ? "🏠" : "⚙️";

  return (
    <header className="bg-slate-800 text-white p-4 rounded-2xl shadow-lg flex justify-between items-center mb-6">
      
      {/* LOGO E TÍTULO CLICÁVEIS */}
      <Link href={destinoLink} className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/10">
          🎓
        </div>
        <div>
          <h1 className="font-black text-lg leading-none tracking-tight">Portal Educacional</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Plataforma Gamificada
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        {carregando && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white opacity-50"></div>
        )}
        
        {nomeUsuario && (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:block text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Conectado como</p>
              <p className="font-bold text-sm text-slate-100">{nomeUsuario}</p>
            </div>
            
            <div className="flex items-center gap-2">
              
              {/* BOTÃO DINÂMICO (Muda dependendo da página) */}
              <Link 
                href={destinoLink}
                className="bg-slate-700 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors border border-slate-600 hover:border-blue-400 flex items-center gap-2"
                title={textoLink}
              >
                <span className="text-sm hidden sm:block font-bold pl-1">{textoLink}</span>
                <span className="text-lg leading-none">{iconeLink}</span>
              </Link>

              {/* BOTÃO DE SAIR */}
              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="bg-slate-700 hover:bg-red-500 text-white p-2 rounded-lg transition-colors border border-slate-600 hover:border-red-400"
                  title="Sair do Sistema"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
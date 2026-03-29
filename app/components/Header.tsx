// src/components/Header.tsx
interface HeaderProps {
  carregando: boolean;
  nomeUsuario: string;
  onLogout: () => void;
}

export default function Header({ carregando, nomeUsuario, onLogout }: HeaderProps) {
  return (
    <header className="bg-emerald-800 text-white p-4 md:p-6 rounded-xl shadow-md mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="text-center md:text-left">
        <h1 className="text-xl md:text-2xl font-bold tracking-wide">PAINEL DE GESTÃO</h1>
        <p className="text-emerald-100 text-xs md:text-sm mt-1">EREM Barão do Exu</p>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
        <div className="bg-emerald-700 w-full md:w-auto px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
          {carregando ? (
            <span className="text-yellow-300">⏳ Sincronizando...</span>
          ) : (
            <span className="text-emerald-300">🟢 Sistema Online</span>
          )}
        </div>

        {/* --- NOVO: Perfil e botão de Sair --- */}
        <div className="flex items-center gap-3 bg-emerald-900/50 px-4 py-2 rounded-lg border border-emerald-700 w-full md:w-auto justify-center">
          <span className="text-sm font-medium">Olá, <span className="text-emerald-300">{nomeUsuario}</span></span>
          <div className="w-px h-4 bg-emerald-600 hidden md:block"></div>
          <button 
            onClick={onLogout}
            className="text-sm font-bold text-red-300 hover:text-red-100 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
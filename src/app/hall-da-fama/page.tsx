"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import PerfilPublicoModal from "@/src/components/PerfilPublicoModal";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Veterano {
  matricula: string;
  nome: string;
  avatar: string;
  badges: string[];
  anoFormacao: number;
  xpFinal: number;
  nivelFinal: string;
}

export default function HallDaFamaPage() {
  const { data, isLoading } = useSWR("/api/alunos/veteranos", fetcher, {
    revalidateOnFocus: false,
  });

  const [perfilAberto, setPerfilAberto] = useState<string | null>(null);
  
  // Usuario visualizador falso para poder curtir sem erro
  const matriculaVisualizador = typeof window !== "undefined" ? localStorage.getItem("matriculaAluno") || "00000" : "00000";

  const veteranos: Veterano[] = data?.status === "sucesso" ? data.veteranos : [];
  
  // Ordenar por XP Final (Maior pro menor)
  const veteranosOrdenados = [...veteranos].sort((a, b) => b.xpFinal - a.xpFinal);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 relative overflow-hidden">
      {/* Decorações Cósmicas de Fundo */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none -mt-40 -mr-40" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none -mb-20 -ml-20" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <Link href="/portal" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
            <span>&larr;</span> Voltar ao Portal
          </Link>
          <div className="text-right">
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-600 uppercase tracking-widest filter drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
              Hall da Fama
            </h1>
            <p className="text-amber-200/60 font-bold tracking-widest text-xs uppercase mt-2">
              Lendas do Trilha Tech
            </p>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-amber-500/60 font-bold uppercase tracking-widest text-sm">Consultando os Arquivos Antigos...</p>
          </div>
        ) : veteranosOrdenados.length === 0 ? (
          <div className="text-center py-32">
            <div className="text-6xl mb-6 opacity-50">🏛️</div>
            <h2 className="text-2xl font-bold text-slate-400">O Hall da Fama está vazio.</h2>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Nenhuma lenda se formou ainda. O primeiro ciclo letivo precisa ser encerrado para que os primeiros veteranos gravem seus nomes aqui para a eternidade.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {veteranosOrdenados.map((vet, idx) => (
                <motion.div
                  key={vet.matricula}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setPerfilAberto(vet.matricula)}
                  className="group cursor-pointer relative glass-panel bg-white/5 border-white/10 rounded-3xl p-6 overflow-hidden hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(251,191,36,0.15)]"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="text-6xl font-black italic">#{idx + 1}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <img 
                      src={vet.avatar} 
                      alt="Avatar" 
                      className="w-16 h-16 rounded-full border-2 border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.2)] object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://api.dicebear.com/9.x/bottts/svg?seed=fallback" }}
                    />
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-amber-300 transition-colors line-clamp-1">{vet.nome}</h3>
                      <div className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md inline-block mt-1">
                        Formação: {vet.anoFormacao}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-between items-end relative z-10">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">XP Final</p>
                      <p className="text-2xl font-black text-white">{vet.xpFinal.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nível</p>
                      <p className="text-sm font-bold text-amber-400">{vet.nivelFinal}</p>
                    </div>
                  </div>

                  {vet.badges.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2 relative z-10">
                      {vet.badges.slice(0, 3).map((b, i) => (
                        <span key={i} className="text-[10px] font-bold bg-white/10 text-white/80 px-2 py-1 rounded-md">
                          {b.replace("Legado", "🏅")}
                        </span>
                      ))}
                      {vet.badges.length > 3 && (
                        <span className="text-[10px] font-bold bg-white/5 text-white/50 px-2 py-1 rounded-md">
                          +{vet.badges.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal de Perfil do Veterano */}
      {perfilAberto && (
        <PerfilPublicoModal
          matriculaVisualizador={matriculaVisualizador}
          matriculaAlvo={perfilAberto}
          onClose={() => setPerfilAberto(null)}
          // Se quiser, no PerfilPublicoModal você pode passar um prop `somenteLeitura`
          // mas o Perfil já lida com o Pix e etc. Como é um Veterano, talvez seja legal
          // esconder os botões de Pix lá dentro.
        />
      )}
    </div>
  );
}

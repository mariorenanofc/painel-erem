"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LandingPageProps {
  onLoginTutor: () => void;
}

export default function LandingPage({ onLoginTutor }: LandingPageProps) {
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  if (!montado) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans relative overflow-hidden transition-colors duration-300">
      
      {/* Background Decorativo */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full aurora-bg-blob-1 animate-float-slow pointer-events-none opacity-50 dark:opacity-30" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full aurora-bg-blob-2 animate-float-medium pointer-events-none opacity-50 dark:opacity-30" />
      <div className="absolute top-[20%] right-[20%] w-[30vw] h-[30vw] rounded-full aurora-bg-blob-3 animate-glow-pulse pointer-events-none opacity-50 dark:opacity-30" />

      {/* Top Navbar */}
      <nav className="relative z-20 flex justify-between items-center p-6 md:px-12 max-w-7xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
            🚀
          </div>
          <span className="font-display font-black text-xl tracking-tight text-slate-800 dark:text-white">
            Trilha Tech
          </span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 md:gap-4"
        >
          <button
            onClick={onLoginTutor}
            className="cursor-pointer text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors px-3 py-2 uppercase tracking-wider"
          >
            Acesso Restrito
          </button>
          <button
            onClick={() => window.location.href = "/portal"}
            className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-650 hover:brightness-110 text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>🎮</span> Portal do Aluno
          </button>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", damping: 20 }}
          className="space-y-6"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-4">
            Plataforma Educacional Open Source
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-[1.1] text-slate-900 dark:text-white">
            Gamifique o <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Aprendizado</span> da sua escola.
          </h1>
          
          <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Transforme suas turmas de tecnologia em uma jornada épica. Missões, XPs, Badges, Lojas Virtuais e Rankings integrados diretamente ao ecossistema educacional.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 pt-4">
            <button
              onClick={() => window.location.href = "/portal"}
              className="cursor-pointer bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider shadow-xl transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
            >
              Explorar Portal
            </button>
            <button
              onClick={() => window.open("https://github.com/mariorenanofc/painel-erem", "_blank")}
              className="cursor-pointer glass-panel bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg transition-all hover:scale-105 active:scale-95 border border-slate-200 dark:border-white/10 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <span>⭐</span> GitHub / Deploy
            </button>
          </div>
        </motion.div>

        {/* Feature Cards Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full">
          {[
            { icon: "🏆", title: "Sistema de Rankings", desc: "Acompanhe os Tops da escola através de Ligas baseadas em XP." },
            { icon: "🛍️", title: "Loja Virtual & Rifas", desc: "Os alunos gastam moedas (XP) para comprar itens reais na escola." },
            { icon: "🤖", title: "Missões & Badges", desc: "Integração automática para correção de missões e distribuição de condecorações." }
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-white/5 text-left bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-colors"
            >
              <div className="text-3xl mb-4">{feat.icon}</div>
              <h3 className="font-display font-black text-lg text-slate-800 dark:text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="relative z-10 p-6 text-center border-t border-slate-200 dark:border-white/5 mt-auto">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Desenvolvido para o Futuro da Educação.
        </p>
      </footer>
    </div>
  );
}

/* eslint-disable @next/next/no-img-element */
"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 1. Expandimos os tipos para incluir ações gamificadas específicas
export type ToastType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "quiz_correct"
  | "quiz_wrong"
  | "sync"
  | "reward";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  title?: string; // <-- NOVO: Título customizado
  imageUrl?: string; // <-- NOVO: Imagem ou GIF customizado
}

interface ToastContextProps {
  // A função agora aceita Título e Imagem opcionalmente!
  toast: (
    message: string,
    type?: ToastType,
    title?: string,
    imageUrl?: string,
  ) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (
      message: string,
      type: ToastType = "info",
      title?: string,
      imageUrl?: string,
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type, title, imageUrl }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 12000); // 12 segundos para dar tempo de ler tudo
    },
    [],
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      <AnimatePresence>
        {toasts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-slate-950/60 backdrop-blur-md"
          >
            <div className="flex flex-col gap-4 max-h-screen overflow-y-auto w-full items-center custom-scrollbar">
              {toasts.map((t) => (
                <ToastCard
                  key={t.id}
                  toast={t}
                  onClose={() => removeToast(t.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

// ========================================================
// O CARD INFORMATIVO COM SUPORTE A IMAGENS E TEMAS
// ========================================================
function ToastCard({
  toast,
  onClose,
}: {
  toast: ToastMessage;
  onClose: () => void;
}) {
  // Dicionário de Estilos Dinâmicos Gamificados – Premium
  const theme = {
    // Básicos
    success: {
      icon: "✅",
      title: "Sucesso!",
      bgIcon: "bg-emerald-100/80 dark:bg-emerald-900/20",
      textIcon: "text-emerald-600 dark:text-emerald-400",
      btn: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/20",
      borderTop: "bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400",
      glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
      ring: "ring-emerald-500/20",
    },
    error: {
      icon: "🚨",
      title: "Atenção!",
      bgIcon: "bg-red-100/80 dark:bg-red-900/20",
      textIcon: "text-red-600 dark:text-red-400",
      btn: "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-red-500/20",
      borderTop: "bg-gradient-to-r from-red-400 via-rose-500 to-red-400",
      glow: "shadow-[0_0_30px_rgba(239,68,68,0.15)]",
      ring: "ring-red-500/20",
    },
    warning: {
      icon: "⚠️",
      title: "Aviso",
      bgIcon: "bg-amber-100/80 dark:bg-amber-900/20",
      textIcon: "text-amber-600 dark:text-amber-400",
      btn: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/20",
      borderTop: "bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400",
      glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]",
      ring: "ring-amber-500/20",
    },
    info: {
      icon: "ℹ️",
      title: "Informação",
      bgIcon: "bg-blue-100/80 dark:bg-blue-900/20",
      textIcon: "text-blue-600 dark:text-blue-400",
      btn: "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-blue-500/20",
      borderTop: "bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400",
      glow: "shadow-[0_0_30px_rgba(59,130,246,0.15)]",
      ring: "ring-blue-500/20",
    },

    // Gamificados
    quiz_correct: {
      icon: "🎯",
      title: "Na Mosca!",
      bgIcon: "bg-emerald-100/80 dark:bg-emerald-900/20",
      textIcon: "text-emerald-600 dark:text-emerald-400",
      btn: "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-emerald-500/20",
      borderTop: "bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400",
      glow: "shadow-[0_0_40px_rgba(16,185,129,0.2)]",
      ring: "ring-emerald-500/30",
    },
    quiz_wrong: {
      icon: "🤔",
      title: "Quase lá...",
      bgIcon: "bg-orange-100/80 dark:bg-orange-900/20",
      textIcon: "text-orange-600 dark:text-orange-400",
      btn: "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20",
      borderTop: "bg-gradient-to-r from-orange-400 via-amber-500 to-orange-400",
      glow: "shadow-[0_0_30px_rgba(249,115,22,0.15)]",
      ring: "ring-orange-500/20",
    },
    sync: {
      icon: "🔄",
      title: "Sincronização AVA",
      bgIcon: "bg-indigo-100/80 dark:bg-indigo-900/20",
      textIcon: "text-indigo-600 dark:text-indigo-400",
      btn: "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-indigo-500/20",
      borderTop: "bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-400",
      glow: "shadow-[0_0_30px_rgba(99,102,241,0.15)]",
      ring: "ring-indigo-500/20",
    },
    reward: {
      icon: "🎁",
      title: "Recompensa Resgatada!",
      bgIcon: "bg-fuchsia-100/80 dark:bg-fuchsia-900/20",
      textIcon: "text-fuchsia-600 dark:text-fuchsia-400",
      btn: "bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white shadow-fuchsia-500/20",
      borderTop: "bg-gradient-to-r from-fuchsia-400 via-pink-500 to-fuchsia-400",
      glow: "shadow-[0_0_40px_rgba(192,38,211,0.2)]",
      ring: "ring-fuchsia-500/30",
    },
  };

  const currTheme = theme[toast.type] || theme.info;
  const finalTitle = toast.title || currTheme.title; // Usa o título customizado, se existir

  // Renderizador Inteligente para criar Tópicos 1), 2), 3)
  const renderMessage = (msg: string) => {
    return msg.split("\n").map((line, i) => {
      const trimmed = line.trim();
      const matchList = trimmed.match(/^(\d+\))/);

      if (matchList) {
        const bullet = matchList[1];
        const text = trimmed.replace(bullet, "").trim();

        return (
          <div
            key={i}
            className="flex gap-3 text-left mt-3 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100/80 dark:border-slate-700/50 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all backdrop-blur-sm"
          >
            <span className={`font-black text-lg ${currTheme.textIcon}`}>
              {bullet.replace(")", "")}
            </span>
            <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
              {text}
            </span>
          </div>
        );
      } else if (trimmed === "") {
        return <div key={i} className="h-1" />;
      } else {
        return (
          <p
            key={i}
            className="text-slate-600 dark:text-slate-300 text-[15px] text-center leading-relaxed"
          >
            {trimmed}
          </p>
        );
      }
    });
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`glass-panel-heavy w-full max-w-md rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/5 pointer-events-auto transition-colors duration-300 ${currTheme.glow}`}
    >
      {/* Barra de gradiente no topo */}
      <div className={`h-1.5 w-full ${currTheme.borderTop}`} />

      <div className="p-6 md:p-8 flex flex-col items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        {/* Se for enviada uma Imagem Customizada, ele desenha a imagem. Se não, desenha o Ícone do Tema */}
        {toast.imageUrl ? (
          <motion.img
            src={toast.imageUrl}
            alt="Ilustração"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15, delay: 0.1 }}
            className="w-28 h-28 object-contain mb-4 drop-shadow-md"
          />
        ) : (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, delay: 0.1 }}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 ${currTheme.bgIcon} ${currTheme.textIcon} ring-4 ${currTheme.ring} shadow-sm`}
          >
            {currTheme.icon}
          </motion.div>
        )}

        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-display font-black text-xl text-slate-800 dark:text-slate-100 mb-4 text-center tracking-tight"
        >
          {finalTitle}
        </motion.h3>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full mb-8"
        >
          {renderMessage(toast.message)}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className={`cursor-pointer w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 ${currTheme.btn}`}
        >
          OK, Entendi
        </motion.button>
      </div>
    </motion.div>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context)
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  return context;
};

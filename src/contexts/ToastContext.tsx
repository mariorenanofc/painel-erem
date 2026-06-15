/* eslint-disable @next/next/no-img-element */
"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

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

      {toasts.length > 0 && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex flex-col gap-4 max-h-screen overflow-y-auto w-full items-center">
            {toasts.map((t) => (
              <ToastCard
                key={t.id}
                toast={t}
                onClose={() => removeToast(t.id)}
              />
            ))}
          </div>
        </div>
      )}
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
  // Dicionário de Estilos Dinâmicos Gamificados
  const theme = {
    // Básicos
    success: {
      icon: "✅",
      title: "Sucesso!",
      bgIcon: "bg-emerald-100 dark:bg-emerald-900/30",
      textIcon: "text-emerald-600 dark:text-emerald-400",
      btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
      borderTop: "bg-emerald-500",
    },
    error: {
      icon: "🚨",
      title: "Atenção!",
      bgIcon: "bg-red-100 dark:bg-red-900/30",
      textIcon: "text-red-600 dark:text-red-400",
      btn: "bg-red-600 hover:bg-red-700 text-white",
      borderTop: "bg-red-500",
    },
    warning: {
      icon: "⚠️",
      title: "Aviso",
      bgIcon: "bg-amber-100 dark:bg-amber-900/30",
      textIcon: "text-amber-600 dark:text-amber-400",
      btn: "bg-amber-500 hover:bg-amber-600 text-white",
      borderTop: "bg-amber-500",
    },
    info: {
      icon: "ℹ️",
      title: "Informação",
      bgIcon: "bg-blue-100 dark:bg-blue-900/30",
      textIcon: "text-blue-600 dark:text-blue-400",
      btn: "bg-blue-600 hover:bg-blue-700 text-white",
      borderTop: "bg-blue-500",
    },

    // Gamificados
    quiz_correct: {
      icon: "🎯",
      title: "Na Mosca!",
      bgIcon: "bg-emerald-100 dark:bg-emerald-900/30",
      textIcon: "text-emerald-600 dark:text-emerald-400",
      btn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30",
      borderTop: "bg-emerald-500",
    },
    quiz_wrong: {
      icon: "🤔",
      title: "Quase lá...",
      bgIcon: "bg-orange-100 dark:bg-orange-900/30",
      textIcon: "text-orange-600 dark:text-orange-400",
      btn: "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30",
      borderTop: "bg-orange-500",
    },
    sync: {
      icon: "🔄",
      title: "Sincronização AVA",
      bgIcon: "bg-indigo-100 dark:bg-indigo-900/30",
      textIcon: "text-indigo-600 dark:text-indigo-400",
      btn: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30",
      borderTop: "bg-indigo-500",
    },
    reward: {
      icon: "🎁",
      title: "Recompensa Resgatada!",
      bgIcon: "bg-fuchsia-100 dark:bg-fuchsia-900/30",
      textIcon: "text-fuchsia-600 dark:text-fuchsia-400",
      btn: "bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-fuchsia-500/30",
      borderTop: "bg-fuchsia-500",
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
            className="flex gap-3 text-left mt-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-slate-300 transition-colors"
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
        return <div key={i} className="h-1"></div>;
      } else {
        return (
          <p
            key={i}
            className="text-slate-700 dark:text-slate-300 text-[15px] text-center leading-relaxed"
          >
            {trimmed}
          </p>
        );
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 relative pointer-events-auto">
      <div className={`h-1.5 w-full ${currTheme.borderTop}`}></div>

      <div className="p-6 md:p-8 flex flex-col items-center">
        {/* Se for enviada uma Imagem Customizada, ele desenha a imagem. Se não, desenha o Ícone do Tema */}
        {toast.imageUrl ? (
          <img
            src={toast.imageUrl}
            alt="Ilustração"
            className="w-28 h-28 object-contain mb-4 animate-in zoom-in duration-500 drop-shadow-md"
          />
        ) : (
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 ${currTheme.bgIcon} ${currTheme.textIcon}`}
          >
            {currTheme.icon}
          </div>
        )}

        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-4 text-center">
          {finalTitle}
        </h3>

        <div className="w-full mb-8">{renderMessage(toast.message)}</div>

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 ${currTheme.btn}`}
        >
          OK, Entendi
        </button>
      </div>
    </div>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context)
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  return context;
};

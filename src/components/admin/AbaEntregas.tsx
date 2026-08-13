"use client";

import { useState } from "react";
import { useToast } from "@/src/contexts/ToastContext";

export default function AbaEntregas() {
  const { toast } = useToast();
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
        <h3 className="text-xl font-black text-slate-800 dark:text-white font-display">
          📤 Entregas (Projetos)
        </h3>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl text-sm font-medium border border-blue-200 dark:border-blue-800/30">
        Aqui você poderá avaliar entregas, devolver atividades e alterar XP concedido. (Em construção)
      </div>
    </div>
  );
}

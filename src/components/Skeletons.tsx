"use client";

import React from "react";

/**
 * Skeleton do Portal / Cockpit do Aluno (Regra 5: Skeleton Loading)
 * Substitui telas de bloqueio com spinner por placeholders estruturais.
 */
export function CockpitSkeleton() {
  return (
    <div className="min-h-screen bg-pft-sand dark:bg-[#08172e] text-slate-800 dark:text-slate-100 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-200 dark:border-white/10 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-1.5">
              <div className="w-36 h-4 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="w-20 h-3 rounded-md bg-slate-200/70 dark:bg-slate-800/70" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="w-28 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        {/* Hero / Cockpit Card Skeleton */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-white/10 animate-pulse space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="space-y-2">
                <div className="w-48 h-6 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="w-32 h-4 rounded-md bg-slate-200/70 dark:bg-slate-800/70" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-28 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="w-28 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>

          {/* Barra de Progresso XP */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="w-24 h-3 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="w-16 h-3 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-200/60 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5" />
            ))}
          </div>
        </div>

        {/* Grid de Módulos / Missões Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/10 animate-pulse space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-20 h-5 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="w-12 h-5 rounded-md bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="space-y-2">
                <div className="w-3/4 h-5 rounded-md bg-slate-200 dark:bg-slate-800" />
                <div className="w-1/2 h-3.5 rounded-md bg-slate-200/70 dark:bg-slate-800/70" />
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-slate-200/50 dark:border-white/5">
                <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="w-20 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton da Central de Gabaritos (Regra 5)
 * Substitui o texto "Descriptografando matrizes..." e spinner giratório.
 */
export function GabaritoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/10 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="w-24 h-5 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="w-16 h-5 rounded-md bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="w-2/3 h-5 rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2 pt-2">
            <div className="w-full h-9 rounded-xl bg-slate-200/70 dark:bg-slate-800/60" />
            <div className="w-full h-9 rounded-xl bg-slate-200/70 dark:bg-slate-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton genérico de linhas de tabela / listas (Regra 5)
 * Ideal para Frequência do Aluno, Transações e Listas Docentes.
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse py-2">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/70 dark:border-white/5"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-1.5">
              <div className="w-40 sm:w-56 h-4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="w-24 h-3 rounded bg-slate-200/70 dark:bg-slate-800/70" />
            </div>
          </div>
          <div className="w-16 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
        </div>
      ))}
    </div>
  );
}

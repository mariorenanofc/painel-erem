"use client";

import React from "react";

export default function PftBackgroundPattern({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full opacity-[0.055] dark:opacity-[0.045] transition-opacity duration-500"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        fill="none"
      >
        <defs>
          <linearGradient id="pftGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5500" />
            <stop offset="100%" stopColor="#34c759" />
          </linearGradient>
          <linearGradient id="pftGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0e2442" />
            <stop offset="100%" stopColor="#ff5500" />
          </linearGradient>
        </defs>

        {/* Trilha e Circuito 1 - Superior Direito */}
        <path
          d="M 1100 -50 V 160 Q 1100 200 1140 200 H 1320 Q 1360 200 1360 240 V 420 Q 1360 460 1400 460 H 1480"
          stroke="url(#pftGrad1)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="1100" cy="160" r="10" fill="#ff5500" />
        <circle cx="1320" cy="200" r="8" fill="#34c759" />
        <circle cx="1360" cy="420" r="12" fill="#ff5500" />

        {/* Trilha e Circuito 2 - Lateral Esquerda */}
        <path
          d="M -50 280 H 120 Q 160 280 160 320 V 540 Q 160 580 200 580 H 340 Q 380 580 380 620 V 780"
          stroke="url(#pftGrad2)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="120" cy="280" r="9" fill="#0e2442" />
        <circle cx="200" cy="580" r="11" fill="#ff5500" />
        <circle cx="380" cy="780" r="8" fill="#34c759" />

        {/* Trilha e Circuito 3 - Meio / Inferior */}
        <path
          d="M 720 950 V 780 Q 720 740 760 740 H 940 Q 980 740 980 700 V 620 Q 980 580 1020 580 H 1150"
          stroke="#ff5500"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="760" cy="740" r="8" fill="#ff5500" />
        <circle cx="980" cy="620" r="10" fill="#34c759" />
        <circle cx="1150" cy="580" r="9" fill="#0e2442" />
      </svg>
    </div>
  );
}


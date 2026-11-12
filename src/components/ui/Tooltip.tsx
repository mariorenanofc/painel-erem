"use client";

import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  delay?: number;
}

export default function Tooltip({
  content,
  children,
  position = "top",
  className = "",
  delay = 0.15,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  // Posições e offsets
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-2.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-2.5",
  };

  // Animação de entrada
  const motionVariants = {
    top: { initial: { opacity: 0, y: 6, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 } },
    bottom: { initial: { opacity: 0, y: -6, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 } },
    left: { initial: { opacity: 0, x: 6, scale: 0.95 }, animate: { opacity: 1, x: 0, scale: 1 } },
    right: { initial: { opacity: 0, x: -6, scale: 0.95 }, animate: { opacity: 1, x: 0, scale: 1 } },
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial={motionVariants[position].initial}
            animate={motionVariants[position].animate}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute ${positionClasses[position]} z-50 pointer-events-none select-none`}
          >
            <div className="relative px-3 py-1.5 rounded-xl bg-slate-950/95 dark:bg-slate-900/95 text-slate-100 text-[11px] font-bold tracking-wide shadow-2xl shadow-black/60 border border-white/10 backdrop-blur-xl whitespace-nowrap flex items-center gap-1.5">
              {content}

              {/* Setinha apontadora estilizada */}
              {position === "top" && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-solid border-t-slate-950/95 dark:border-t-slate-900/95 border-t-[5px] border-x-transparent border-x-[5px] border-b-0" />
              )}
              {position === "bottom" && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-[1px] border-solid border-b-slate-950/95 dark:border-b-slate-900/95 border-b-[5px] border-x-transparent border-x-[5px] border-t-0" />
              )}
              {position === "left" && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-[1px] border-solid border-l-slate-950/95 dark:border-l-slate-900/95 border-l-[5px] border-y-transparent border-y-[5px] border-r-0" />
              )}
              {position === "right" && (
                <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-[1px] border-solid border-r-slate-950/95 dark:border-r-slate-900/95 border-r-[5px] border-y-transparent border-y-[5px] border-l-0" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


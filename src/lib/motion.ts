"use client";

import { useReducedMotion, type Transition, type Variants } from "framer-motion";

/**
 * Física de Mola Elástica (Regra 2: Spring Physics)
 * Movimento natural e orgânico sem acelerações robóticas.
 */
export const SPRING_PHYSICS: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 26,
  mass: 0.9,
};

/**
 * Física de Mola Suave para Modais e Painéis Grandes
 */
export const SPRING_MODAL: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 28,
  mass: 0.95,
};

/**
 * Desaceleração Suave na Entrada (Regra 3: Ease Out on Enter)
 * Curva exponencial que acomoda o foco visual rapidamente.
 */
export const EASE_OUT_ENTER: Transition = {
  duration: 0.26,
  ease: [0.22, 1, 0.36, 1],
};

/**
 * Variantes padrão para Backdrops (Fundo escuro de modais)
 */
export const BACKDROP_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: "easeIn" } },
};

/**
 * Variantes padrão para Modais com Spring Physics
 */
export const MODAL_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 14 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRING_MODAL,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.16, ease: "easeIn" },
  },
};

/**
 * Variantes para Listas e Grids com Stagger (Regra 1: 80ms / 50ms em cascata)
 */
export const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

export const STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING_PHYSICS,
  },
};

/**
 * Hook de Acessibilidade Vestibular (Regra 9: Reduced Motion)
 * Retorna variantes e transições seguras: se o usuário preferir movimento reduzido,
 * substitui deslocamentos/molas por fades sutis.
 */
export function useMotionConfig() {
  const prefersReduced = useReducedMotion();

  const reducedModalVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.15 } },
    exit: { opacity: 0, transition: { duration: 0.12 } },
  };

  const reducedStaggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.15 } },
  };

  const reducedStaggerItem: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.15 } },
  };

  return {
    prefersReduced: Boolean(prefersReduced),
    springTransition: prefersReduced ? { duration: 0.15 } : SPRING_PHYSICS,
    modalTransition: prefersReduced ? { duration: 0.15 } : SPRING_MODAL,
    easeOutTransition: prefersReduced ? { duration: 0.15 } : EASE_OUT_ENTER,
    modalVariants: prefersReduced ? reducedModalVariants : MODAL_VARIANTS,
    backdropVariants: BACKDROP_VARIANTS,
    staggerContainer: prefersReduced ? reducedStaggerContainer : STAGGER_CONTAINER,
    staggerItem: prefersReduced ? reducedStaggerItem : STAGGER_ITEM,
    tapScale: prefersReduced ? undefined : { scale: 0.96 },
    hoverLift: prefersReduced ? undefined : { y: -4 },
  };
}

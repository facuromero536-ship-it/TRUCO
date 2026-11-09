/**
 * Variantes y configuraciones de animación para cartas de Truco Argentino usando Motion
 */
import type { Transition, Variants } from 'motion/react';

// Transición elástica y realista de carta
export const cardSpringTransition: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 24,
  mass: 0.85,
};

// Transición suave para vuelo de mano a mesa (viaje fluido y natural con arco)
export const cardFlightTransition: Transition = {
  type: 'spring',
  stiffness: 250,
  damping: 24,
  mass: 0.85,
};

// Variantes de reparto desde el mazo a la mano del jugador
export const dealToPlayerVariants: Variants = {
  initial: (i: number) => ({
    x: 150 + i * 15,
    y: -230,
    scale: 0.45,
    rotate: -18,
    opacity: 0,
  }),
  animate: (custom: { fanRotation: number; index: number }) => ({
    x: 0,
    y: 0,
    scale: 1,
    rotate: custom.fanRotation,
    opacity: 1,
    transition: {
      delay: custom.index * 0.14,
      type: 'spring',
      stiffness: 240,
      damping: 21,
      mass: 0.85,
    },
  }),
};

// Variantes de reparto desde el mazo a la mano del rival (IA)
export const dealToAiVariants: Variants = {
  initial: (i: number) => ({
    x: 150 + i * 15,
    y: 130,
    scale: 0.45,
    rotate: 18,
    opacity: 0,
  }),
  animate: (custom: { fanRotation: number; index: number }) => ({
    x: 0,
    y: 0,
    scale: 1,
    rotate: custom.fanRotation,
    opacity: 1,
    transition: {
      delay: 0.06 + custom.index * 0.14,
      type: 'spring',
      stiffness: 240,
      damping: 21,
      mass: 0.85,
    },
  }),
};

// Variantes del Mazo para indicar reparto
export const deckPulseVariants: Variants = {
  idle: {
    scale: 1,
    rotate: 0,
  },
  dealing: {
    scale: [1, 1.06, 0.98, 1],
    rotate: [0, -2, 1, 0],
    transition: {
      duration: 0.35,
      repeat: 2,
    },
  },
};

// Variantes para cartas jugadas en la mesa (bazas)
export const playedCardVariants: Variants = {
  initial: (isPlayer: boolean) => ({
    opacity: 0,
    scale: 0.75,
    y: isPlayer ? 60 : -60,
  }),
  animate: (customRotation: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    rotate: customRotation,
    transition: cardFlightTransition,
  }),
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20,
    transition: { duration: 0.2 },
  },
};

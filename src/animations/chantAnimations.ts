/**
 * Animaciones para los cantos y efectos visuales de exclamación
 */
import type { Variants } from 'motion/react';

export const chantBannerVariants: Variants = {
  initial: { opacity: 0, scale: 0.3, y: 30, rotate: -4 },
  animate: {
    opacity: 1,
    scale: [0.3, 1.15, 1],
    y: 0,
    rotate: [-4, 2, 0],
    transition: {
      duration: 0.35,
      times: [0, 0.7, 1],
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    y: -20,
    transition: { duration: 0.2 },
  },
};

export const speechBubbleVariants: Variants = {
  initial: { opacity: 0, scale: 0.85, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 450, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -5,
    transition: { duration: 0.15 },
  },
};

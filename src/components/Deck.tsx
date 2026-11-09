/**
 * Componente del Mazo Criollo de Baraja Española para la mesa de Truco
 * Muestra el pilón de cartas 3D con texturas tradicionales, borde de cartas apiladas,
 * e indicador interactivo de cartas restantes.
 */
import React from 'react';
import { motion } from 'motion/react';
import { deckPulseVariants } from '../animations/cardAnimations';
import { soundManager } from '../utils/soundManager';
import { Layers } from 'lucide-react';

interface DeckProps {
  isDealing?: boolean;
  cardsRemaining?: number;
  className?: string;
}

export const Deck: React.FC<DeckProps> = ({
  isDealing = false,
  cardsRemaining = 34,
  className = '',
}) => {
  const handleClick = () => {
    soundManager.playCardFlip();
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Contenedor del mazo con sombra 3D proyectada en el fieltro */}
      <motion.div
        variants={deckPulseVariants}
        animate={isDealing ? 'dealing' : 'idle'}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.98, y: 1 }}
        onClick={handleClick}
        className="relative cursor-pointer group"
        title="Mazo de Naipes Criollos (Haz clic para cortar)"
      >
        {/* Capas simulando el grosor de las 40 cartas apiladas */}
        {/* Capa inferior (base del mazo) */}
        <div className="absolute top-2.5 left-2.5 w-16 h-24 md:w-20 md:h-30 rounded-lg bg-stone-900 border border-stone-800 shadow-2xl" />
        {/* Capa intermedia 1 */}
        <div className="absolute top-1.5 left-1.5 w-16 h-24 md:w-20 md:h-30 rounded-lg bg-amber-950/70 border border-stone-700/80 shadow-md" />
        {/* Capa intermedia 2 (borde de papel apilado) */}
        <div className="absolute top-0.5 left-0.5 w-16 h-24 md:w-20 md:h-30 rounded-lg bg-stone-200 border border-stone-400 shadow-inner" />

        {/* Carta superior del mazo (reverso tradicional) */}
        <div className="relative w-16 h-24 md:w-20 md:h-30 rounded-lg p-1 bg-amber-50 border-2 border-stone-800 shadow-xl overflow-hidden">
          <div className="w-full h-full rounded border border-red-800 bg-red-900 flex flex-col items-center justify-between p-1 relative overflow-hidden">
            {/* Patrón tradicional de celosía española */}
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, #fef08a 0, #fef08a 2px, transparent 0, transparent 8px), repeating-linear-gradient(-45deg, #fef08a 0, #fef08a 2px, transparent 0, transparent 8px)',
                backgroundSize: '14px 14px',
              }}
            />

            {/* Borde interior dorado */}
            <div className="absolute inset-1 rounded border border-amber-400/40 pointer-events-none" />

            {/* Escudo central */}
            <div className="my-auto w-7 h-7 md:w-8 md:h-8 rounded-full border border-amber-300/50 bg-red-950/90 flex flex-col items-center justify-center z-10 shadow-inner">
              <span className="text-amber-200 font-display text-[9px] md:text-[10px] font-black tracking-widest">
                T
              </span>
            </div>

            {/* Brillo dinámico en reparto */}
            {isDealing && (
              <motion.div
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: '200%', opacity: [0, 0.6, 0] }}
                transition={{ duration: 0.6, repeat: 1, ease: 'easeInOut' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent skew-x-12 pointer-events-none"
              />
            )}
          </div>
        </div>

        {/* Partículas de cartas saliendo al repartir */}
        {isDealing && (
          <>
            <motion.div
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.9 }}
              animate={{ x: -35, y: 70, opacity: 0, scale: 0.6, rotate: -25 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="absolute top-2 left-2 w-12 h-18 rounded bg-red-900 border border-amber-300 shadow-lg pointer-events-none z-30"
            />
            <motion.div
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.9 }}
              animate={{ x: -35, y: -50, opacity: 0, scale: 0.6, rotate: 25 }}
              transition={{ duration: 0.45, delay: 0.08, ease: 'easeOut' }}
              className="absolute top-2 left-2 w-12 h-18 rounded bg-red-900 border border-amber-300 shadow-lg pointer-events-none z-30"
            />
          </>
        )}
      </motion.div>

      {/* Rótulo inferior del Mazo */}
      <div className="mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-900/80 border border-amber-900/40 text-[10px] text-amber-200/80 font-mono font-medium shadow-sm">
        <Layers className="w-2.5 h-2.5 text-amber-500" />
        <span>Mazo ({cardsRemaining})</span>
      </div>
    </div>
  );
};

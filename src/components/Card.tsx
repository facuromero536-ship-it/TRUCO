/**
 * Componente de Carta Española para Truco Argentino
 * Renderizado vectorial nítido con los 4 palos tradicionales: Espada, Basto, Oro y Copa.
 */
import React from 'react';
import { motion } from 'motion/react';
import { CardModel, CardSuit } from '../utils/constants';

interface CardProps {
  card?: CardModel | null;
  isFaceDown?: boolean;
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  rotation?: number;
  className?: string;
  badge?: string;
  layoutId?: string;
}

// Iconos vectoriales criollos de alta definición para cada palo
export const SuitIcon: React.FC<{ suit: CardSuit; className?: string }> = ({ suit, className = 'w-4 h-4' }) => {
  switch (suit) {
    case 'espada':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-blue-700 dark:text-blue-600 ${className}`}>
          {/* Espada española / florete */}
          <path d="M12 2L14 8L12 18L10 8Z" fill="#1e40af" stroke="#1e3a8a" />
          <line x1="7" y1="18" x2="17" y2="18" stroke="#1e3a8a" strokeWidth="2.5" />
          <path d="M10 18v3a2 2 0 0 0 4 0v-3" stroke="#1e3a8a" strokeWidth="2" fill="#3b82f6" />
          <circle cx="12" cy="22" r="1.5" fill="#1e3a8a" />
        </svg>
      );
    case 'basto':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`text-emerald-800 ${className}`}>
          {/* Porra / Clava de madera nudosa */}
          <path d="M10 22L13 22L15 8C15.5 5 13.5 2 12 2C10.5 2 8.5 5 9 8L11 22Z" fill="#15803d" stroke="#14532d" />
          <circle cx="10" cy="8" r="1.5" fill="#166534" />
          <circle cx="14" cy="12" r="1.2" fill="#166534" />
          <circle cx="11" cy="15" r="1.4" fill="#166534" />
          <path d="M15 6L18 5M8 10L6 9" stroke="#16a34a" strokeWidth="1.8" />
        </svg>
      );
    case 'oro':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={`text-amber-500 ${className}`}>
          {/* Moneda de oro con sol radiante */}
          <circle cx="12" cy="12" r="9" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
          <circle cx="12" cy="12" r="6.5" stroke="#d97706" strokeWidth="1" strokeDasharray="2 2" />
          {/* Rostro solar */}
          <circle cx="10" cy="10" r="1" fill="#78350f" />
          <circle cx="14" cy="10" r="1" fill="#78350f" />
          <path d="M10 14c.8 1 3.2 1 4 0" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
          {/* Rayos */}
          <line x1="12" y1="1" x2="12" y2="3" stroke="#b45309" strokeWidth="1.5" />
          <line x1="12" y1="21" x2="12" y2="23" stroke="#b45309" strokeWidth="1.5" />
          <line x1="1" y1="12" x2="3" y2="12" stroke="#b45309" strokeWidth="1.5" />
          <line x1="21" y1="12" x2="23" y2="12" stroke="#b45309" strokeWidth="1.5" />
        </svg>
      );
    case 'copa':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`text-red-600 ${className}`}>
          {/* Cáliz / Copa ornada */}
          <path d="M6 3h12l-1 8a5 5 0 0 1-5 4 5 5 0 0 1-5-4L6 3Z" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
          <path d="M12 15v5M9 20h6" stroke="#991b1b" strokeWidth="2" />
          <ellipse cx="12" cy="7" rx="3.5" ry="1.5" fill="#f87171" stroke="#991b1b" />
        </svg>
      );
  }
};

export const Card: React.FC<CardProps> = ({
  card,
  isFaceDown = false,
  isPlayable = false,
  isSelected = false,
  onClick,
  size = 'md',
  rotation = 0,
  className = '',
  badge,
  layoutId,
}) => {
  const sizeClasses = {
    sm: 'w-16 h-24 text-xs',
    md: 'w-24 h-36 md:w-28 md:h-42 text-sm',
    lg: 'w-28 h-42 md:w-36 md:h-52 text-base',
  };

  // Reverso de la carta tradicional española
  if (isFaceDown || !card) {
    return (
      <motion.div
        layoutId={layoutId}
        animate={{ rotate: rotation }}
        whileHover={onClick ? { scale: 1.05 } : undefined}
        className={`relative ${sizeClasses[size]} rounded-lg p-1.5 bg-amber-50 border-2 border-stone-800 card-shadow cursor-default select-none overflow-hidden ${className}`}
      >
        <div className="w-full h-full rounded border border-red-800 bg-red-900 flex items-center justify-center relative overflow-hidden">
          {/* Patrón geométrico de celosía tradicional */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #fef08a 0, #fef08a 2px, transparent 0, transparent 8px), repeating-linear-gradient(-45deg, #fef08a 0, #fef08a 2px, transparent 0, transparent 8px)',
              backgroundSize: '16px 16px',
            }}
          />
          <div className="w-8 h-8 rounded-full border border-amber-300/40 bg-red-950/80 flex items-center justify-center z-10 shadow-inner">
            <span className="text-amber-200 font-display text-xs font-bold tracking-widest">T</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Resaltado de cartas bravas / importantes
  const isMacho = card.value === 1 && card.suit === 'espada';
  const isHembra = card.value === 1 && card.suit === 'basto';
  const isSieteEspada = card.value === 7 && card.suit === 'espada';
  const isSieteOro = card.value === 7 && card.suit === 'oro';
  const isBrava = isMacho || isHembra || isSieteEspada || isSieteOro;

  return (
    <motion.button
      layoutId={layoutId}
      type="button"
      onClick={isPlayable && onClick ? onClick : undefined}
      disabled={!isPlayable}
      animate={{
        rotate: rotation,
        y: isSelected ? -16 : 0,
      }}
      whileHover={isPlayable ? { y: -18, scale: 1.06, rotate: 0 } : undefined}
      whileTap={isPlayable ? { scale: 0.96 } : undefined}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className={`group relative ${sizeClasses[size]} rounded-lg bg-stone-50 text-stone-900 border-2 transition-shadow select-none text-left p-1.5 flex flex-col justify-between overflow-hidden cursor-default ${
        isPlayable
          ? 'cursor-pointer hover:border-amber-500 border-stone-300 card-shadow hover:card-shadow-active ring-2 ring-amber-400/20'
          : 'border-stone-300 opacity-95 card-shadow'
      } ${isSelected ? 'border-amber-600 ring-4 ring-amber-500/50 card-shadow-active' : ''} ${className}`}
    >
      {/* Marco perimetral clásico de las cartas españolas */}
      <div className="absolute inset-1 rounded border border-stone-300/70 pointer-events-none" />

      {/* Esquina superior izquierda */}
      <div className="flex flex-col items-center leading-none z-10">
        <span className="font-bold text-stone-950 tracking-tighter text-sm md:text-base font-mono">
          {card.value}
        </span>
        <SuitIcon suit={card.suit} className="w-3.5 h-3.5 md:w-4 md:h-4 mt-0.5" />
      </div>

      {/* Ilustración central del naipe */}
      <div className="my-auto flex flex-col items-center justify-center z-10 py-1">
        {isBrava ? (
          <div className="relative flex flex-col items-center">
            <SuitIcon suit={card.suit} className="w-8 h-8 md:w-11 md:h-11 drop-shadow-sm" />
            <span className="text-[9px] uppercase tracking-wider font-semibold text-amber-900 font-display mt-0.5 px-1 bg-amber-100/90 rounded border border-amber-300">
              {isMacho ? 'Macho' : isHembra ? 'Hembra' : isSieteEspada ? '7 Brava' : '7 Oro'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <SuitIcon suit={card.suit} className="w-7 h-7 md:w-9 md:h-9 opacity-90" />
            {card.value >= 10 && (
              <span className="text-[9px] font-serif text-stone-600 font-medium tracking-tight">
                {card.value === 10 ? 'Sota' : card.value === 11 ? 'Caballo' : 'Rey'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Esquina inferior derecha (invertida) */}
      <div className="flex flex-col items-center leading-none z-10 rotate-180 self-end">
        <span className="font-bold text-stone-950 tracking-tighter text-sm md:text-base font-mono">
          {card.value}
        </span>
        <SuitIcon suit={card.suit} className="w-3.5 h-3.5 md:w-4 md:h-4 mt-0.5" />
      </div>

      {/* Badge decorativo si corresponde */}
      {badge && (
        <div className="absolute top-1 right-1 z-20 px-1 py-0.5 bg-amber-600 text-[9px] text-white font-medium rounded-sm shadow-sm">
          {badge}
        </div>
      )}
    </motion.button>
  );
};

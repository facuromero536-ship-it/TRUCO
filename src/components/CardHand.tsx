/**
 * Componente para mostrar la mano de cartas (Jugador o Rival)
 * Con animación de reparto desde el mazo y transición suave a la mesa usando Motion
 */
import React from 'react';
import { motion } from 'motion/react';
import { CardModel } from '../utils/constants';
import { Card } from './Card';
import { calculateEnvido } from '../game/envido';
import {
  dealToPlayerVariants,
  dealToAiVariants,
  cardFlightTransition,
} from '../animations/cardAnimations';

interface CardHandProps {
  cards: CardModel[];
  isAI?: boolean;
  isTurn?: boolean;
  onPlayCard?: (cardIndex: number, isFaceDown: boolean) => void;
  playFaceDown?: boolean;
  showEnvidoScore?: boolean;
  handNumber?: number;
}

export const CardHand: React.FC<CardHandProps> = ({
  cards,
  isAI = false,
  isTurn = false,
  onPlayCard,
  playFaceDown = false,
  showEnvidoScore = false,
  handNumber = 1,
}) => {
  const envidoInfo = !isAI && cards.length > 0 ? calculateEnvido(cards) : null;

  // Rotaciones sutiles para emular abanico de mano real
  const getFanRotation = (index: number, total: number) => {
    if (total === 1) return 0;
    if (total === 2) return index === 0 ? -4 : 4;
    return (index - 1) * 6; // -6, 0, +6
  };

  if (isAI) {
    return (
      <div className="flex flex-col items-center select-none">
        <div className="flex items-center justify-center -space-x-4 md:-space-x-6 py-1">
          {cards.map((card, idx) => (
            <motion.div
              key={`ai-hand-card-${card.id}-${handNumber}`}
              layoutId={`ai-card-${card.id}-${handNumber}`}
              custom={{ fanRotation: getFanRotation(idx, cards.length), index: idx }}
              variants={dealToAiVariants}
              initial="initial"
              animate="animate"
              transition={cardFlightTransition}
              className="relative z-10"
            >
              <Card
                isFaceDown={true}
                size="sm"
                rotation={0}
                className="shadow-md"
              />
            </motion.div>
          ))}
          {cards.length === 0 && (
            <div className="h-24 flex items-center justify-center text-xs text-stone-400 italic">
              Sin cartas en mano
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Tantos de envido en mano del jugador */}
      {showEnvidoScore && envidoInfo && (
        <div className="mb-2 px-3 py-1 bg-stone-900/80 backdrop-blur-sm rounded-full border border-stone-700/60 text-xs flex items-center gap-2 text-stone-300 shadow-sm">
          <span className="text-stone-400">Tantos de Envido:</span>
          <span className="font-bold text-amber-400 font-mono text-sm">{envidoInfo.score}</span>
          <span className="text-stone-400 text-[11px]">
            {envidoInfo.suit ? `(${envidoInfo.suit})` : ''}
          </span>
        </div>
      )}

      {/* Cartas del jugador con animación de reparto y vuelo */}
      <div className="flex items-center justify-center -space-x-3 md:-space-x-5 py-2">
        {cards.map((card, idx) => (
          <motion.div
            key={`player-hand-card-${card.id}-${handNumber}`}
            layoutId={`player-card-${card.id}-${handNumber}`}
            custom={{ fanRotation: getFanRotation(idx, cards.length), index: idx }}
            variants={dealToPlayerVariants}
            initial="initial"
            animate="animate"
            transition={cardFlightTransition}
            className="relative z-10"
          >
            <Card
              card={card}
              isPlayable={isTurn}
              rotation={0}
              onClick={() => onPlayCard && onPlayCard(idx, playFaceDown)}
              badge={playFaceDown ? 'Tapada' : undefined}
            />
          </motion.div>
        ))}

        {cards.length === 0 && (
          <div className="h-36 md:h-42 flex items-center justify-center text-xs text-stone-400 italic">
            Mano completada
          </div>
        )}
      </div>
    </div>
  );
};

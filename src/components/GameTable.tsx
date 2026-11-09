/**
 * Mesa de Juego de Truco Argentino (GameTable)
 * Mesa de fieltro con bordes de madera, zona de bazas (primera, segunda, tercera),
 * mazo criollo interactivo, oponente con avatar y bocadillos de diálogo, y zona del jugador.
 * Incluye transiciones suaves y fluidas de naipes con Motion.
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FullGameState } from '../game/gameState';
import { AI_PERSONALITIES } from '../game/ai';
import { CardHand } from './CardHand';
import { Card } from './Card';
import { Deck } from './Deck';
import { ActionPanel } from './ActionPanel';
import { chantBannerVariants, speechBubbleVariants } from '../animations/chantAnimations';
import { cardFlightTransition } from '../animations/cardAnimations';

interface GameTableProps {
  state: FullGameState;
  onPlayCard: (cardIndex: number, isFaceDown: boolean) => void;
  onCallEnvido: (call: any) => void;
  onCallTruco: () => void;
  onFold: () => void;
  playFaceDown: boolean;
  setPlayFaceDown: (val: boolean) => void;
}

export const GameTable: React.FC<GameTableProps> = ({
  state,
  onPlayCard,
  onCallEnvido,
  onCallTruco,
  onFold,
  playFaceDown,
  setPlayFaceDown,
}) => {
  const personality = AI_PERSONALITIES[state.aiPersonalityId];
  const isPlayerTurn = state.currentTurn === 'player' && !state.pendingCanto && !state.isProcessingAI;

  // Condiciones de cantos válidos
  // Envido: se puede cantar en la 1ra baza si aún no se cantó y antes de tirar la 2da carta
  const canCallEnvido = !state.envidoDone && state.trickIndex === 0 && isPlayerTurn && state.trucoState.stage === 'NONE';
  const canCallRealEnvido = canCallEnvido;
  const canCallFaltaEnvido = canCallEnvido;

  // Truco: se puede cantar en el turno del jugador si no se llegó al tope
  const canCallTruco = isPlayerTurn && state.trucoState.stage !== 'VALE_CUATRO' && (
    state.trucoState.stage === 'NONE' || state.trucoState.lastCaller === 'ai'
  );

  const nextTrucoLabel = state.trucoState.stage === 'NONE'
    ? 'Truco'
    : state.trucoState.stage === 'TRUCO'
    ? 'Quiero Re Truco'
    : state.trucoState.stage === 'RETRUCO'
    ? 'Quiero Vale Cuatro'
    : 'Vale Cuatro';

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-3xl p-3 md:p-6 bg-wood-grain border-4 border-stone-800 shadow-2xl overflow-hidden flex flex-col justify-between min-h-[580px] md:min-h-[660px]">
      {/* Tapete de Fieltro Verde Central */}
      <div className="absolute inset-2 md:inset-4 rounded-2xl bg-felt-pattern border-2 border-emerald-950/60 shadow-inner pointer-events-none" />

      {/* Iluminación cenital de pulpería */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none" />

      {/* BANNER GIGANTE DE CANTO (Truco / Envido / Victoria) */}
      <AnimatePresence>
        {state.bigCantoBanner && (
          <motion.div
            variants={chantBannerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-stone-50 font-display font-extrabold text-lg md:text-2xl shadow-2xl border-2 border-amber-300 tracking-wide text-center uppercase drop-shadow-xl"
          >
            {state.bigCantoBanner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= ZONA SUPERIOR: RIVAL (IA) ================= */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Fila del Rival: Avatar, Diálogo y Cartas */}
        <div className="w-full flex items-center justify-between px-3 md:px-6">
          {/* Info del Rival */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Avatar del gaucho */}
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-amber-500 overflow-hidden shadow-lg bg-stone-900">
                <img
                  src="/src/assets/images/gaucho_opponent_1794265280392.jpg"
                  alt={personality.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Indicador de Mano */}
              {state.initialMano === 'ai' && (
                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-amber-600 text-[10px] font-bold text-white rounded-full border border-stone-900 shadow">
                  Mano
                </div>
              )}
            </div>

            <div className="flex flex-col text-left">
              <span className="font-display font-bold text-sm md:text-base text-amber-100 flex items-center gap-1.5">
                {personality.name}
              </span>
              <span className="text-[11px] text-amber-300/80 italic font-serif">
                "{personality.nickname}"
              </span>
            </div>
          </div>

          {/* Diálogo / Bocadillo de la IA */}
          <AnimatePresence>
            {state.aiSpeechBubble && (
              <motion.div
                variants={speechBubbleVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="max-w-[220px] md:max-w-xs bg-stone-900/95 border border-amber-600/70 text-amber-200 text-xs md:text-sm px-3.5 py-2 rounded-2xl rounded-tl-none shadow-xl relative"
              >
                <p className="font-medium italic leading-snug">"{state.aiSpeechBubble}"</p>
                <div className="absolute top-2 -left-1.5 w-2 h-2 bg-stone-900 border-l border-t border-amber-600/70 rotate-[-45deg]" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cartas en mano de la IA (con animación de reparto desde el mazo) */}
          <CardHand cards={state.aiHand} isAI={true} handNumber={state.handNumber} />
        </div>
      </div>

      {/* ================= ZONA CENTRAL: LA MESA, EL MAZO Y LAS 3 BAZAS ================= */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-2 md:my-4">
        <div className="w-full max-w-3xl flex items-center justify-center gap-2 md:gap-5 px-1 md:px-3">
          {/* Zona de las 3 Bazas */}
          <div className="flex-1 max-w-2xl grid grid-cols-3 gap-2 md:gap-4">
            {[0, 1, 2].map(trickIdx => {
              const trick = state.tricks[trickIdx];
              const isCurrent = state.trickIndex === trickIdx;
              const roundNames = ['1ª Mano', '2ª Mano', '3ª Mano'];

              return (
                <div
                  key={`trick-zone-${trickIdx}`}
                  className={`relative rounded-xl p-2 md:p-2.5 flex flex-col items-center justify-between min-h-[160px] md:min-h-[190px] border transition-colors ${
                    isCurrent
                      ? 'bg-emerald-950/40 border-amber-500/40 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-emerald-950/20 border-emerald-900/30'
                  }`}
                >
                  {/* Título de la baza */}
                  <div className="w-full flex items-center justify-between text-[11px] text-emerald-300/80 font-display uppercase tracking-wider mb-1">
                    <span>{roundNames[trickIdx]}</span>
                    {trick.winner && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        trick.winner === 'player'
                          ? 'bg-amber-500/20 text-amber-300'
                          : trick.winner === 'ai'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-stone-500/20 text-stone-300'
                      }`}>
                        {trick.winner === 'player' ? 'Vos' : trick.winner === 'ai' ? 'Rival' : 'Parda'}
                      </span>
                    )}
                  </div>

                  {/* Carta tirada por el Rival en esta baza con transición suave */}
                  <div className="h-16 md:h-20 flex items-center justify-center">
                    {trick.aiCard ? (
                      <motion.div
                        key={`trick-ai-card-${trick.aiCard.card.id}-${state.handNumber}`}
                        layoutId={`ai-card-${trick.aiCard.card.id}-${state.handNumber}`}
                        transition={cardFlightTransition}
                        className="relative z-20 flex items-center justify-center"
                      >
                        <Card
                          card={trick.aiCard.card}
                          isFaceDown={trick.aiCard.isFaceDown}
                          size="sm"
                          rotation={-3}
                          className="shadow-xl"
                        />
                      </motion.div>
                    ) : (
                      <div className="w-12 h-16 rounded border border-dashed border-emerald-800/40 flex items-center justify-center text-[10px] text-emerald-600/60">
                        -
                      </div>
                    )}
                  </div>

                  {/* Divisor tenue entre rival y jugador */}
                  <div className="w-full border-t border-emerald-800/30 my-1" />

                  {/* Carta tirada por el Jugador en esta baza con transición suave */}
                  <div className="h-16 md:h-20 flex items-center justify-center">
                    {trick.playerCard ? (
                      <motion.div
                        key={`trick-player-card-${trick.playerCard.card.id}-${state.handNumber}`}
                        layoutId={`player-card-${trick.playerCard.card.id}-${state.handNumber}`}
                        transition={cardFlightTransition}
                        className="relative z-20 flex items-center justify-center"
                      >
                        <Card
                          card={trick.playerCard.card}
                          isFaceDown={trick.playerCard.isFaceDown}
                          size="sm"
                          rotation={2}
                          className="shadow-xl"
                        />
                      </motion.div>
                    ) : (
                      <div className="w-12 h-16 rounded border border-dashed border-emerald-800/40 flex items-center justify-center text-[10px] text-emerald-600/60">
                        -
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* El Mazo Criollo en el lateral derecho de la mesa de fieltro */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <Deck
              isDealing={state.isDealing}
              cardsRemaining={34}
              className="scale-90 md:scale-100"
            />
          </div>
        </div>
      </div>

      {/* ================= ZONA INFERIOR: JUGADOR (VOS) ================= */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        {/* Mano del jugador */}
        <div className="relative">
          {state.initialMano === 'player' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-600 text-[10px] font-bold text-white rounded-full border border-stone-900 shadow z-20">
              Sos Mano
            </div>
          )}

          <CardHand
            cards={state.playerHand}
            isTurn={isPlayerTurn}
            onPlayCard={onPlayCard}
            playFaceDown={playFaceDown}
            showEnvidoScore={true}
            handNumber={state.handNumber}
          />
        </div>

        {/* Panel de Botones de Canto y Acciones */}
        <ActionPanel
          isPlayerTurn={isPlayerTurn}
          canCallEnvido={canCallEnvido}
          canCallRealEnvido={canCallRealEnvido}
          canCallFaltaEnvido={canCallFaltaEnvido}
          canCallTruco={canCallTruco}
          trucoStage={state.trucoState.stage}
          nextTrucoLabel={nextTrucoLabel}
          onCallEnvido={onCallEnvido}
          onCallTruco={onCallTruco}
          onFold={onFold}
          playFaceDown={playFaceDown}
          setPlayFaceDown={setPlayFaceDown}
          isProcessing={state.isProcessingAI}
        />
      </div>
    </div>
  );
};

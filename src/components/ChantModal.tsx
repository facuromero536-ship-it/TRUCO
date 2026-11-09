/**
 * Modal y Diálogo de Respuesta a Cantos (Envido y Truco)
 * Permite responder Quiero, No Quiero o Subir la apuesta
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PendingCantoState } from '../game/gameState';

interface ChantModalProps {
  pendingCanto: PendingCantoState | null;
  opponentName: string;
  opponentPhrase?: string;
  onQuiero: () => void;
  onNoQuiero: () => void;
  onRaise: (raiseCall: string) => void;
  onFold: () => void;
}

export const ChantModal: React.FC<ChantModalProps> = ({
  pendingCanto,
  opponentName,
  opponentPhrase,
  onQuiero,
  onNoQuiero,
  onRaise,
  onFold,
}) => {
  if (!pendingCanto || pendingCanto.responder !== 'player') return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md rounded-2xl bg-stone-900 border-2 border-amber-600/60 p-6 shadow-2xl text-stone-100 flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Luz de fondo ambiental */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />

          {/* Emisor y Canto */}
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-display">
            {opponentName} cantó:
          </span>

          <h2 className="text-3xl md:text-4xl font-display font-extrabold text-amber-100 mt-1 mb-2 tracking-wide drop-shadow-md">
            ¡{pendingCanto.cantoName}!
          </h2>

          {/* Frase gaucha */}
          {opponentPhrase && (
            <p className="text-sm italic text-stone-300 bg-stone-800/80 px-4 py-2 rounded-lg border border-stone-700/60 mb-5">
              "{opponentPhrase}"
            </p>
          )}

          {/* Opciones de respuesta */}
          <div className="w-full flex flex-col gap-2.5">
            {/* Fila principal: Quiero y No Quiero */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onQuiero}
                className="py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-base shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>¡Quiero!</span>
              </button>

              <button
                type="button"
                onClick={onNoQuiero}
                className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 font-semibold text-base border border-stone-700 shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>No quiero</span>
              </button>
            </div>

            {/* Subir la apuesta (Retruco / Vale Cuatro / Real Envido / Falta Envido) */}
            {pendingCanto.options.canRaise && pendingCanto.options.raiseOptions.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-stone-800">
                <span className="text-xs text-stone-400 w-full text-center">O redoblá la apuesta:</span>
                {pendingCanto.options.raiseOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onRaise(option)}
                    className="py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow"
                  >
                    {option === 'ENVIDO' ? 'Envido' : option === 'REAL_ENVIDO' ? 'Real Envido' : option === 'FALTA_ENVIDO' ? 'Falta Envido' : option === 'RETRUCO' ? 'Quiero Re Truco' : 'Quiero Vale Cuatro'}
                  </button>
                ))}
              </div>
            )}

            {/* Opción de irse al mazo si es Truco */}
            {pendingCanto.type === 'TRUCO' && (
              <button
                type="button"
                onClick={onFold}
                className="mt-1 text-xs text-stone-400 hover:text-rose-300 transition-colors underline decoration-dotted py-1"
              >
                Me voy al mazo directamente
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

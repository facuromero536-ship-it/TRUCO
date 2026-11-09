/**
 * Panel de Acciones y Cantos del Jugador
 * Provee botones táctiles para cantar Envido, Real Envido, Falta Envido,
 * Truco, Retruco, Vale Cuatro, y retirarse al mazo.
 */
import React from 'react';
import { TrucoStage, EnvidoCall } from '../utils/constants';

interface ActionPanelProps {
  isPlayerTurn: boolean;
  canCallEnvido: boolean;
  canCallRealEnvido: boolean;
  canCallFaltaEnvido: boolean;
  canCallTruco: boolean;
  trucoStage: TrucoStage;
  nextTrucoLabel: string;
  onCallEnvido: (call: EnvidoCall) => void;
  onCallTruco: () => void;
  onFold: () => void;
  playFaceDown: boolean;
  setPlayFaceDown: (val: boolean) => void;
  isProcessing: boolean;
  disabledReason?: string;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  isPlayerTurn,
  canCallEnvido,
  canCallRealEnvido,
  canCallFaltaEnvido,
  canCallTruco,
  trucoStage,
  nextTrucoLabel,
  onCallEnvido,
  onCallTruco,
  onFold,
  playFaceDown,
  setPlayFaceDown,
  isProcessing,
  disabledReason,
}) => {
  const isBlocked = isProcessing;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-2 select-none px-2">
      {/* Fila principal de cantos */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
        {/* Grupo de Envido */}
        <div className="flex items-center gap-1 bg-stone-900/90 p-1 rounded-lg border border-stone-800">
          <button
            type="button"
            disabled={!canCallEnvido || isBlocked}
            onClick={() => onCallEnvido('ENVIDO')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              canCallEnvido && !isBlocked
                ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 shadow-sm cursor-pointer active:scale-95'
                : 'bg-stone-800/50 text-stone-600 cursor-not-allowed'
            }`}
          >
            Envido
          </button>

          <button
            type="button"
            disabled={!canCallRealEnvido || isBlocked}
            onClick={() => onCallEnvido('REAL_ENVIDO')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              canCallRealEnvido && !isBlocked
                ? 'bg-emerald-900 hover:bg-emerald-800 text-emerald-200 shadow-sm cursor-pointer active:scale-95'
                : 'bg-stone-800/50 text-stone-600 cursor-not-allowed'
            }`}
          >
            Real Envido
          </button>

          <button
            type="button"
            disabled={!canCallFaltaEnvido || isBlocked}
            onClick={() => onCallEnvido('FALTA_ENVIDO')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              canCallFaltaEnvido && !isBlocked
                ? 'bg-red-900 hover:bg-red-800 text-red-100 shadow-sm cursor-pointer active:scale-95'
                : 'bg-stone-800/50 text-stone-600 cursor-not-allowed'
            }`}
          >
            Falta Envido
          </button>
        </div>

        {/* Botón de Truco / Retruco / Vale Cuatro */}
        <button
          type="button"
          disabled={!canCallTruco || isBlocked}
          onClick={onCallTruco}
          className={`px-4 py-2 text-xs md:text-sm font-bold uppercase tracking-wider rounded-lg border transition-all whitespace-nowrap shrink-0 shadow-md ${
            canCallTruco && !isBlocked
              ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border-amber-400/50 cursor-pointer active:scale-95 ring-2 ring-amber-500/20'
              : 'bg-stone-800 text-stone-600 border-stone-800 cursor-not-allowed'
          }`}
        >
          {nextTrucoLabel}
        </button>

        {/* Opciones tácticas: Tapada y Mazo */}
        <div className="flex items-center gap-1.5 bg-stone-900/90 p-1 rounded-lg border border-stone-800">
          <button
            type="button"
            disabled={!isPlayerTurn || isBlocked}
            onClick={() => setPlayFaceDown(!playFaceDown)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              playFaceDown
                ? 'bg-amber-600 text-white font-bold ring-2 ring-amber-400/40'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full border border-stone-400 bg-stone-600" />
            Jugar Tapada
          </button>

          <button
            type="button"
            disabled={isBlocked}
            onClick={onFold}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Al Mazo
          </button>
        </div>
      </div>

      {/* Indicador de estado de turno */}
      <div className="text-center text-[11px] text-stone-400">
        {isBlocked ? (
          <span className="text-amber-400 animate-pulse">Pensando el rival...</span>
        ) : isPlayerTurn ? (
          <span className="text-emerald-400 font-medium">Es tu turno: podés jugar una carta o cantar</span>
        ) : (
          <span>Esperando que juegue el rival...</span>
        )}
      </div>
    </div>
  );
};

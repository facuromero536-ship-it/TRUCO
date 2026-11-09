/**
 * Historial de Manos y Jugadas (Game Log)
 */
import React from 'react';
import { GameLogEntry } from '../game/gameState';

interface GameLogProps {
  logs: GameLogEntry[];
  className?: string;
}

export const GameLog: React.FC<GameLogProps> = ({ logs, className = '' }) => {
  return (
    <div className={`rounded-xl bg-stone-900/90 border border-stone-800 p-3 flex flex-col h-full shadow-lg backdrop-blur-md select-none ${className}`}>
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
        <h4 className="font-display text-xs uppercase tracking-wider font-bold text-stone-300">
          Historial de Mano
        </h4>
        <span className="text-[11px] font-mono text-stone-500">
          {logs.length} jugadas
        </span>
      </div>

      {/* Lista de sucesos */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
        {logs.map(log => {
          const isPlayer = log.sender === 'player';
          const isAI = log.sender === 'ai';

          return (
            <div
              key={log.id}
              className={`p-2 rounded-lg border text-left leading-relaxed ${
                isPlayer
                  ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                  : isAI
                  ? 'bg-stone-800/40 border-stone-700/40 text-stone-300'
                  : 'bg-stone-950/40 border-stone-800/30 text-stone-400'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-stone-500 mb-0.5">
                <span className="font-semibold uppercase tracking-tight">
                  {isPlayer ? 'Vos' : isAI ? 'Rival' : 'Mesa'}
                </span>
                <span className="font-mono">{log.timestamp}</span>
              </div>
              <p className="font-normal">{log.message}</p>
            </div>
          );
        })}

        {logs.length === 0 && (
          <div className="text-center py-6 text-stone-500 text-xs italic">
            Esperando primera jugada...
          </div>
        )}
      </div>
    </div>
  );
};

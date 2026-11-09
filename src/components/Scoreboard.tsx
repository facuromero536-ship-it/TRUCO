/**
 * Anotador Tradicional de Truco Argentino con Fósforos
 * Dibuja los fósforos en cuadrados de a 5 palitos (izq, arriba, der, abajo, diagonal)
 * Divide en "Malas" (15) y "Buenas" (15) si el partido es a 30.
 */
import React from 'react';
import { getScoreBreakdown, ScoreGroup } from '../game/scoring';

interface ScoreboardProps {
  playerScore: number;
  aiScore: number;
  targetPoints: 15 | 30;
  aiName?: string;
  className?: string;
}

// Renderiza un cuadrado tradicional de hasta 5 fósforos
export const MatchstickSquare: React.FC<{ count: number; className?: string }> = ({ count, className = '' }) => {
  // count: 0..5
  const hasLeft = count >= 1;
  const hasTop = count >= 2;
  const hasRight = count >= 3;
  const hasBottom = count >= 4;
  const hasDiagonal = count >= 5;

  return (
    <div className={`relative w-8 h-8 md:w-9 md:h-9 flex items-center justify-center p-0.5 select-none ${className}`}>
      <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-sm overflow-visible">
        {/* Fósforo Izquierdo (1) */}
        {hasLeft && (
          <g className="match-appear">
            <line x1="8" y1="8" x2="8" y2="32" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round" />
            <circle cx="8" cy="8" r="2.8" fill="#dc2626" />
          </g>
        )}

        {/* Fósforo Superior (2) */}
        {hasTop && (
          <g className="match-appear">
            <line x1="8" y1="8" x2="32" y2="8" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round" />
            <circle cx="32" cy="8" r="2.8" fill="#dc2626" />
          </g>
        )}

        {/* Fósforo Derecho (3) */}
        {hasRight && (
          <g className="match-appear">
            <line x1="32" y1="8" x2="32" y2="32" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round" />
            <circle cx="32" cy="32" r="2.8" fill="#dc2626" />
          </g>
        )}

        {/* Fósforo Inferior (4) */}
        {hasBottom && (
          <g className="match-appear">
            <line x1="8" y1="32" x2="32" y2="32" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round" />
            <circle cx="8" cy="32" r="2.8" fill="#dc2626" />
          </g>
        )}

        {/* Fósforo Diagonal (5) */}
        {hasDiagonal && (
          <g className="match-appear">
            <line x1="8" y1="8" x2="32" y2="32" stroke="#fef08a" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="32" cy="32" r="3" fill="#b91c1c" />
          </g>
        )}
      </svg>
    </div>
  );
};

// Renderiza una columna completa de fósforos (hasta 3 grupos de 5 = 15 puntos)
const MatchstickColumn: React.FC<{ matches: ScoreGroup }> = ({ matches }) => {
  const groups: number[] = [];
  for (let i = 0; i < matches.fullFives; i++) {
    groups.push(5);
  }
  if (matches.remainder > 0) {
    groups.push(matches.remainder);
  }

  // Si está vacío, mostrar marco tenue de fósforo vacío
  if (groups.length === 0) {
    return (
      <div className="w-8 h-8 md:w-9 md:h-9 border border-dashed border-stone-700/40 rounded flex items-center justify-center opacity-40">
        <span className="text-[10px] text-stone-500 font-mono">0</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 items-center">
      {groups.map((val, idx) => (
        <MatchstickSquare key={`sq-${idx}`} count={val} />
      ))}
    </div>
  );
};

export const Scoreboard: React.FC<ScoreboardProps> = ({
  playerScore,
  aiScore,
  targetPoints,
  aiName = 'El Rival',
  className = '',
}) => {
  const playerBreakdown = getScoreBreakdown(playerScore, targetPoints);
  const aiBreakdown = getScoreBreakdown(aiScore, targetPoints);

  const isTo30 = targetPoints === 30;

  return (
    <div className={`rounded-xl bg-stone-900/95 border border-amber-900/40 p-3 shadow-xl backdrop-blur-md select-none text-stone-200 ${className}`}>
      {/* Encabezado del Anotador */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500/80" />
          <h3 className="font-display font-bold text-xs uppercase tracking-widest text-amber-200">
            Anotador de Truco
          </h3>
        </div>
        <span className="text-[11px] font-mono text-stone-400">
          A {targetPoints} pts
        </span>
      </div>

      {/* Tabla Nosotros vs Ellos */}
      <div className="grid grid-cols-2 divide-x divide-stone-800 gap-2">
        {/* Columna NOSOTROS (Jugador) */}
        <div className="flex flex-col items-center px-2">
          <div className="text-center mb-2">
            <span className="font-bold text-xs text-amber-400 font-display uppercase tracking-wider block">
              Nosotros
            </span>
            <span className="text-2xl font-bold font-mono text-stone-100 tabular-nums">
              {playerScore}
            </span>
          </div>

          {/* Grilla de Malas / Buenas */}
          {isTo30 ? (
            <div className="w-full flex justify-around gap-2 text-center text-[10px] uppercase font-semibold text-stone-400 border-t border-stone-800/80 pt-2">
              <div className="flex flex-col items-center">
                <span className="text-stone-400 mb-1">Malas ({playerBreakdown.malasPoints})</span>
                <MatchstickColumn matches={playerBreakdown.malasMatches} />
              </div>
              <div className="flex flex-col items-center">
                <span className={`mb-1 ${playerBreakdown.isBuenas ? 'text-amber-400 font-bold' : 'text-stone-500'}`}>
                  Buenas ({playerBreakdown.buenasPoints})
                </span>
                <MatchstickColumn matches={playerBreakdown.buenasMatches} />
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center border-t border-stone-800/80 pt-2">
              <span className="text-[10px] text-stone-400 mb-1">Puntos</span>
              <MatchstickColumn matches={playerBreakdown.malasMatches} />
            </div>
          )}
        </div>

        {/* Columna ELLOS (IA) */}
        <div className="flex flex-col items-center px-2">
          <div className="text-center mb-2">
            <span className="font-bold text-xs text-amber-300/80 font-display uppercase tracking-wider block truncate max-w-[90px]">
              {aiName}
            </span>
            <span className="text-2xl font-bold font-mono text-stone-100 tabular-nums">
              {aiScore}
            </span>
          </div>

          {/* Grilla de Malas / Buenas */}
          {isTo30 ? (
            <div className="w-full flex justify-around gap-2 text-center text-[10px] uppercase font-semibold text-stone-400 border-t border-stone-800/80 pt-2">
              <div className="flex flex-col items-center">
                <span className="text-stone-400 mb-1">Malas ({aiBreakdown.malasPoints})</span>
                <MatchstickColumn matches={aiBreakdown.malasMatches} />
              </div>
              <div className="flex flex-col items-center">
                <span className={`mb-1 ${aiBreakdown.isBuenas ? 'text-amber-400 font-bold' : 'text-stone-500'}`}>
                  Buenas ({aiBreakdown.buenasPoints})
                </span>
                <MatchstickColumn matches={aiBreakdown.buenasMatches} />
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center border-t border-stone-800/80 pt-2">
              <span className="text-[10px] text-stone-400 mb-1">Puntos</span>
              <MatchstickColumn matches={aiBreakdown.malasMatches} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

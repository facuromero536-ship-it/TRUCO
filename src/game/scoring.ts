/**
 * Manejo del tanteador tradicional de Truco (Anotador de Fósforos)
 * Divide en "Malas" (primeros 15 pts) y "Buenas" (últimos 15 pts) cuando se juega a 30 puntos.
 */

export interface ScoreGroup {
  fullFives: number; // Cantidad de cuadrados de 5 fósforos
  remainder: number; // Resto 1..4 fósforos
}

export function calculateMatchsticks(score: number, maxCategoryPoints = 15): ScoreGroup {
  const boundedScore = Math.min(score, maxCategoryPoints);
  return {
    fullFives: Math.floor(boundedScore / 5),
    remainder: boundedScore % 5,
  };
}

export interface PlayerScoreBreakdown {
  total: number;
  isBuenas: boolean; // Si ya pasó a las buenas (en juego a 30)
  malasPoints: number;
  buenasPoints: number;
  malasMatches: ScoreGroup;
  buenasMatches: ScoreGroup;
}

export function getScoreBreakdown(score: number, targetPoints: number): PlayerScoreBreakdown {
  if (targetPoints === 15) {
    const matches = calculateMatchsticks(score, 15);
    return {
      total: score,
      isBuenas: false,
      malasPoints: Math.min(score, 15),
      buenasPoints: 0,
      malasMatches: matches,
      buenasMatches: { fullFives: 0, remainder: 0 },
    };
  }

  // Partido a 30 puntos
  const malasPoints = Math.min(score, 15);
  const buenasPoints = Math.max(0, Math.min(score - 15, 15));

  return {
    total: score,
    isBuenas: score > 15,
    malasPoints,
    buenasPoints,
    malasMatches: calculateMatchsticks(malasPoints, 15),
    buenasMatches: calculateMatchsticks(buenasPoints, 15),
  };
}

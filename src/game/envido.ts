/**
 * Lógica y cálculo del Envido y Flor en el Truco Argentino
 */
import { CardModel, CardSuit, EnvidoCall } from '../utils/constants';

export interface EnvidoResult {
  score: number;
  suit: CardSuit | null;
  cardsInvolved: CardModel[];
}

export function calculateEnvido(cards: CardModel[]): EnvidoResult {
  if (!cards || cards.length === 0) {
    return { score: 0, suit: null, cardsInvolved: [] };
  }

  // Agrupar por palo
  const bySuit: Record<CardSuit, CardModel[]> = {
    espada: [],
    basto: [],
    oro: [],
    copa: [],
  };

  cards.forEach(card => {
    bySuit[card.suit].push(card);
  });

  let bestScore = 0;
  let bestSuit: CardSuit | null = null;
  let bestCards: CardModel[] = [];

  // Buscar palos con 2 o 3 cartas
  for (const suitKey of Object.keys(bySuit) as CardSuit[]) {
    const group = bySuit[suitKey];
    if (group.length >= 2) {
      // Ordenar por valor de envido descendente
      const sorted = [...group].sort((a, b) => b.envidoValue - a.envidoValue);
      const score = 20 + sorted[0].envidoValue + sorted[1].envidoValue;
      if (score > bestScore) {
        bestScore = score;
        bestSuit = suitKey;
        bestCards = [sorted[0], sorted[1]];
      }
    }
  }

  // Si todas son de distinto palo, el envido es la carta más alta
  if (bestScore === 0) {
    const sorted = [...cards].sort((a, b) => b.envidoValue - a.envidoValue);
    bestScore = sorted[0].envidoValue;
    bestSuit = sorted[0].suit;
    bestCards = [sorted[0]];
  }

  return {
    score: bestScore,
    suit: bestSuit,
    cardsInvolved: bestCards,
  };
}

export function checkFlor(cards: CardModel[]): { hasFlor: boolean; suit: CardSuit | null; score: number } {
  if (cards.length < 3) return { hasFlor: false, suit: null, score: 0 };
  const firstSuit = cards[0].suit;
  const isFlor = cards.every(c => c.suit === firstSuit);
  if (!isFlor) return { hasFlor: false, suit: null, score: 0 };

  const score = 20 + cards[0].envidoValue + cards[1].envidoValue + cards[2].envidoValue;
  return { hasFlor: true, suit: firstSuit, score };
}

export interface EnvidoChainState {
  calls: EnvidoCall[];
  lastCaller: 'player' | 'ai';
  pointsIfAccepted: number;
  pointsIfDeclined: number;
}

/**
 * Calcula los puntos acumulados en la cadena de cantos de envido
 */
export function calculateEnvidoPoints(
  calls: EnvidoCall[],
  targetPoints: number,
  playerScore: number,
  aiScore: number
): { pointsIfAccepted: number; pointsIfDeclined: number } {
  if (calls.length === 0) return { pointsIfAccepted: 0, pointsIfDeclined: 0 };

  const lastCall = calls[calls.length - 1];

  // Caso Falta Envido
  if (lastCall === 'FALTA_ENVIDO') {
    // Si se rechaza Falta Envido, se pagan los puntos de los cantos previos acumulados (o 1 si fue de entrada)
    const prevCalls = calls.slice(0, calls.length - 1);
    let declinedPts = 1;
    if (prevCalls.length > 0) {
      // Suma de cantos previos
      declinedPts = calculateEnvidoPoints(prevCalls, targetPoints, playerScore, aiScore).pointsIfAccepted;
    }

    // Si se acepta Falta Envido:
    // En las buenas (alguien >= 15 si es a 30): lo que le falta al que va ganando para terminar el chico/partido.
    // O puntos restantes para coronar el partido.
    const maxScore = Math.max(playerScore, aiScore);
    const needed = Math.max(1, targetPoints - maxScore);

    return {
      pointsIfAccepted: needed,
      pointsIfDeclined: declinedPts,
    };
  }

  // Combinaciones clásicas
  // 'ENVIDO' -> 2 pts (no quiero = 1)
  // 'ENVIDO' + 'ENVIDO' -> 4 pts (no quiero = 2)
  // 'REAL_ENVIDO' -> 3 pts (no quiero = 1)
  // 'ENVIDO' + 'REAL_ENVIDO' -> 5 pts (no quiero = 2)
  // 'ENVIDO' + 'ENVIDO' + 'REAL_ENVIDO' -> 7 pts (no quiero = 4)
  let accepted = 0;
  let declined = 1;

  if (calls.length === 1) {
    if (calls[0] === 'ENVIDO') {
      accepted = 2;
      declined = 1;
    } else if (calls[0] === 'REAL_ENVIDO') {
      accepted = 3;
      declined = 1;
    }
  } else if (calls.length === 2) {
    if (calls[0] === 'ENVIDO' && calls[1] === 'ENVIDO') {
      accepted = 4;
      declined = 2;
    } else if (calls[0] === 'ENVIDO' && calls[1] === 'REAL_ENVIDO') {
      accepted = 5;
      declined = 2;
    } else if (calls[0] === 'REAL_ENVIDO' && calls[1] === 'FALTA_ENVIDO') {
      // handled above
    }
  } else if (calls.length === 3) {
    if (calls[0] === 'ENVIDO' && calls[1] === 'ENVIDO' && calls[2] === 'REAL_ENVIDO') {
      accepted = 7;
      declined = 4;
    }
  } else {
    // Genérico
    accepted = calls.reduce((acc, c) => acc + (c === 'ENVIDO' ? 2 : c === 'REAL_ENVIDO' ? 3 : 0), 0);
    declined = Math.max(1, accepted - 2);
  }

  return {
    pointsIfAccepted: accepted,
    pointsIfDeclined: declined,
  };
}

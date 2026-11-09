/**
 * Reglas de comparación de manos y resolución de bazas en el Truco Argentino
 */
import { CardModel } from '../utils/constants';

export type TrickWinner = 'player' | 'ai' | 'parda';

export interface PlayedCard {
  card: CardModel;
  playedBy: 'player' | 'ai';
  isFaceDown?: boolean;
}

export function compareCards(
  cardPlayer: PlayedCard,
  cardAI: PlayedCard
): TrickWinner {
  // Manejo de cartas tapadas (jugar al revés)
  if (cardPlayer.isFaceDown && cardAI.isFaceDown) return 'parda';
  if (cardPlayer.isFaceDown) return 'ai';
  if (cardAI.isFaceDown) return 'player';

  // En Truco, menor número de rank = carta más fuerte
  if (cardPlayer.card.rank < cardAI.card.rank) {
    return 'player';
  } else if (cardAI.card.rank < cardPlayer.card.rank) {
    return 'ai';
  } else {
    return 'parda';
  }
}

/**
 * Determina si la mano terminó y quién es el ganador general de la ronda
 * Retorna null si la mano sigue en juego
 */
export function determineHandWinner(
  trickWinners: TrickWinner[],
  initialMano: 'player' | 'ai'
): 'player' | 'ai' | null {
  if (trickWinners.length === 0) return null;

  const playerWins = trickWinners.filter(w => w === 'player').length;
  const aiWins = trickWinners.filter(w => w === 'ai').length;

  // Si alguien ya ganó 2 bazas limpias
  if (playerWins >= 2) return 'player';
  if (aiWins >= 2) return 'ai';

  // Si se jugó la 1ra baza
  if (trickWinners.length === 1) {
    return null; // Aún falta jugar al menos la 2da baza
  }

  // Si se jugaron 2 bazas
  if (trickWinners.length === 2) {
    const [w1, w2] = trickWinners;

    // Caso 1: 1ra baza parda
    if (w1 === 'parda') {
      if (w2 === 'player') return 'player';
      if (w2 === 'ai') return 'ai';
      // Si la 2da también es parda, se define en la 3ra
      return null;
    }

    // Caso 2: 1ra baza la ganó alguien y la 2da fue parda
    if (w2 === 'parda') {
      return w1 === 'player' ? 'player' : 'ai';
    }

    // Caso 3: Cada uno ganó una baza (1 a 1), se va a la 3ra baza
    if (playerWins === 1 && aiWins === 1) {
      return null;
    }
  }

  // Si se jugaron las 3 bazas
  if (trickWinners.length === 3) {
    const [w1, w2, w3] = trickWinners;

    // Si alguien ganó la 3ra baza
    if (w3 === 'player') return 'player';
    if (w3 === 'ai') return 'ai';

    // Si la 3ra baza fue parda
    if (w3 === 'parda') {
      // Si hubo parda en la primera y segunda también: gana la Mano
      if (w1 === 'parda' && w2 === 'parda') {
        return initialMano;
      }
      // Si uno ganó la 1ra y el otro la 2da, y la 3ra parda: gana quien ganó la primera baza
      if (w1 === 'player') return 'player';
      if (w1 === 'ai') return 'ai';
    }
  }

  return null;
}

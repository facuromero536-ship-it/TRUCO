/**
 * Mazo de Baraja Española para Truco Argentino (40 cartas)
 */
import { CardModel, CardSuit } from '../utils/constants';
import { shuffleArray } from '../utils/random';

export function getCardRank(suit: CardSuit, value: number): number {
  if (value === 1 && suit === 'espada') return 1; // Ancho de espada
  if (value === 1 && suit === 'basto') return 2;  // Ancho de basto
  if (value === 7 && suit === 'espada') return 3; // Siete de espada
  if (value === 7 && suit === 'oro') return 4;    // Siete de oro
  if (value === 3) return 5;                      // Todos los 3
  if (value === 2) return 6;                      // Todos los 2
  if (value === 1 && (suit === 'copa' || suit === 'oro')) return 7; // Anchos falsos
  if (value === 12) return 8;                     // Reyes
  if (value === 11) return 9;                     // Caballos
  if (value === 10) return 10;                    // Sotas
  if (value === 7 && (suit === 'copa' || suit === 'basto')) return 11; // Sietes falsos
  if (value === 6) return 12;                     // Seises
  if (value === 5) return 13;                     // Cincos
  if (value === 4) return 14;                     // Cuatros (más bajas)
  return 15;
}

export function getEnvidoValue(value: number): number {
  if (value >= 10) return 0; // Figuras valen 0
  return value;
}

export function getCardTitle(suit: CardSuit, value: number): string {
  const suitNames: Record<CardSuit, string> = {
    espada: 'Espada',
    basto: 'Basto',
    oro: 'Oro',
    copa: 'Copa',
  };

  if (value === 1 && suit === 'espada') return '1 de Espadas (El Macho)';
  if (value === 1 && suit === 'basto') return '1 de Bastos (La Hembra)';
  if (value === 7 && suit === 'espada') return '7 de Espadas (Manila)';
  if (value === 7 && suit === 'oro') return '7 de Oro (Manilón)';
  if (value === 10) return `10 de ${suitNames[suit]} (Sota)`;
  if (value === 11) return `11 de ${suitNames[suit]} (Caballo)`;
  if (value === 12) return `12 de ${suitNames[suit]} (Rey)`;
  return `${value} de ${suitNames[suit]}`;
}

export function createDeck(): CardModel[] {
  const suits: CardSuit[] = ['espada', 'basto', 'oro', 'copa'];
  const values = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  const deck: CardModel[] = [];

  for (const suit of suits) {
    for (const value of values) {
      deck.push({
        id: `${value}_${suit}`,
        suit,
        value,
        rank: getCardRank(suit, value),
        envidoValue: getEnvidoValue(value),
        name: getCardTitle(suit, value),
      });
    }
  }

  return deck;
}

export function dealCards(): { playerHand: CardModel[]; aiHand: CardModel[]; remainingDeck: CardModel[] } {
  const shuffled = shuffleArray(createDeck());
  const playerHand = [shuffled[0], shuffled[2], shuffled[4]];
  const aiHand = [shuffled[1], shuffled[3], shuffled[5]];
  const remainingDeck = shuffled.slice(6);
  return { playerHand, aiHand, remainingDeck };
}

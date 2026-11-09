/**
 * Inteligencia Artificial para Truco Argentino
 * Soporta 3 personalidades criollas con estilos de juego, faroleo y frases auténticas.
 */
import { CardModel, AIPersonality, AIPersonalityId, TrucoStage, EnvidoCall } from '../utils/constants';
import { calculateEnvido } from './envido';
import { pickRandom, rollChance } from '../utils/random';
import { PlayedCard } from './rules';

export const AI_PERSONALITIES: Record<AIPersonalityId, AIPersonality> = {
  gaucho: {
    id: 'gaucho',
    name: 'Don Segundo',
    nickname: 'El Gaucho Cauto',
    avatar: 'gaucho',
    description: 'Jugador tradicional de pulpería. Calmo, analiza los tantos y no regala un solo punto.',
    bluffRate: 0.15,
    envidoAggressiveness: 0.45,
    trucoAggressiveness: 0.45,
    voicePitch: 0.9,
    voiceRate: 1.0,
    phrases: {
      truco: ['¡Truco!', '¡Se vino el Truco!', '¡Le canto Truco paisano!'],
      retruco: ['¡Quiero re truco!', '¡Venga ese re truco!'],
      valeCuatro: ['¡Quiero cuatro!', '¡Se pudrió todo: cuatro!'],
      envido: ['¡Envido!', 'Tengo lindo palo... ¡Envido!'],
      realEnvido: ['¡Real Envido!', '¡Real Envido a ver qué tiene!'],
      faltaEnvido: ['¡Falta Envido carajo!'],
      quiero: ['¡Se juega!', '¡Quiero!', '¡Quiero verle la cara!'],
      noQuiero: ['Paso esta vuelta...', 'No quiero.', 'Son suyos los puntos.'],
      fold: ['Me voy al mazo che, no tengo nada.', 'Al mazo esta mano.'],
      winHand: ['¡Linda mano!', 'Así se juega al truco.', 'Para el buche.'],
      loseHand: ['Buena mano paisano.', 'Se la llevó bien.'],
      boastEnvido: ['¡31 son mejores!', '¡Tengo 29!', '¡33 de mano!'],
      sonBuenas: ['Son buenas paisano...', 'Buenas son.', 'Tiene más.'],
    },
  },
  farolero: {
    id: 'farolero',
    name: 'El Chaqueño',
    nickname: 'El Farolero Bravo',
    avatar: 'farolero',
    description: 'Bravucón y audaz. Canta con cualquier carta, le encanta el barro y farolea sin miedo.',
    bluffRate: 0.45,
    envidoAggressiveness: 0.75,
    trucoAggressiveness: 0.75,
    voicePitch: 1.1,
    voiceRate: 1.15,
    phrases: {
      truco: ['¡TRUCO CARAJO!', '¡Truco si es que tiene agallas!', '¡Truco a ver si tiembla!'],
      retruco: ['¡QUIERO RE TRUCO!', '¡Re truco que no me achico!'],
      valeCuatro: ['¡QUIERO VALE CUATRO!', '¡Póngale la firma: cuatro!'],
      envido: ['¡Envido canté!', '¡Envido de entrada nomás!'],
      realEnvido: ['¡Real Envido, metele!', '¡Real Envido que sobra paño!'],
      faltaEnvido: ['¡Falta Envido o nada!', '¡Falta Envido a los bifes!'],
      quiero: ['¡QUIERO!', '¡Quiero con furia!', '¡Adentro!'],
      noQuiero: ['No quiero nada.', 'Andá a cobrar.', 'No me interesa.'],
      fold: ['¡Al mazo! Guarde esa mugre.', 'Me voy al mazo pero ya vuelvo.'],
      winHand: ['¡Ja! ¡Se la comió doblada!', '¡Tomá mate y avivate!'],
      loseHand: ['Mucha suerte tuvo usted...', 'La próxima no pasa.'],
      boastEnvido: ['¡32 de oro canté!', '¡33 con flor si tuviera!', '¡Ganan las mías!'],
      sonBuenas: ['Buenas son, pero con trampa...', 'Pfff, son buenas.'],
    },
  },
  calculador: {
    id: 'calculador',
    name: 'El Pibe de San Telmo',
    nickname: 'El Calculador',
    avatar: 'calculador',
    description: 'Estratega de café de Buenos Aires. Cuenta cada carta y calcula probabilidades exactas.',
    bluffRate: 0.22,
    envidoAggressiveness: 0.55,
    trucoAggressiveness: 0.55,
    voicePitch: 1.0,
    voiceRate: 1.05,
    phrases: {
      truco: ['Truco...', 'Le conviene ir al mazo: Truco.', 'Truco jugado.'],
      retruco: ['Quiero re truco, los números me dan.', 'Re truco.'],
      valeCuatro: ['Vale cuatro, no le queda otra.', 'Cuatro canté.'],
      envido: ['Envido...', 'Jugamos envido.'],
      realEnvido: ['Real Envido.', 'Subo a Real Envido.'],
      faltaEnvido: ['Falta Envido. Matemáticas puras.'],
      quiero: ['Quiero.', 'Se acepta.', 'Adentro.'],
      noQuiero: ['No quiero.', 'No tiene valor esperado.', 'Paso.'],
      fold: ['Me voy al mazo, posición perdida.', 'Al mazo.'],
      winHand: ['Mano resuelta con precisión.', 'Puntos al tanteador.'],
      loseHand: ['Bien jugada esa baza.', 'Margen estrecho.'],
      boastEnvido: ['30 exactos.', 'Las mías suman más.', '31 en mano.'],
      sonBuenas: ['Son buenas.', 'Reconozco sus tantos.'],
    },
  },
};

/**
 * Decisión de respuesta ante un canto de Envido del jugador
 */
export function decideEnvidoResponse(
  aiCards: CardModel[],
  envidoChain: EnvidoCall[],
  personality: AIPersonality,
  isAIMano: boolean
): { action: 'QUIERO' | 'NO_QUIERO' | 'RAISE'; raiseCall?: EnvidoCall; phrase: string } {
  const envidoResult = calculateEnvido(aiCards);
  const score = envidoResult.score;
  const lastCall = envidoChain[envidoChain.length - 1];

  // Umbral base
  // En Truco, 28+ es bueno, 30+ es excelente, 33 es invencible.
  // Si AI es mano, gana los empates (muy valioso con 28-29).
  const effectiveScore = isAIMano ? score + 1.2 : score;
  const isBluffing = rollChance(personality.bluffRate * 0.4);

  if (lastCall === 'ENVIDO') {
    if (effectiveScore >= 31 || (effectiveScore >= 29 && personality.envidoAggressiveness > 0.6)) {
      // Subir a Real Envido o Falta
      if (effectiveScore >= 32 && rollChance(0.6)) {
        return { action: 'RAISE', raiseCall: 'REAL_ENVIDO', phrase: pickRandom(personality.phrases.realEnvido) };
      }
      return { action: 'QUIERO', phrase: pickRandom(personality.phrases.quiero) };
    }
    if (effectiveScore >= 26 || (effectiveScore >= 23 && isBluffing)) {
      return { action: 'QUIERO', phrase: pickRandom(personality.phrases.quiero) };
    }
    return { action: 'NO_QUIERO', phrase: pickRandom(personality.phrases.noQuiero) };
  }

  if (lastCall === 'REAL_ENVIDO' || lastCall === 'ENVIDO_ENVIDO') {
    if (effectiveScore >= 30 || (effectiveScore >= 28 && isAIMano)) {
      return { action: 'QUIERO', phrase: pickRandom(personality.phrases.quiero) };
    }
    if (effectiveScore >= 27 && isBluffing) {
      return { action: 'QUIERO', phrase: pickRandom(personality.phrases.quiero) };
    }
    return { action: 'NO_QUIERO', phrase: pickRandom(personality.phrases.noQuiero) };
  }

  if (lastCall === 'FALTA_ENVIDO') {
    // Falta envido es a todo o nada
    if (score >= 31 || (score >= 30 && isAIMano) || (score >= 29 && isBluffing)) {
      return { action: 'QUIERO', phrase: pickRandom(personality.phrases.quiero) };
    }
    return { action: 'NO_QUIERO', phrase: pickRandom(personality.phrases.noQuiero) };
  }

  return { action: 'QUIERO', phrase: pickRandom(personality.phrases.quiero) };
}

/**
 * Decisión de si la IA quiere cantar Envido de entrada
 */
export function decideEnvidoCall(
  aiCards: CardModel[],
  personality: AIPersonality,
  isAIMano: boolean
): EnvidoCall | null {
  const envidoResult = calculateEnvido(aiCards);
  const score = envidoResult.score;
  const isBluff = rollChance(personality.bluffRate * 0.35);

  if (score >= 31 || (score >= 29 && isAIMano)) {
    if (score >= 32 && rollChance(0.35 * personality.envidoAggressiveness)) {
      return 'REAL_ENVIDO';
    }
    return 'ENVIDO';
  }

  if (score >= 27 && rollChance(personality.envidoAggressiveness)) {
    return 'ENVIDO';
  }

  if (isBluff && rollChance(0.2)) {
    return 'ENVIDO';
  }

  return null;
}

/**
 * Evaluación de la fuerza de la mano de truco restante
 * (Ranks: 1..14 donde 1..4 son bravas/muertas, 5..6 son medias-altas, 7..10 medias, 11..14 bajas)
 */
function evaluateTrucoHandStrength(cards: CardModel[]): number {
  if (cards.length === 0) return 0;
  // Convertimos rank 1..14 a poder 14..1
  const powers = cards.map(c => 15 - c.rank);
  const sum = powers.reduce((a, b) => a + b, 0);
  const max = Math.max(...powers);
  return max * 1.5 + sum;
}

/**
 * Decisión de respuesta ante un canto de Truco / Retruco / Vale Cuatro
 */
export function decideTrucoResponse(
  aiRemainingCards: CardModel[],
  currentStage: TrucoStage,
  personality: AIPersonality,
  trickHistory: ('player' | 'ai' | 'parda')[]
): { action: 'QUIERO' | 'NO_QUIERO' | 'RAISE'; nextStage?: TrucoStage; phrase: string } {
  const strength = evaluateTrucoHandStrength(aiRemainingCards);
  const isBluff = rollChance(personality.bluffRate);
  const aiWinsSoFar = trickHistory.filter(w => w === 'ai').length;

  if (currentStage === 'TRUCO') {
    // Si la IA tiene cartas muy fuertes (ej: ancho de espada, basto o 7 de espada)
    const hasBrava = aiRemainingCards.some(c => c.rank <= 4);
    const hasTres = aiRemainingCards.some(c => c.rank <= 5);

    if (hasBrava || (hasTres && aiWinsSoFar >= 1)) {
      // Subir a Retruco
      if (rollChance(0.55 * personality.trucoAggressiveness)) {
        return { action: 'RAISE', nextStage: 'RETRUCO', phrase: pickRandom(personality.phrases.retruco) };
      }
      return { action: 'QUIERO', phrase: pickRandom(personality.phrases.quiero) };
    }

    if (strength >= 18 || (strength >= 12 && isBluff)) {
      return { action: 'QUIERO', phrase: pickRandom(personality.phrases.quiero) };
    }

    return { action: 'NO_QUIERO', phrase: pickRandom(personality.phrases.noQuiero) };
  }

  if (currentStage === 'RETRUCO') {
    const hasTop = aiRemainingCards.some(c => c.rank <= 3);
    if (hasTop && rollChance(0.4 * personality.trucoAggressiveness)) {
      return { action: 'RAISE', nextStage: 'VALE_CUATRO', phrase: pickRandom(personality.phrases.valeCuatro) };
    }
    if (strength >= 24 || (strength >= 18 && isBluff)) {
      return { action: 'QUIERO', phrase: pickRandom(personality.phrases.quiero) };
    }
    return { action: 'NO_QUIERO', phrase: pickRandom(personality.phrases.noQuiero) };
  }

  if (currentStage === 'VALE_CUATRO') {
    // Vale cuatro es el tope
    if (strength >= 26 || (strength >= 20 && aiRemainingCards.some(c => c.rank <= 2))) {
      return { action: 'QUIERO', phrase: pickRandom(personality.phrases.quiero) };
    }
    return { action: 'NO_QUIERO', phrase: pickRandom(personality.phrases.noQuiero) };
  }

  return { action: 'QUIERO', phrase: pickRandom(personality.phrases.quiero) };
}

/**
 * Decisión de si la IA quiere iniciar un canto de Truco / Retruco en su turno
 */
export function decideTrucoCall(
  aiRemainingCards: CardModel[],
  currentStage: TrucoStage,
  personality: AIPersonality,
  trickHistory: ('player' | 'ai' | 'parda')[]
): { shouldCall: boolean; stage: TrucoStage; phrase: string } | null {
  const strength = evaluateTrucoHandStrength(aiRemainingCards);
  const isBluff = rollChance(personality.bluffRate * 0.7);
  const aiWins = trickHistory.filter(w => w === 'ai').length;

  if (currentStage === 'NONE') {
    // Cantar Truco
    if (strength >= 25 || (aiWins === 1 && strength >= 18) || isBluff) {
      return { shouldCall: true, stage: 'TRUCO', phrase: pickRandom(personality.phrases.truco) };
    }
  } else if (currentStage === 'TRUCO') {
    // Cantar Retruco
    if (strength >= 32 || (aiWins === 1 && strength >= 24) || (isBluff && rollChance(0.3))) {
      return { shouldCall: true, stage: 'RETRUCO', phrase: pickRandom(personality.phrases.retruco) };
    }
  } else if (currentStage === 'RETRUCO') {
    // Cantar Vale Cuatro
    if (strength >= 36 || (aiWins === 1 && strength >= 28 && rollChance(0.4))) {
      return { shouldCall: true, stage: 'VALE_CUATRO', phrase: pickRandom(personality.phrases.valeCuatro) };
    }
  }

  return null;
}

/**
 * Elección de la carta a jugar por la IA
 */
export function chooseAICardToPlay(
  aiRemainingCards: CardModel[],
  playerPlayedCardInTrick: PlayedCard | null,
  trickIndex: number, // 0 = primera, 1 = segunda, 2 = tercera
  trickHistory: ('player' | 'ai' | 'parda')[]
): { cardIndex: number; isFaceDown: boolean } {
  if (aiRemainingCards.length === 1) {
    return { cardIndex: 0, isFaceDown: false };
  }

  // Ordenar cartas de más débil a más fuerte (rank 14..1 -> menor número = mejor carta)
  const sortedWithIndex = aiRemainingCards.map((card, idx) => ({ card, idx }))
    .sort((a, b) => b.card.rank - a.card.rank); // más débil primero

  // Caso 1: AI juega SEGUNDO en la baza (responde a la carta del jugador)
  if (playerPlayedCardInTrick) {
    const playerCard = playerPlayedCardInTrick.card;
    const isPlayerFaceDown = playerPlayedCardInTrick.isFaceDown;

    if (isPlayerFaceDown) {
      // El jugador jugó tapada: jugar la carta más débil para ganarle sin quemar cartas buenas
      return { cardIndex: sortedWithIndex[0].idx, isFaceDown: false };
    }

    // Buscar la carta más débil que supere a la del jugador
    // (rank menor que playerCard.rank)
    const winningCards = sortedWithIndex.filter(item => item.card.rank < playerCard.rank);

    if (winningCards.length > 0) {
      // Ganar con la mínima carta necesaria
      return { cardIndex: winningCards[0].idx, isFaceDown: false };
    }

    // Buscar si puede empardar (mismo rank)
    const tieCard = sortedWithIndex.find(item => item.card.rank === playerCard.rank);
    if (tieCard) {
      return { cardIndex: tieCard.idx, isFaceDown: false };
    }

    // No puede ganar ni empatar: tirar la carta más baja (descarte)
    return { cardIndex: sortedWithIndex[0].idx, isFaceDown: false };
  }

  // Caso 2: AI juega PRIMERO en la baza
  if (trickIndex === 0) {
    // Primera baza: estrategia criolla
    // Salir con una carta mediana (ej: un 2, un 3 o un 7 falso) para tentar al rival,
    // o salir con la más baja si no tiene nada.
    const mediumCard = sortedWithIndex.find(item => item.card.rank >= 5 && item.card.rank <= 11);
    if (mediumCard) {
      return { cardIndex: mediumCard.idx, isFaceDown: false };
    }
    // Si tiene cartas muy altas o muy bajas, salir con la menor
    return { cardIndex: sortedWithIndex[0].idx, isFaceDown: false };
  }

  if (trickIndex === 1) {
    // Segunda baza:
    const aiWonFirst = trickHistory[0] === 'ai';
    if (aiWonFirst) {
      // Si ganó la primera, matar o tirar fuerte para cerrar la mano!
      const strongestCard = sortedWithIndex[sortedWithIndex.length - 1];
      return { cardIndex: strongestCard.idx, isFaceDown: false };
    }
    // Si perdió la primera o fue parda, tirar la más fuerte disponible para pelearla
    const strongestCard = sortedWithIndex[sortedWithIndex.length - 1];
    return { cardIndex: strongestCard.idx, isFaceDown: false };
  }

  // Tercera baza: tirar lo que queda (la mejor)
  return { cardIndex: sortedWithIndex[sortedWithIndex.length - 1].idx, isFaceDown: false };
}

/**
 * Gestor de Turnos y Máquina de Estados de Truco Argentino
 */
import { FullGameState, GameLogEntry, TrickState } from './gameState';
import { dealCards } from './deck';
import { compareCards, determineHandWinner, PlayedCard, TrickWinner } from './rules';
import { calculateEnvido, calculateEnvidoPoints } from './envido';
import { canCallTruco, getTrucoPoints, INITIAL_TRUCO_STATE } from './truco';
import { AI_PERSONALITIES, chooseAICardToPlay, decideEnvidoCall, decideEnvidoResponse, decideTrucoCall, decideTrucoResponse } from './ai';
import { soundManager } from '../utils/soundManager';
import { EnvidoCall, TrucoStage } from '../utils/constants';
import { pickRandom, randomDelay } from '../utils/random';

export function addLog(
  state: FullGameState,
  sender: 'player' | 'ai' | 'system',
  message: string,
  type?: 'canto' | 'play' | 'score' | 'banter' | 'system'
): GameLogEntry[] {
  const newEntry: GameLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sender,
    message,
    type,
  };
  return [newEntry, ...state.logs.slice(0, 40)];
}

/**
 * Inicia una nueva mano: reparte 3 cartas a cada uno y rota la mano
 */
export function startNewHand(state: FullGameState, isFirstRoundOfMatch = false): FullGameState {
  const { playerHand, aiHand } = dealCards();

  let nextMano: 'player' | 'ai';
  if (isFirstRoundOfMatch) {
    nextMano = state.initialMano;
  } else {
    nextMano = state.initialMano === 'player' ? 'ai' : 'player';
  }

  const initialTricks: [TrickState, TrickState, TrickState] = [
    { playerCard: null, aiCard: null, winner: null },
    { playerCard: null, aiCard: null, winner: null },
    { playerCard: null, aiCard: null, winner: null },
  ];

  soundManager.playDealingSequence();

  const personality = AI_PERSONALITIES[state.aiPersonalityId];
  const manoText = nextMano === 'player' ? 'Sos Mano' : `${personality.name} es Mano`;

  return {
    ...state,
    handNumber: (state.handNumber || 0) + 1,
    initialMano: nextMano,
    currentTurn: nextMano,
    trickIndex: 0,
    tricks: initialTricks,
    trickWinners: [],
    playerHand,
    aiHand,
    playerPlayedCards: [],
    aiPlayedCards: [],
    envidoDone: false,
    envidoChain: [],
    envidoPointsWon: null,
    trucoState: { ...INITIAL_TRUCO_STATE },
    pendingCanto: null,
    aiSpeechBubble: null,
    playerSpeechBubble: null,
    bigCantoBanner: null,
    isDealing: true,
    isProcessingAI: false,
    logs: addLog(state, 'system', `Nueva mano repartida. ${manoText}.`, 'system'),
  };
}

/**
 * Procesa la resolución del Envido cuando ambas partes aceptan o rechazan
 */
export function resolveEnvido(
  state: FullGameState,
  accepted: boolean,
  responder: 'player' | 'ai'
): FullGameState {
  const points = calculateEnvidoPoints(
    state.envidoChain,
    state.targetPoints,
    state.playerScore,
    state.aiScore
  );

  const personality = AI_PERSONALITIES[state.aiPersonalityId];
  let newPlayerScore = state.playerScore;
  let newAiScore = state.aiScore;
  let banner = '';
  let updatedLogs = [...state.logs];

  if (!accepted) {
    // Quien cantó último gana los puntos por no querer
    // El 'responder' dijo No Quiero, entonces gana el otro
    const winner = responder === 'player' ? 'ai' : 'player';
    const ptsWon = points.pointsIfDeclined;

    if (winner === 'player') {
      newPlayerScore += ptsWon;
      banner = `¡No quiso! +${ptsWon} pts`;
      updatedLogs = addLog({ ...state, logs: updatedLogs }, 'player', `Ganaste ${ptsWon} pt(s) de Envido (No quiso).`, 'score');
    } else {
      newAiScore += ptsWon;
      banner = `${personality.name} suma +${ptsWon} pts`;
      updatedLogs = addLog({ ...state, logs: updatedLogs }, 'ai', `${personality.name} gana ${ptsWon} pt(s) de Envido (No quisiste).`, 'score');
    }

    soundManager.playMatchStick();

    return {
      ...state,
      playerScore: newPlayerScore,
      aiScore: newAiScore,
      envidoDone: true,
      pendingCanto: null,
      bigCantoBanner: banner,
      logs: updatedLogs,
    };
  }

  // Si fue aceptado: comparar tantos
  const playerResult = calculateEnvido(state.playerHand.concat(state.playerPlayedCards.map(p => p.card)));
  const aiResult = calculateEnvido(state.aiHand.concat(state.aiPlayedCards.map(p => p.card)));
  const ptsWon = points.pointsIfAccepted;

  let winner: 'player' | 'ai';
  if (playerResult.score > aiResult.score) {
    winner = 'player';
  } else if (aiResult.score > playerResult.score) {
    winner = 'ai';
  } else {
    // Empate: gana el que es Mano
    winner = state.initialMano;
  }

  if (winner === 'player') {
    newPlayerScore += ptsWon;
    const isManoBonus = playerResult.score === aiResult.score ? ' (por ser Mano)' : '';
    banner = `¡Ganaste el Envido! (${playerResult.score} a ${aiResult.score}${isManoBonus}) +${ptsWon} pts`;
    updatedLogs = addLog({ ...state, logs: updatedLogs }, 'player', `Tus ${playerResult.score} ganaron a los ${aiResult.score} de ${personality.name}. +${ptsWon} pts.`, 'score');
    soundManager.playWin();
  } else {
    newAiScore += ptsWon;
    const isManoBonus = playerResult.score === aiResult.score ? ' (por ser Mano)' : '';
    banner = `${personality.name} gana el Envido (${aiResult.score} a ${playerResult.score}${isManoBonus}) +${ptsWon} pts`;
    updatedLogs = addLog({ ...state, logs: updatedLogs }, 'ai', `${personality.name} ganó con ${aiResult.score} contra tus ${playerResult.score}. +${ptsWon} pts.`, 'score');
    soundManager.playLose();
  }

  return {
    ...state,
    playerScore: newPlayerScore,
    aiScore: newAiScore,
    envidoDone: true,
    pendingCanto: null,
    bigCantoBanner: banner,
    logs: updatedLogs,
  };
}

/**
 * Resuelve una baza jugada (primera, segunda o tercera)
 */
export function resolveCurrentTrick(state: FullGameState): FullGameState {
  const trickIdx = state.trickIndex;
  const currentTrick = state.tricks[trickIdx];

  if (!currentTrick.playerCard || !currentTrick.aiCard) {
    return state;
  }

  const trickWinner = compareCards(currentTrick.playerCard, currentTrick.aiCard);
  const updatedTrick: TrickState = {
    ...currentTrick,
    winner: trickWinner,
  };

  const updatedTricks = [...state.tricks] as [TrickState, TrickState, TrickState];
  updatedTricks[trickIdx] = updatedTrick;
  const updatedTrickWinners = [...state.trickWinners, trickWinner];

  const personality = AI_PERSONALITIES[state.aiPersonalityId];
  let logMsg = '';
  if (trickWinner === 'player') {
    logMsg = `Ganaste la ${trickIdx === 0 ? 'primera' : trickIdx === 1 ? 'segunda' : 'tercera'} baza.`;
  } else if (trickWinner === 'ai') {
    logMsg = `${personality.name} ganó la ${trickIdx === 0 ? 'primera' : trickIdx === 1 ? 'segunda' : 'tercera'} baza.`;
  } else {
    logMsg = `¡Parda en la ${trickIdx === 0 ? 'primera' : trickIdx === 1 ? 'segunda' : 'tercera'} baza!`;
  }

  const stateWithTrick = {
    ...state,
    tricks: updatedTricks,
    trickWinners: updatedTrickWinners,
    logs: addLog(state, 'system', logMsg, 'play'),
  };

  // Verificar si la mano terminó (alguien ganó 2, o se resolvió por parda)
  const handWinner = determineHandWinner(updatedTrickWinners, state.initialMano);

  if (handWinner !== null) {
    // La mano terminó!
    const trucoPoints = state.trucoState.pointsIfAccepted;
    let newPlayerScore = state.playerScore;
    let newAiScore = state.aiScore;
    let banner = '';
    let logs = [...stateWithTrick.logs];

    if (handWinner === 'player') {
      newPlayerScore += trucoPoints;
      banner = `¡Ganaste la mano! +${trucoPoints} pts`;
      logs = addLog({ ...stateWithTrick, logs }, 'player', `¡Ganaste la mano completa! Sumás ${trucoPoints} pt(s).`, 'score');
      soundManager.playWin();
    } else {
      newAiScore += trucoPoints;
      banner = `${personality.name} ganó la mano (+${trucoPoints} pts)`;
      logs = addLog({ ...stateWithTrick, logs }, 'ai', `${personality.name} ganó la mano completa (+${trucoPoints} pts).`, 'score');
      soundManager.playLose();
    }

    // Verificar si el partido terminó
    const isPlayerMatchWinner = newPlayerScore >= state.targetPoints;
    const isAiMatchWinner = newAiScore >= state.targetPoints;

    return {
      ...stateWithTrick,
      playerScore: newPlayerScore,
      aiScore: newAiScore,
      bigCantoBanner: banner,
      isMatchOver: isPlayerMatchWinner || isAiMatchWinner,
      matchWinner: isPlayerMatchWinner ? 'player' : isAiMatchWinner ? 'ai' : null,
      logs,
    };
  }

  // La mano sigue: pasar a la siguiente baza
  // El ganador de la baza juega primero en la siguiente; si fue parda, juega el que jugó primero en la baza empatada
  let nextTurn: 'player' | 'ai';
  if (trickWinner === 'player') {
    nextTurn = 'player';
  } else if (trickWinner === 'ai') {
    nextTurn = 'ai';
  } else {
    // En parda juega primero el que fue mano de esa baza
    nextTurn = state.initialMano;
  }

  return {
    ...stateWithTrick,
    trickIndex: (trickIdx + 1) as 0 | 1 | 2,
    currentTurn: nextTurn,
  };
}

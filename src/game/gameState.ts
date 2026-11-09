/**
 * Definición del Estado Completo de la Partida de Truco Argentino
 */
import { CardModel, AIPersonalityId, TrucoStage, EnvidoCall } from '../utils/constants';
import { PlayedCard, TrickWinner } from './rules';
import { TrucoState, INITIAL_TRUCO_STATE } from './truco';

export interface TrickState {
  playerCard: PlayedCard | null;
  aiCard: PlayedCard | null;
  winner: TrickWinner | null;
}

export interface GameLogEntry {
  id: string;
  timestamp: string;
  sender: 'player' | 'ai' | 'system';
  message: string;
  type?: 'canto' | 'play' | 'score' | 'banter' | 'system';
}

export interface PendingCantoState {
  type: 'ENVIDO' | 'TRUCO';
  cantoName: string;
  caller: 'player' | 'ai';
  responder: 'player' | 'ai';
  chain: string[];
  options: {
    canQuiero: boolean;
    canNoQuiero: boolean;
    canRaise: boolean;
    raiseOptions: string[];
  };
}

export interface FullGameState {
  // Configuración
  targetPoints: 15 | 30;
  withFlor: boolean;
  aiPersonalityId: AIPersonalityId;

  // Puntuación
  playerScore: number;
  aiScore: number;

  // Manos y Ronda
  initialMano: 'player' | 'ai';
  currentTurn: 'player' | 'ai';
  trickIndex: 0 | 1 | 2;
  tricks: [TrickState, TrickState, TrickState];
  trickWinners: TrickWinner[];
  handNumber: number; // Número de mano para coordinar animaciones de reparto y vuelo

  // Cartas
  playerHand: CardModel[];
  aiHand: CardModel[];
  playerPlayedCards: PlayedCard[];
  aiPlayedCards: PlayedCard[];

  // Estados de cantos
  envidoDone: boolean; // Si ya se cantó o pasó el envido en esta mano
  envidoChain: EnvidoCall[];
  envidoPointsWon: { winner: 'player' | 'ai'; points: number } | null;
  
  trucoState: TrucoState;

  // Canto pendiente de respuesta (abre el diálogo o modal)
  pendingCanto: PendingCantoState | null;

  // Efectos visuales y diálogos
  aiSpeechBubble: string | null;
  playerSpeechBubble: string | null;
  screenShake: boolean;
  bigCantoBanner: string | null;

  // Estado general
  isMatchOver: boolean;
  matchWinner: 'player' | 'ai' | null;
  isDealing: boolean;
  isProcessingAI: boolean;

  // Registro de juego
  logs: GameLogEntry[];
}

export function createInitialGameState(
  targetPoints: 15 | 30 = 30,
  withFlor: boolean = false,
  aiPersonalityId: AIPersonalityId = 'gaucho'
): FullGameState {
  return {
    targetPoints,
    withFlor,
    aiPersonalityId,
    playerScore: 0,
    aiScore: 0,
    initialMano: 'player',
    currentTurn: 'player',
    trickIndex: 0,
    handNumber: 1,
    tricks: [
      { playerCard: null, aiCard: null, winner: null },
      { playerCard: null, aiCard: null, winner: null },
      { playerCard: null, aiCard: null, winner: null },
    ],
    trickWinners: [],
    playerHand: [],
    aiHand: [],
    playerPlayedCards: [],
    aiPlayedCards: [],
    envidoDone: false,
    envidoChain: [],
    envidoPointsWon: null,
    trucoState: { ...INITIAL_TRUCO_STATE },
    pendingCanto: null,
    aiSpeechBubble: null,
    playerSpeechBubble: null,
    screenShake: false,
    bigCantoBanner: null,
    isMatchOver: false,
    matchWinner: null,
    isDealing: false,
    isProcessingAI: false,
    logs: [
      {
        id: 'start-0',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: 'system',
        message: `¡Comienza la partida a ${targetPoints} puntos! ${withFlor ? 'Con flor' : 'Sin flor'}.`,
        type: 'system',
      },
    ],
  };
}

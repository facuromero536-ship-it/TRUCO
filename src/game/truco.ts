/**
 * Lógica del Truco, Retruco y Vale Cuatro
 */
import { TrucoStage } from '../utils/constants';

export interface TrucoState {
  stage: TrucoStage;
  lastCaller: 'player' | 'ai' | null;
  accepted: boolean;
  declined: boolean;
  pointsIfAccepted: number;
  pointsIfDeclined: number;
}

export const INITIAL_TRUCO_STATE: TrucoState = {
  stage: 'NONE',
  lastCaller: null,
  accepted: false,
  declined: false,
  pointsIfAccepted: 1, // Default hand with no calls is worth 1 pt
  pointsIfDeclined: 1,
};

export function getNextTrucoStage(current: TrucoStage): TrucoStage | null {
  if (current === 'NONE') return 'TRUCO';
  if (current === 'TRUCO') return 'RETRUCO';
  if (current === 'RETRUCO') return 'VALE_CUATRO';
  return null;
}

export function getTrucoPoints(stage: TrucoStage): { accepted: number; declined: number } {
  switch (stage) {
    case 'TRUCO':
      return { accepted: 2, declined: 1 };
    case 'RETRUCO':
      return { accepted: 3, declined: 2 };
    case 'VALE_CUATRO':
      return { accepted: 4, declined: 3 };
    default:
      return { accepted: 1, declined: 1 };
  }
}

export function canCallTruco(
  currentStage: TrucoStage,
  lastCaller: 'player' | 'ai' | null,
  caller: 'player' | 'ai'
): boolean {
  if (currentStage === 'VALE_CUATRO') return false;
  // Si nadie cantó, cualquiera puede cantar Truco
  if (currentStage === 'NONE') return true;
  // Si ya se cantó, solo quien NO fue el último en cantar (el desafiado) puede subir la apuesta
  return lastCaller !== caller;
}

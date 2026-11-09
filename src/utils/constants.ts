/**
 * Truco Argentino - Constantes y Reglas Oficiales
 */

export type CardSuit = 'espada' | 'basto' | 'oro' | 'copa';

export interface CardModel {
  id: string;
  suit: CardSuit;
  value: number; // 1..7, 10..12
  rank: number; // 1 (1 de espada, strongest) to 14 (4s, weakest)
  envidoValue: number; // 0 for 10, 11, 12; 1..7 face value
  name: string;
}

export type TrucoStage = 'NONE' | 'TRUCO' | 'RETRUCO' | 'VALE_CUATRO';
export type EnvidoCall = 'ENVIDO' | 'ENVIDO_ENVIDO' | 'REAL_ENVIDO' | 'FALTA_ENVIDO';
export type ResponseAction = 'QUIERO' | 'NO_QUIERO' | 'ME_VOY_AL_MAZO';

export type AIPersonalityId = 'gaucho' | 'farolero' | 'calculador';

export interface AIPersonality {
  id: AIPersonalityId;
  name: string;
  nickname: string;
  avatar: string;
  description: string;
  bluffRate: number; // 0 to 1
  envidoAggressiveness: number;
  trucoAggressiveness: number;
  voicePitch: number;
  voiceRate: number;
  phrases: {
    truco: string[];
    retruco: string[];
    valeCuatro: string[];
    envido: string[];
    realEnvido: string[];
    faltaEnvido: string[];
    quiero: string[];
    noQuiero: string[];
    fold: string[];
    winHand: string[];
    loseHand: string[];
    boastEnvido: string[];
    sonBuenas: string[];
  };
}

export const SUIT_NAMES: Record<CardSuit, string> = {
  espada: 'Espadas',
  basto: 'Bastos',
  oro: 'Oros',
  copa: 'Copas',
};

export const SUIT_COLORS: Record<CardSuit, { primary: string; secondary: string; border: string }> = {
  espada: { primary: '#2563eb', secondary: '#93c5fd', border: '#1d4ed8' },
  basto: { primary: '#15803d', secondary: '#86efac', border: '#166534' },
  oro: { primary: '#d97706', secondary: '#fde047', border: '#b45309' },
  copa: { primary: '#dc2626', secondary: '#fca5a5', border: '#b91c1c' },
};

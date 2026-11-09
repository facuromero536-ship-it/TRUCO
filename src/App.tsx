/**
 * Truco Argentino AI - Aplicación Principal
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Settings, BookOpen, RotateCcw, Trophy, Smartphone } from 'lucide-react';
import { FullGameState, createInitialGameState } from './game/gameState';
import { startNewHand, resolveEnvido, resolveCurrentTrick, addLog } from './game/turnManager';
import { AI_PERSONALITIES, decideEnvidoCall, decideEnvidoResponse, decideTrucoCall, decideTrucoResponse, chooseAICardToPlay } from './game/ai';
import { soundManager } from './utils/soundManager';
import { AIPersonalityId, EnvidoCall, TrucoStage } from './utils/constants';
import { getNextTrucoStage, getTrucoPoints } from './game/truco';
import { pickRandom, randomDelay } from './utils/random';
import { GameTable } from './components/GameTable';
import { Scoreboard } from './components/Scoreboard';
import { GameLog } from './components/GameLog';
import { ChantModal } from './components/ChantModal';
import { InstallPromptModal } from './components/InstallPromptModal';

export default function App() {
  const [gameState, setGameState] = useState<FullGameState>(() =>
    createInitialGameState(30, false, 'gaucho')
  );

  const [activeTab, setActiveTab] = useState<'table' | 'hierarchy' | 'rules'>('table');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [playFaceDown, setPlayFaceDown] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundManager.getMuted());
  const [voiceEnabled, setVoiceEnabled] = useState(() => soundManager.getVoiceEnabled());

  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  // Iniciar la primera mano al cargar
  useEffect(() => {
    const initialized = startNewHand(createInitialGameState(30, false, 'gaucho'), true);
    setGameState(initialized);
  }, []);

  // Restablecer el estado de reparto una vez completada la animación de vuelo
  useEffect(() => {
    if (gameState.isDealing) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, isDealing: false }));
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [gameState.isDealing]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  };

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    soundManager.setVoiceEnabled(next);
  };

  const restartMatch = (target: 15 | 30 = gameState.targetPoints, aiId: AIPersonalityId = gameState.aiPersonalityId) => {
    const fresh = createInitialGameState(target, false, aiId);
    const withHand = startNewHand(fresh, true);
    setGameState(withHand);
    setShowSettingsModal(false);
    setActiveTab('table');
  };

  // Helper para hablar con voz gaucha
  const speakAIPhrase = useCallback((phrase: string) => {
    const personality = AI_PERSONALITIES[stateRef.current.aiPersonalityId];
    soundManager.speakCriollo(phrase, personality.voicePitch, personality.voiceRate);
  }, []);

  // ==========================================
  // IA TURN ENGINE
  // ==========================================
  const triggerAITurn = useCallback(async () => {
    const s = stateRef.current;
    if (s.isMatchOver || s.currentTurn !== 'ai' || s.isProcessingAI) return;

    setGameState(prev => ({ ...prev, isProcessingAI: true }));
    await randomDelay(700, 1200);

    const current = stateRef.current;
    const personality = AI_PERSONALITIES[current.aiPersonalityId];
    const trickIdx = current.trickIndex;

    // 1. ¿Cantar Envido de entrada? (solo en la 1ra baza si no se cantó y nadie tiró o AI juega primero)
    if (!current.envidoDone && trickIdx === 0 && current.trucoState.stage === 'NONE') {
      const call = decideEnvidoCall(current.aiHand, personality, current.initialMano === 'ai');
      if (call) {
        const phrase = call === 'REAL_ENVIDO'
          ? pickRandom(personality.phrases.realEnvido)
          : pickRandom(personality.phrases.envido);

        soundManager.playCantoEnvido();
        speakAIPhrase(phrase);

        setGameState(prev => ({
          ...prev,
          envidoChain: [call],
          pendingCanto: {
            type: 'ENVIDO',
            cantoName: call === 'REAL_ENVIDO' ? 'Real Envido' : 'Envido',
            caller: 'ai',
            responder: 'player',
            chain: [call],
            options: {
              canQuiero: true,
              canNoQuiero: true,
              canRaise: true,
              raiseOptions: call === 'ENVIDO' ? ['ENVIDO', 'REAL_ENVIDO', 'FALTA_ENVIDO'] : ['FALTA_ENVIDO'],
            },
          },
          aiSpeechBubble: phrase,
          bigCantoBanner: `¡${personality.name} cantó ${call === 'REAL_ENVIDO' ? 'Real Envido' : 'Envido'}!`,
          isProcessingAI: false,
          logs: addLog(prev, 'ai', `${personality.name} cantó ¡${call === 'REAL_ENVIDO' ? 'Real Envido' : 'Envido'}!`, 'canto'),
        }));
        return;
      }
    }

    // 2. ¿Cantar Truco / Retruco en su turno?
    if (current.trucoState.stage !== 'VALE_CUATRO' && (current.trucoState.stage === 'NONE' || current.trucoState.lastCaller === 'player')) {
      const trucoDecision = decideTrucoCall(
        current.aiHand,
        current.trucoState.stage,
        personality,
        current.trickWinners
      );

      if (trucoDecision && trucoDecision.shouldCall) {
        const nextStage = trucoDecision.stage;
        soundManager.playCantoTruco(nextStage === 'TRUCO' ? 1 : nextStage === 'RETRUCO' ? 2 : 3);
        speakAIPhrase(trucoDecision.phrase);

        setGameState(prev => ({
          ...prev,
          trucoState: {
            ...prev.trucoState,
            stage: nextStage,
            lastCaller: 'ai',
          },
          pendingCanto: {
            type: 'TRUCO',
            cantoName: nextStage === 'TRUCO' ? 'TRUCO' : nextStage === 'RETRUCO' ? 'RE TRUCO' : 'VALE CUATRO',
            caller: 'ai',
            responder: 'player',
            chain: [nextStage],
            options: {
              canQuiero: true,
              canNoQuiero: true,
              canRaise: nextStage !== 'VALE_CUATRO',
              raiseOptions: nextStage === 'TRUCO' ? ['RETRUCO'] : nextStage === 'RETRUCO' ? ['VALE_CUATRO'] : [],
            },
          },
          aiSpeechBubble: trucoDecision.phrase,
          bigCantoBanner: `¡${personality.name} cantó ${nextStage === 'TRUCO' ? 'TRUCO' : nextStage}!`,
          isProcessingAI: false,
          logs: addLog(prev, 'ai', `${personality.name} cantó ¡${nextStage}!`, 'canto'),
        }));
        return;
      }
    }

    // 3. Jugar una carta a la mesa
    const playerCardInTrick = current.tricks[trickIdx].playerCard;
    const { cardIndex, isFaceDown } = chooseAICardToPlay(
      current.aiHand,
      playerCardInTrick,
      trickIdx,
      current.trickWinners
    );

    const playedCard = current.aiHand[cardIndex];
    const newAiHand = current.aiHand.filter((_, idx) => idx !== cardIndex);

    soundManager.playCardPlace();

    const playedRecord = {
      card: playedCard,
      playedBy: 'ai' as const,
      isFaceDown,
    };

    const updatedTricks = [...current.tricks] as typeof current.tricks;
    updatedTricks[trickIdx] = {
      ...updatedTricks[trickIdx],
      aiCard: playedRecord,
    };

    // Si el jugador ya había jugado en esta baza, resolver la baza!
    const bothPlayed = !!updatedTricks[trickIdx].playerCard;

    let nextState: FullGameState = {
      ...current,
      aiHand: newAiHand,
      aiPlayedCards: [...current.aiPlayedCards, playedRecord],
      tricks: updatedTricks,
      currentTurn: 'player',
      isProcessingAI: false,
      aiSpeechBubble: null,
      bigCantoBanner: null,
      logs: addLog(
        current,
        'ai',
        `${personality.name} jugó ${isFaceDown ? 'carta tapada' : playedCard.name}.`,
        'play'
      ),
    };

    if (bothPlayed) {
      nextState = resolveCurrentTrick(nextState);
    }

    setGameState(nextState);

    // Si la mano terminó pero el match no, repartir nueva mano con delay
    if (determineHandEnded(nextState) && !nextState.isMatchOver) {
      setTimeout(() => {
        setGameState(st => startNewHand(st));
      }, 2200);
    }
  }, [speakAIPhrase]);

  // Si pasa a ser el turno de la IA y no hay nada bloqueando, disparar su turno
  useEffect(() => {
    if (
      gameState.currentTurn === 'ai' &&
      !gameState.pendingCanto &&
      !gameState.isMatchOver &&
      !gameState.isProcessingAI
    ) {
      triggerAITurn();
    }
  }, [gameState.currentTurn, gameState.pendingCanto, gameState.isMatchOver, gameState.isProcessingAI, triggerAITurn]);

  function determineHandEnded(s: FullGameState): boolean {
    return s.trickWinners.length >= 2 && (
      s.trickWinners.filter(w => w === 'player').length >= 2 ||
      s.trickWinners.filter(w => w === 'ai').length >= 2 ||
      (s.trickWinners.length === 2 && (s.trickWinners[0] === 'parda' && s.trickWinners[1] !== 'parda')) ||
      (s.trickWinners.length === 2 && s.trickWinners[1] === 'parda') ||
      s.trickWinners.length === 3
    );
  }

  // ==========================================
  // JUGADOR: TIRAR CARTA
  // ==========================================
  const handlePlayerPlayCard = (cardIndex: number, isFaceDown: boolean) => {
    if (gameState.currentTurn !== 'player' || gameState.pendingCanto || gameState.isProcessingAI) return;

    const playedCard = gameState.playerHand[cardIndex];
    const newPlayerHand = gameState.playerHand.filter((_, idx) => idx !== cardIndex);
    const trickIdx = gameState.trickIndex;

    soundManager.playCardPlace();

    const playedRecord = {
      card: playedCard,
      playedBy: 'player' as const,
      isFaceDown,
    };

    const updatedTricks = [...gameState.tricks] as typeof gameState.tricks;
    updatedTricks[trickIdx] = {
      ...updatedTricks[trickIdx],
      playerCard: playedRecord,
    };

    const bothPlayed = !!updatedTricks[trickIdx].aiCard;

    let nextState: FullGameState = {
      ...gameState,
      playerHand: newPlayerHand,
      playerPlayedCards: [...gameState.playerPlayedCards, playedRecord],
      tricks: updatedTricks,
      currentTurn: 'ai',
      bigCantoBanner: null,
      logs: addLog(
        gameState,
        'player',
        `Jugaste ${isFaceDown ? 'carta tapada' : playedCard.name}.`,
        'play'
      ),
    };

    if (bothPlayed) {
      nextState = resolveCurrentTrick(nextState);
    }

    setPlayFaceDown(false);
    setGameState(nextState);

    // Si terminó la mano, repartir luego de un instante
    if (determineHandEnded(nextState) && !nextState.isMatchOver) {
      setTimeout(() => {
        setGameState(st => startNewHand(st));
      }, 2200);
    }
  };

  // ==========================================
  // JUGADOR: CANTAR ENVIDO
  // ==========================================
  const handlePlayerCallEnvido = async (call: EnvidoCall) => {
    if (gameState.currentTurn !== 'player' || gameState.isProcessingAI) return;

    soundManager.playCantoEnvido();
    const callNames: Record<EnvidoCall, string> = {
      ENVIDO: 'Envido',
      ENVIDO_ENVIDO: 'Envido',
      REAL_ENVIDO: 'Real Envido',
      FALTA_ENVIDO: 'Falta Envido',
    };

    const cantoName = callNames[call];

    const stateWithCall: FullGameState = {
      ...gameState,
      envidoChain: [...gameState.envidoChain, call],
      isProcessingAI: true,
      bigCantoBanner: `¡Cantaste ${cantoName}!`,
      logs: addLog(gameState, 'player', `Cantaste ¡${cantoName}!`, 'canto'),
    };
    setGameState(stateWithCall);

    // AI responde
    await randomDelay(900, 1500);

    const personality = AI_PERSONALITIES[stateWithCall.aiPersonalityId];
    const aiDecision = decideEnvidoResponse(
      stateWithCall.aiHand,
      stateWithCall.envidoChain,
      personality,
      stateWithCall.initialMano === 'ai'
    );

    speakAIPhrase(aiDecision.phrase);

    if (aiDecision.action === 'QUIERO') {
      soundManager.playCantoTruco(1);
      const resolved = resolveEnvido(stateWithCall, true, 'ai');
      setGameState({
        ...resolved,
        aiSpeechBubble: aiDecision.phrase,
        isProcessingAI: false,
        logs: addLog(resolved, 'ai', `${personality.name}: "${aiDecision.phrase}" (¡Quiero!)`, 'canto'),
      });
    } else if (aiDecision.action === 'NO_QUIERO') {
      const resolved = resolveEnvido(stateWithCall, false, 'ai');
      setGameState({
        ...resolved,
        aiSpeechBubble: aiDecision.phrase,
        isProcessingAI: false,
        logs: addLog(resolved, 'ai', `${personality.name}: "${aiDecision.phrase}" (No quiero)`, 'canto'),
      });
    } else if (aiDecision.action === 'RAISE' && aiDecision.raiseCall) {
      // AI redobla la apuesta a Real Envido o Falta
      const raiseCall = aiDecision.raiseCall;
      soundManager.playCantoEnvido();
      setGameState(prev => ({
        ...prev,
        envidoChain: [...prev.envidoChain, raiseCall],
        pendingCanto: {
          type: 'ENVIDO',
          cantoName: raiseCall === 'REAL_ENVIDO' ? 'Real Envido' : 'Falta Envido',
          caller: 'ai',
          responder: 'player',
          chain: [...prev.envidoChain, raiseCall],
          options: {
            canQuiero: true,
            canNoQuiero: true,
            canRaise: raiseCall === 'REAL_ENVIDO',
            raiseOptions: raiseCall === 'REAL_ENVIDO' ? ['FALTA_ENVIDO'] : [],
          },
        },
        aiSpeechBubble: aiDecision.phrase,
        bigCantoBanner: `¡${personality.name} retruca con ${raiseCall === 'REAL_ENVIDO' ? 'Real Envido' : 'Falta Envido'}!`,
        isProcessingAI: false,
        logs: addLog(prev, 'ai', `${personality.name} subió a ¡${raiseCall}!`, 'canto'),
      }));
    }
  };

  // ==========================================
  // JUGADOR: CANTAR TRUCO / RETRUCO / VALE CUATRO
  // ==========================================
  const handlePlayerCallTruco = async () => {
    if (gameState.currentTurn !== 'player' || gameState.isProcessingAI) return;

    const nextStage = getNextTrucoStage(gameState.trucoState.stage);
    if (!nextStage) return;

    soundManager.playCantoTruco(nextStage === 'TRUCO' ? 1 : nextStage === 'RETRUCO' ? 2 : 3);
    const stageNames: Record<TrucoStage, string> = {
      NONE: '',
      TRUCO: 'TRUCO',
      RETRUCO: 'RE TRUCO',
      VALE_CUATRO: 'VALE CUATRO',
    };

    const stateWithCall: FullGameState = {
      ...gameState,
      trucoState: {
        ...gameState.trucoState,
        stage: nextStage,
        lastCaller: 'player',
      },
      isProcessingAI: true,
      bigCantoBanner: `¡Cantaste ${stageNames[nextStage]}!`,
      logs: addLog(gameState, 'player', `Cantaste ¡${stageNames[nextStage]}!`, 'canto'),
    };
    setGameState(stateWithCall);

    // AI responde al canto de Truco
    await randomDelay(1000, 1600);

    const personality = AI_PERSONALITIES[stateWithCall.aiPersonalityId];
    const aiDecision = decideTrucoResponse(
      stateWithCall.aiHand,
      nextStage,
      personality,
      stateWithCall.trickWinners
    );

    speakAIPhrase(aiDecision.phrase);

    if (aiDecision.action === 'QUIERO') {
      soundManager.playCantoTruco(1);
      const points = getTrucoPoints(nextStage);
      setGameState(prev => ({
        ...prev,
        trucoState: {
          ...prev.trucoState,
          accepted: true,
          pointsIfAccepted: points.accepted,
        },
        aiSpeechBubble: aiDecision.phrase,
        bigCantoBanner: `¡${personality.name} aceptó el ${stageNames[nextStage]}!`,
        isProcessingAI: false,
        logs: addLog(prev, 'ai', `${personality.name}: "${aiDecision.phrase}" (¡Quiero!)`, 'canto'),
      }));
    } else if (aiDecision.action === 'NO_QUIERO') {
      // AI no quiere: el jugador gana los puntos de rechazo de Truco de inmediato y termina la mano
      soundManager.playWin();
      const points = getTrucoPoints(nextStage);
      const ptsWon = points.declined;
      const newPlayerScore = stateWithCall.playerScore + ptsWon;
      const isMatchOver = newPlayerScore >= stateWithCall.targetPoints;

      setGameState(prev => ({
        ...prev,
        playerScore: newPlayerScore,
        aiSpeechBubble: aiDecision.phrase,
        bigCantoBanner: `¡No quiso! +${ptsWon} pts para vos`,
        isProcessingAI: false,
        isMatchOver,
        matchWinner: isMatchOver ? 'player' : null,
        logs: addLog(prev, 'ai', `${personality.name}: "${aiDecision.phrase}" (No quiso. Sumás ${ptsWon} pt).`, 'score'),
      }));

      if (!isMatchOver) {
        setTimeout(() => {
          setGameState(st => startNewHand(st));
        }, 2200);
      }
    } else if (aiDecision.action === 'RAISE' && aiDecision.nextStage) {
      // AI sube la apuesta a Retruco o Vale Cuatro
      const raisedStage = aiDecision.nextStage;
      soundManager.playCantoTruco(raisedStage === 'RETRUCO' ? 2 : 3);
      setGameState(prev => ({
        ...prev,
        trucoState: {
          ...prev.trucoState,
          stage: raisedStage,
          lastCaller: 'ai',
        },
        pendingCanto: {
          type: 'TRUCO',
          cantoName: raisedStage === 'RETRUCO' ? 'RE TRUCO' : 'VALE CUATRO',
          caller: 'ai',
          responder: 'player',
          chain: [raisedStage],
          options: {
            canQuiero: true,
            canNoQuiero: true,
            canRaise: raisedStage === 'RETRUCO',
            raiseOptions: raisedStage === 'RETRUCO' ? ['VALE_CUATRO'] : [],
          },
        },
        aiSpeechBubble: aiDecision.phrase,
        bigCantoBanner: `¡${personality.name} retruca con ${raisedStage}!`,
        isProcessingAI: false,
        logs: addLog(prev, 'ai', `${personality.name} retrucó a ¡${raisedStage}!`, 'canto'),
      }));
    }
  };

  // ==========================================
  // JUGADOR: RESPUESTAS AL MODAL DE CANTO
  // ==========================================
  const handlePlayerQuieroModal = () => {
    const pc = gameState.pendingCanto;
    if (!pc) return;

    soundManager.playCantoTruco(1);

    if (pc.type === 'ENVIDO') {
      const resolved = resolveEnvido(gameState, true, 'player');
      setGameState(resolved);
    } else if (pc.type === 'TRUCO') {
      const currentStage = gameState.trucoState.stage;
      const points = getTrucoPoints(currentStage);
      setGameState(prev => ({
        ...prev,
        trucoState: {
          ...prev.trucoState,
          accepted: true,
          pointsIfAccepted: points.accepted,
        },
        pendingCanto: null,
        bigCantoBanner: `¡Aceptaste el ${currentStage}!`,
        logs: addLog(prev, 'player', `Aceptaste el ¡${currentStage}!`, 'canto'),
      }));
    }
  };

  const handlePlayerNoQuieroModal = () => {
    const pc = gameState.pendingCanto;
    if (!pc) return;

    soundManager.playLose();

    if (pc.type === 'ENVIDO') {
      const resolved = resolveEnvido(gameState, false, 'player');
      setGameState(resolved);
    } else if (pc.type === 'TRUCO') {
      // Jugador dice no quiero al truco: AI suma los puntos y termina la mano
      const points = getTrucoPoints(gameState.trucoState.stage);
      const ptsWon = points.declined;
      const newAiScore = gameState.aiScore + ptsWon;
      const isMatchOver = newAiScore >= gameState.targetPoints;

      setGameState(prev => ({
        ...prev,
        aiScore: newAiScore,
        pendingCanto: null,
        bigCantoBanner: `No quisiste. +${ptsWon} pts para el rival`,
        isMatchOver,
        matchWinner: isMatchOver ? 'ai' : null,
        logs: addLog(prev, 'player', `No quisiste el ${prev.trucoState.stage}. ${AI_PERSONALITIES[prev.aiPersonalityId].name} suma ${ptsWon} pt(s).`, 'score'),
      }));

      if (!isMatchOver) {
        setTimeout(() => {
          setGameState(st => startNewHand(st));
        }, 2200);
      }
    }
  };

  const handlePlayerRaiseModal = async (raiseCall: string) => {
    const pc = gameState.pendingCanto;
    if (!pc) return;

    if (pc.type === 'ENVIDO') {
      // Subir a Real Envido o Falta
      handlePlayerCallEnvido(raiseCall as EnvidoCall);
    } else if (pc.type === 'TRUCO') {
      handlePlayerCallTruco();
    }
  };

  // ==========================================
  // JUGADOR: IRSE AL MAZO (FOLD)
  // ==========================================
  const handlePlayerFold = () => {
    soundManager.playLose();
    const personality = AI_PERSONALITIES[gameState.aiPersonalityId];
    // Se pagan los puntos de truco actuales (al menos 1 pt)
    const ptsWon = gameState.trucoState.stage === 'NONE' ? 1 : getTrucoPoints(gameState.trucoState.stage).declined;
    const newAiScore = gameState.aiScore + ptsWon;
    const isMatchOver = newAiScore >= gameState.targetPoints;

    setGameState(prev => ({
      ...prev,
      aiScore: newAiScore,
      pendingCanto: null,
      bigCantoBanner: `Te fuiste al mazo. +${ptsWon} pts para el rival`,
      isMatchOver,
      matchWinner: isMatchOver ? 'ai' : null,
      logs: addLog(prev, 'player', `Te fuiste al mazo. ${personality.name} suma ${ptsWon} pt(s).`, 'score'),
    }));

    if (!isMatchOver) {
      setTimeout(() => {
        setGameState(st => startNewHand(st));
      }, 2000);
    }
  };

  const currentOpponent = AI_PERSONALITIES[gameState.aiPersonalityId];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-amber-600">
      {/* ================= TOP BAR CONTRACT (Strict 3 Zones) ================= */}
      <header className="flex items-center justify-between gap-8 px-4 md:px-8 py-3.5 border-b border-stone-800/80 bg-stone-950/90 backdrop-blur-md sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-amber-500 font-display text-xl font-black tracking-wider whitespace-nowrap">
            TRUCO ARGENTINO
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono text-stone-500 uppercase tracking-widest pl-1">
            · AI Criolla
          </span>
        </div>

        {/* Zone 2: 4 nav links, single-line text links */}
        <nav className="hidden md:flex items-center gap-6 text-xs md:text-sm font-medium text-stone-300">
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-amber-400 cursor-pointer ${
              activeTab === 'table' ? 'text-amber-400 font-bold border-b-2 border-amber-500 pb-0.5' : ''
            }`}
          >
            Mesa de Juego
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hierarchy')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-amber-400 cursor-pointer ${
              activeTab === 'hierarchy' ? 'text-amber-400 font-bold border-b-2 border-amber-500 pb-0.5' : ''
            }`}
          >
            Jerarquía de Cartas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-amber-400 cursor-pointer ${
              activeTab === 'rules' ? 'text-amber-400 font-bold border-b-2 border-amber-500 pb-0.5' : ''
            }`}
          >
            Reglas & Envido
          </button>
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="transition-colors whitespace-nowrap shrink-0 hover:text-amber-400 cursor-pointer flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Ajustes</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowInstallModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900 border border-amber-600/40 text-amber-200 hover:bg-stone-800 text-xs font-medium transition cursor-pointer shadow-sm active:scale-95"
            title="Instalar en celular Android"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Instalar en Celular</span>
            <span className="sm:hidden text-[11px]">Instalar</span>
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={toggleVoice}
            aria-label={voiceEnabled ? 'Desactivar voz criolla' : 'Activar voz criolla'}
            className="p-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
          >
            {voiceEnabled ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => restartMatch()}
            className="px-3.5 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 font-display uppercase tracking-wider shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Nueva Mano</span>
          </button>
        </div>
      </header>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-6 flex flex-col justify-center">
        {activeTab === 'table' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 items-start">
            {/* Columna Izquierda: Anotador tradicional de fósforos */}
            <div className="order-2 lg:order-1 lg:col-span-1 flex flex-col gap-4">
              <Scoreboard
                playerScore={gameState.playerScore}
                aiScore={gameState.aiScore}
                targetPoints={gameState.targetPoints}
                aiName={currentOpponent.nickname}
              />

              {/* Selector Rápido de Rival */}
              <div className="rounded-xl bg-stone-900/80 border border-stone-800 p-3 select-none">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2 font-display">
                  Contrincante de Pulpería
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(AI_PERSONALITIES) as AIPersonalityId[]).map(id => {
                    const p = AI_PERSONALITIES[id];
                    const isSelected = gameState.aiPersonalityId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => restartMatch(gameState.targetPoints, id)}
                        className={`p-1.5 rounded-lg text-center transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-600/30 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                            : 'bg-stone-800/40 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <span className="block text-xs font-bold truncate">{p.name}</span>
                        <span className="block text-[9px] text-stone-400 truncate">{p.nickname}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Columna Central: Mesa de Truco */}
            <div className="order-1 lg:order-2 lg:col-span-2 flex flex-col items-center">
              <GameTable
                state={gameState}
                onPlayCard={handlePlayerPlayCard}
                onCallEnvido={handlePlayerCallEnvido}
                onCallTruco={handlePlayerCallTruco}
                onFold={handlePlayerFold}
                playFaceDown={playFaceDown}
                setPlayFaceDown={setPlayFaceDown}
              />
            </div>

            {/* Columna Derecha: Historial de la Mano */}
            <div className="order-3 lg:col-span-1 h-[420px] lg:h-[580px]">
              <GameLog logs={gameState.logs} />
            </div>
          </div>
        )}

        {/* Tab 2: Jerarquía de Cartas del Truco */}
        {activeTab === 'hierarchy' && (
          <div className="max-w-4xl mx-auto rounded-2xl bg-stone-900 border border-stone-800 p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-amber-300">
                  Jerarquía Oficial de Cartas del Truco Argentino
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  De mayor a menor valor para ganar bazas (14 escalafones reglamentarios).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 cursor-pointer"
              >
                Volver a la Mesa
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-300 font-mono text-base mr-2">1.</span>
                  <span className="font-semibold text-white">1 de Espadas</span>
                  <span className="text-xs text-amber-400 block">El Macho (Carta más alta del juego)</span>
                </div>
                <span className="text-xs font-mono text-amber-500 font-bold">Invencible</span>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-300 font-mono text-base mr-2">2.</span>
                  <span className="font-semibold text-white">1 de Bastos</span>
                  <span className="text-xs text-amber-400 block">La Hembra (Segunda carta brava)</span>
                </div>
                <span className="text-xs font-mono text-amber-500 font-bold">Brava</span>
              </div>

              <div className="p-3 rounded-lg bg-stone-800/40 border border-stone-700/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-400 font-mono text-base mr-2">3.</span>
                  <span className="font-semibold text-stone-200">7 de Espadas</span>
                  <span className="text-xs text-stone-400 block">Manila de espada</span>
                </div>
                <span className="text-xs font-mono text-stone-400">Brava</span>
              </div>

              <div className="p-3 rounded-lg bg-stone-800/40 border border-stone-700/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-400 font-mono text-base mr-2">4.</span>
                  <span className="font-semibold text-stone-200">7 de Oro</span>
                  <span className="text-xs text-stone-400 block">Manilón de oro</span>
                </div>
                <span className="text-xs font-mono text-stone-400">Brava</span>
              </div>

              <div className="p-3 rounded-lg bg-stone-800/30 border border-stone-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-400 font-mono mr-2">5.</span>
                  <span className="font-medium text-stone-200">Todos los 3</span>
                  <span className="text-xs text-stone-500 block">Espada, Basto, Oro, Copa</span>
                </div>
                <span className="text-xs text-stone-500">Altas</span>
              </div>

              <div className="p-3 rounded-lg bg-stone-800/30 border border-stone-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-400 font-mono mr-2">6.</span>
                  <span className="font-medium text-stone-200">Todos los 2</span>
                  <span className="text-xs text-stone-500 block">Espada, Basto, Oro, Copa</span>
                </div>
                <span className="text-xs text-stone-500">Altas</span>
              </div>

              <div className="p-3 rounded-lg bg-stone-800/20 border border-stone-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-500 font-mono mr-2">7.</span>
                  <span className="font-medium text-stone-300">1 de Copa y 1 de Oro</span>
                  <span className="text-xs text-stone-500 block">Anchos falsos</span>
                </div>
                <span className="text-xs text-stone-500">Medias</span>
              </div>

              <div className="p-3 rounded-lg bg-stone-800/20 border border-stone-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-500 font-mono mr-2">8.</span>
                  <span className="font-medium text-stone-300">Todos los 12 (Reyes)</span>
                </div>
                <span className="text-xs text-stone-500">Figuras</span>
              </div>

              <div className="p-3 rounded-lg bg-stone-800/20 border border-stone-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-500 font-mono mr-2">9.</span>
                  <span className="font-medium text-stone-300">Todos los 11 (Caballos)</span>
                </div>
                <span className="text-xs text-stone-500">Figuras</span>
              </div>

              <div className="p-3 rounded-lg bg-stone-800/20 border border-stone-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-500 font-mono mr-2">10.</span>
                  <span className="font-medium text-stone-300">Todos los 10 (Sotas)</span>
                </div>
                <span className="text-xs text-stone-500">Figuras</span>
              </div>

              <div className="p-3 rounded-lg bg-stone-800/10 border border-stone-800/60 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-600 font-mono mr-2">11.</span>
                  <span className="font-medium text-stone-400">7 de Copas y 7 de Bastos</span>
                  <span className="text-xs text-stone-600 block">Sietes falsos</span>
                </div>
                <span className="text-xs text-stone-600">Bajas</span>
              </div>

              <div className="p-3 rounded-lg bg-stone-800/10 border border-stone-800/60 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-600 font-mono mr-2">12.</span>
                  <span className="font-medium text-stone-400">Todos los 6</span>
                </div>
                <span className="text-xs text-stone-600">Bajas</span>
              </div>

              <div className="p-3 rounded-lg bg-stone-800/10 border border-stone-800/60 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-600 font-mono mr-2">13.</span>
                  <span className="font-medium text-stone-400">Todos los 5</span>
                </div>
                <span className="text-xs text-stone-600">Bajas</span>
              </div>

              <div className="p-3 rounded-lg bg-stone-800/10 border border-stone-800/60 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-600 font-mono mr-2">14.</span>
                  <span className="font-medium text-stone-400">Todos los 4</span>
                  <span className="text-xs text-stone-600 block">Las cartas más bajas del truco</span>
                </div>
                <span className="text-xs text-stone-600">Fondo</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Reglamento & Cálculo de Envido */}
        {activeTab === 'rules' && (
          <div className="max-w-4xl mx-auto rounded-2xl bg-stone-900 border border-stone-800 p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div>
                <h2 className="text-2xl font-display font-bold text-amber-300">
                  Reglamento Criollo y Cálculo del Envido
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Las leyes sagradas de la mesa de truco.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 cursor-pointer"
              >
                Volver a la Mesa
              </button>
            </div>

            {/* Cálculo de Envido */}
            <div className="bg-stone-950/60 rounded-xl p-4 border border-stone-800 space-y-3">
              <h3 className="font-display font-bold text-amber-200 text-base">
                ¿Cómo se cuenta el Envido?
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                El Envido se calcula sumando el valor de dos cartas del <strong>mismo palo</strong> más <strong>20 puntos</strong>. Las figuras (10, 11 y 12) valen <strong>0 puntos</strong> para el envido. Las cartas del 1 al 7 valen su número impreso.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded bg-stone-900 border border-stone-800">
                  <span className="font-bold text-amber-400 block">Ejemplo 1 (33 de Envido)</span>
                  <span className="text-stone-300">7 de Espadas + 6 de Espadas = 7 + 6 + 20 = <strong>33 puntos</strong> (máximo posible sin flor).</span>
                </div>
                <div className="p-2.5 rounded bg-stone-900 border border-stone-800">
                  <span className="font-bold text-amber-400 block">Ejemplo 2 con Figuras</span>
                  <span className="text-stone-300">7 de Oro + 12 de Oro = 7 + 0 + 20 = <strong>27 puntos</strong>.</span>
                </div>
                <div className="p-2.5 rounded bg-stone-900 border border-stone-800">
                  <span className="font-bold text-amber-400 block">Distinto palo</span>
                  <span className="text-stone-300">Si las 3 cartas son de palos diferentes, el envido es el valor de la carta más alta (máximo 7).</span>
                </div>
              </div>
            </div>

            {/* Puntos y Cantos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 space-y-2">
                <h4 className="font-bold text-emerald-300 font-display text-sm uppercase tracking-wider">
                  Escalafón del Envido
                </h4>
                <ul className="space-y-1.5 text-stone-300">
                  <li>• <strong>Envido</strong>: 2 puntos (1 si no se quiere).</li>
                  <li>• <strong>Envido + Envido</strong>: 4 puntos (2 si no se quiere).</li>
                  <li>• <strong>Real Envido</strong>: 3 puntos limpio (o +3 sobre el envido previo).</li>
                  <li>• <strong>Falta Envido</strong>: Quien gana se lleva los puntos que le faltan al que va ganando para coronar el partido.</li>
                  <li>• <strong>Empate de tantos</strong>: En caso de igual cantidad de puntos de envido, gana quien es <strong>Mano</strong>.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 space-y-2">
                <h4 className="font-bold text-amber-400 font-display text-sm uppercase tracking-wider">
                  Escalafón del Truco
                </h4>
                <ul className="space-y-1.5 text-stone-300">
                  <li>• <strong>Mano sin canto</strong>: 1 punto al ganador de las bazas.</li>
                  <li>• <strong>Truco</strong>: Vale 2 puntos (1 si el rival dice No Quiero).</li>
                  <li>• <strong>Retruco</strong>: Vale 3 puntos (2 si se rechaza).</li>
                  <li>• <strong>Vale Cuatro</strong>: Vale 4 puntos (3 si se rechaza).</li>
                  <li>• <strong>Pardas</strong>: Si la primera baza emparda, quien gane la segunda gana la mano. Si la 1ra y 2da empardan, la 3ra define. Si las 3 empardan, gana la <strong>Mano</strong>.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL DE RESPUESTA A CANTOS ================= */}
      <ChantModal
        pendingCanto={gameState.pendingCanto}
        opponentName={currentOpponent.name}
        opponentPhrase={gameState.aiSpeechBubble || undefined}
        onQuiero={handlePlayerQuieroModal}
        onNoQuiero={handlePlayerNoQuieroModal}
        onRaise={handlePlayerRaiseModal}
        onFold={handlePlayerFold}
      />

      {/* ================= MODAL DE FIN DE PARTIDA / VICTORIA ================= */}
      {gameState.isMatchOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none">
          <div className="w-full max-w-md rounded-2xl bg-stone-900 border-2 border-amber-500 p-6 md:p-8 shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mb-4 text-amber-400">
              <Trophy className="w-8 h-8" />
            </div>

            <h2 className="text-3xl font-display font-extrabold text-amber-300 mb-1">
              {gameState.matchWinner === 'player' ? '¡CAMPEÓN DE LA PULPERÍA!' : '¡GANÓ EL RIVAL!'}
            </h2>

            <p className="text-sm text-stone-300 mb-6">
              {gameState.matchWinner === 'player'
                ? `Le ganaste a ${currentOpponent.name} por ${gameState.playerScore} a ${gameState.aiScore} puntos.`
                : `${currentOpponent.name} te ganó por ${gameState.aiScore} a ${gameState.playerScore} puntos.`}
            </p>

            <button
              type="button"
              onClick={() => restartMatch()}
              className="w-full py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold uppercase tracking-wider font-display text-sm shadow-xl transition-all cursor-pointer active:scale-95"
            >
              Jugar Revancha Inmediata
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL DE AJUSTES ================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
          <div className="w-full max-w-md rounded-2xl bg-stone-900 border border-stone-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-display font-bold text-base text-amber-300 uppercase tracking-wider">
                Ajustes de la Partida
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-stone-400 hover:text-white text-xs px-2 py-1 rounded bg-stone-800 cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {/* Duración de la partida */}
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-2">
                Puntos para Ganar:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => restartMatch(15, gameState.aiPersonalityId)}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    gameState.targetPoints === 15
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-stone-800 text-stone-300 border-stone-700'
                  }`}
                >
                  A 15 Puntos (Chico)
                </button>
                <button
                  type="button"
                  onClick={() => restartMatch(30, gameState.aiPersonalityId)}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    gameState.targetPoints === 30
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-stone-800 text-stone-300 border-stone-700'
                  }`}
                >
                  A 30 Puntos (Buenas y Malas)
                </button>
              </div>
            </div>

            {/* Personalidad del Rival */}
            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-2">
                Personalidad de la IA:
              </label>
              <div className="space-y-2">
                {(Object.keys(AI_PERSONALITIES) as AIPersonalityId[]).map(id => {
                  const p = AI_PERSONALITIES[id];
                  const isSelected = gameState.aiPersonalityId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => restartMatch(gameState.targetPoints, id)}
                      className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600/20 border-amber-500 text-amber-200'
                          : 'bg-stone-800/40 border-stone-800 text-stone-400 hover:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{p.name} ({p.nickname})</span>
                        <span className="text-[10px] uppercase font-mono text-amber-400">
                          {p.bluffRate > 0.3 ? 'Farolero' : p.bluffRate > 0.2 ? 'Calculador' : 'Cauto'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">{p.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opciones de Audio */}
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-300">Efectos de sonido (Web Audio):</span>
              <button
                type="button"
                onClick={toggleMute}
                className="px-3 py-1 rounded bg-stone-800 text-stone-200 font-semibold cursor-pointer"
              >
                {isMuted ? 'Silenciado' : 'Activado'}
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-300">Voz y cantos criollos:</span>
              <button
                type="button"
                onClick={toggleVoice}
                className="px-3 py-1 rounded bg-stone-800 text-stone-200 font-semibold cursor-pointer"
              >
                {voiceEnabled ? 'Activada' : 'Desactivada'}
              </button>
            </div>

            {/* Acceso a Instalación en Celular */}
            <div className="pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowInstallModal(true);
                }}
                className="w-full py-2 px-3 rounded-lg bg-amber-600/20 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-amber-600/30 transition cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>Instalar en tu Celular Android</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Instalación PWA en Celular Android */}
      <InstallPromptModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      {/* ================= PIE DE PÁGINA TRADICIONAL ================= */}
      <footer className="border-t border-stone-900 bg-stone-950 py-3 px-4 text-center text-xs text-stone-600 select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Truco Argentino · Tradición criolla con naipes españoles</span>
          <span>Envido, Truco, Retruco y Vale Cuatro</span>
        </div>
      </footer>
    </div>
  );
}

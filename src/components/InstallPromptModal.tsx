/**
 * Modal y botón de instalación para Celular Android y PWA
 */
import React, { useState } from 'react';
import { Smartphone, Download, X, Copy, Check, Share2, Sparkles, Chrome, QrCode } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundManager } from '../utils/soundManager';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install, isAndroid } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleNativeInstall = async () => {
    setIsInstalling(true);
    soundManager.playCardFlip();
    const success = await install();
    setIsInstalling(false);
    if (success) {
      onClose();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'Truco Argentino Criollo AI',
          text: '¡Jugá al Truco Argentino en tu celular con IA criolla y cantos tradicionales!',
          url: currentUrl,
        });
      } catch {
        // User cancelled or not supported
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-stone-900 border-2 border-amber-600/70 p-5 md:p-7 shadow-2xl text-stone-100 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Fondo decorativo con motivos criollos */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 border border-amber-400/40 flex items-center justify-center shadow-lg">
            <Smartphone className="w-6 h-6 text-amber-100" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-display text-amber-100 flex items-center gap-2">
              Instalar en tu Celular Android
            </h2>
            <p className="text-xs text-amber-300/80">
              Jugá a pantalla completa como una app nativa, sin descargas de Play Store
            </p>
          </div>
        </div>

        {/* Si el navegador soporta instalación con 1 toque */}
        {isInstallable && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex flex-col items-center text-center">
            <Sparkles className="w-7 h-7 text-amber-400 mb-2 animate-bounce" />
            <h3 className="font-bold text-amber-200 text-sm md:text-base">
              ¡Tu celular Android es 100% compatible!
            </h3>
            <p className="text-xs text-stone-300 mt-1 mb-3">
              Podés instalar el juego con un solo toque y tener el icono del Truco en tu pantalla de inicio.
            </p>
            <button
              onClick={handleNativeInstall}
              disabled={isInstalling}
              className="w-full py-3 px-6 rounded-xl font-display font-bold text-stone-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {isInstalling ? 'Instalando...' : 'Instalar App Ahora'}
            </button>
          </div>
        )}

        {/* Si ya está instalada */}
        {isInstalled && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>¡La aplicación ya está instalada en tu dispositivo!</span>
          </div>
        )}

        {/* Guía paso a paso tradicional para Google Chrome en Android */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-stone-300 uppercase tracking-wider font-display flex items-center gap-1.5">
            <Chrome className="w-4 h-4 text-amber-400" />
            Pasos para instalar desde Chrome en Android:
          </h3>

          <div className="space-y-2.5 text-xs text-stone-300">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-800/60 border border-stone-700/50">
              <span className="w-5 h-5 rounded-full bg-amber-600/30 text-amber-300 font-bold flex items-center justify-center shrink-0 border border-amber-500/40">
                1
              </span>
              <div>
                <strong className="text-amber-200">Abre este enlace en Google Chrome</strong>
                <p className="text-stone-400 mt-0.5">
                  Asegúrate de estar usando el navegador Chrome en tu celular Android.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-800/60 border border-stone-700/50">
              <span className="w-5 h-5 rounded-full bg-amber-600/30 text-amber-300 font-bold flex items-center justify-center shrink-0 border border-amber-500/40">
                2
              </span>
              <div>
                <strong className="text-amber-200">Toca el menú de tres puntos (⋮)</strong>
                <p className="text-stone-400 mt-0.5">
                  En la esquina superior derecha de Google Chrome, presiona el icono de los tres puntos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-800/60 border border-stone-700/50">
              <span className="w-5 h-5 rounded-full bg-amber-600/30 text-amber-300 font-bold flex items-center justify-center shrink-0 border border-amber-500/40">
                3
              </span>
              <div>
                <strong className="text-amber-200">Selecciona "Instalar aplicación"</strong>
                <p className="text-stone-400 mt-0.5">
                  En algunos modelos aparece como <span className="text-stone-200">"Agregar a la pantalla principal"</span>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-800/60 border border-stone-700/50">
              <span className="w-5 h-5 rounded-full bg-amber-600/30 text-amber-300 font-bold flex items-center justify-center shrink-0 border border-amber-500/40">
                4
              </span>
              <div>
                <strong className="text-amber-200">Confirma en "Instalar"</strong>
                <p className="text-stone-400 mt-0.5">
                  Se creará el icono de <strong>Truco AI</strong> en tu pantalla de inicio para abrirlo a pantalla completa sin barras.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Compartir o Abrir en el celular si estás en la PC */}
        <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800">
          <span className="text-xs text-stone-400 font-medium block mb-2">
            ¿Estás en la computadora? Abrilo en tu celular:
          </span>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Código QR rápido para escanear con la cámara del celular */}
            <div className="w-20 h-20 bg-white p-1 rounded-xl shrink-0 flex items-center justify-center shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(currentUrl)}`}
                alt="QR para abrir en celular"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 w-full flex flex-col gap-2">
              <p className="text-[11px] text-stone-400">
                Escanea el código QR con la cámara de tu celular Android para abrirlo directo en Chrome.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs text-amber-200 font-medium flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ¡Enlace copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-300" />
                      Copiar enlace
                    </>
                  )}
                </button>

                <button
                  onClick={handleShare}
                  className="py-1.5 px-3 rounded-lg bg-amber-700/80 hover:bg-amber-600 border border-amber-600/60 text-xs text-white font-medium flex items-center justify-center gap-1.5 transition active:scale-95"
                  title="Compartir enlace"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Compartir
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botón cerrar inferior */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-300 transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

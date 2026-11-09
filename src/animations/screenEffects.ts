/**
 * Efectos visuales de pantalla (sacudida de mesa en cantos fuertes, chispas)
 */

export function triggerScreenShake(containerElement?: HTMLElement | null) {
  const el = containerElement || document.body;
  el.classList.add('animate-shake');
  setTimeout(() => {
    el.classList.remove('animate-shake');
  }, 400);
}

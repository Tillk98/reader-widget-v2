/** True when the View Transitions API can coordinate reader ↔ video mode. */
export function supportsViewTransition(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document;
}

/**
 * Runs the DOM update inside a view transition when supported; otherwise runs synchronously.
 */
export function startViewTransition(update: () => void): void {
  if (supportsViewTransition()) {
    (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(
      update
    );
  } else {
    update();
  }
}

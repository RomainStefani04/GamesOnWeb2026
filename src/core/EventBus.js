/**
 * EventBus — Singleton de communication découplée entre systèmes.
 * Aucune dépendance externe.
 */
export class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  /**
   * S'abonner à un événement
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} unsubscribe — appelle-le pour te désabonner
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);

    // Retourne une fonction de cleanup — utile dans les StateMachine (onExit)
    return () => this.off(event, callback);
  }

  off(event, callback) {
    this._listeners.get(event)?.delete(callback);
  }

  emit(event, payload) {
    this._listeners.get(event)?.forEach(cb => cb(payload));
  }

  /** Utile pour nettoyer tous les listeners d'une scène */
  clear(event) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
  }
}

// Singleton global
export const eventBus = new EventBus();
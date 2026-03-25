/**
 * VoiceChannel — Une seule voix à la fois avec système de priorité.
 * Une réplique importante (KO, special move) ne sera pas coupée
 * par une grunt basique.
 */
export class VoiceChannel {
  constructor(scene) {
    this._scene           = scene;
    this._volume          = 1.0;
    this._muted           = false;
    this._current         = null;
    this._currentPriority = 0;
  }

  async preload(src) {
    // Même logique que SFXChannel mais pool de 1
    // (implémentation identique à SFXChannel._loadSound)
  }

  /**
   * @param {string} src
   * @param {object} options
   * @param {number} options.priority - 0 = grunt basique, 10 = KO/special
   */
  play(src, { priority = 0 } = {}) {
    if (this._muted) return;

    // Si une voix plus importante est en cours, on ignore
    if (this._current?.isPlaying && priority < this._currentPriority) return;

    this._current?.stop();
    this._currentPriority = priority;

    const sound = this._pools?.get(src)?.[0];
    if (sound) {
      sound.setVolume(this._volume);
      sound.play();
      this._current = sound;
    }
  }

  setVolume(value) { this._volume = Math.max(0, Math.min(1, value)); }
  mute(value)      { this._muted = value; }
}
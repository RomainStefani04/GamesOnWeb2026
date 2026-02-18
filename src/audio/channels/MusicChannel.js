import { Sound } from '@babylonjs/core';
import { AUDIO_FORMATS } from './../SoundLibrabry';

/**
 * MusicChannel — Une seule piste musicale à la fois.
 * Gère les crossfades et les transitions.
 */
export class MusicChannel {
  constructor(scene) {
    this._scene   = scene;
    this._volume  = 1.0;
    this._current = null; // Sound actuellement en cours
    this._muted   = false;
  }

  /**
   * Joue une musique, avec un fade-in optionnel
   * @param {string} src - chemin sans extension (ex: 'assets/audio/music/stage_ryu')
   * @param {object} options
   */
  async play(src, { fadeIn = 0, loop = true, volume = null } = {}) {
    const targetVolume = (volume ?? this._volume) * (this._muted ? 0 : 1);

    const sound = await this._loadSound(src, {
      loop,
      volume: fadeIn > 0 ? 0 : targetVolume,
      autoplay: false,
    });

    this._current?.stop();
    this._current = sound;
    sound.play();

    if (fadeIn > 0) {
      this._fadeTo(sound, targetVolume, fadeIn);
    }
  }

  /**
   * Crossfade vers une nouvelle musique
   * @param {string} src
   * @param {number} duration - durée du crossfade en ms
   */
  async crossfadeTo(src, duration = 1000) {
    const outgoing = this._current;

    const incoming = await this._loadSound(src, {
      loop: true,
      volume: 0,
      autoplay: false,
    });

    incoming.play();
    this._current = incoming;

    this._fadeTo(incoming, this._volume, duration);

    if (outgoing) {
      this._fadeTo(outgoing, 0, duration, () => outgoing.stop());
    }
  }

  stop(fadeOut = 0) {
    if (!this._current) return;

    if (fadeOut > 0) {
      this._fadeTo(this._current, 0, fadeOut, () => this._current?.stop());
    } else {
      this._current.stop();
      this._current = null;
    }
  }

  setVolume(value) {
    this._volume = Math.max(0, Math.min(1, value));
    if (this._current && !this._muted) {
      this._current.setVolume(this._volume);
    }
  }

  mute(value) {
    this._muted = value;
    this._current?.setVolume(value ? 0 : this._volume);
  }

  // ─── Privé ───────────────────────────────────────────────────────────────

  _loadSound(src, options) {
    return new Promise((resolve) => {
      const url  = `${src}.${AUDIO_FORMATS[0]}`; // fallback ogg à gérer si besoin
      const sound = new Sound('music', url, this._scene, () => resolve(sound), {
        loop:     options.loop ?? true,
        volume:   options.volume ?? 1,
        autoplay: false,
      });
    });
  }

  _fadeTo(sound, targetVolume, duration, onComplete = null) {
    const steps    = 30;
    const interval = duration / steps;
    const start    = sound.getVolume();
    const delta    = (targetVolume - start) / steps;
    let   step     = 0;

    const timer = setInterval(() => {
      step++;
      sound.setVolume(Math.max(0, Math.min(1, start + delta * step)));
      if (step >= steps) {
        clearInterval(timer);
        onComplete?.();
      }
    }, interval);
  }
}
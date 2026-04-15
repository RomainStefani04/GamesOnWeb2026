import { AUDIO_FORMATS } from './../SoundLibrabry';
import * as BABYLON from '@babylonjs/core';

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
    this._pools  = new Map();
  }

  async preload(srcs) {
    const list = Array.isArray(srcs) ? srcs : [srcs];

    await Promise.all(
      list.map(async (src) => {
        if (this._pools.has(src)) return;
        const sound = await this._loadSound(src, { loop: true, volume: 0 });
        this._pools.set(src, sound);
      })
    );
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
    const soundToStop = this._current; // capture locale
    this._current = null;
    if (fadeOut > 0) {
      this._fadeTo(soundToStop, 0, fadeOut, () => soundToStop.stop());
    } else {
      soundToStop.stop();
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

  async _loadSound(src, options) {

    if (this._pools.has(src)) {
        const sound = this._pools.get(src);
        sound.setVolume(options.volume ?? 1);
        return sound;
      }

    const url = `${src}.${AUDIO_FORMATS[0]}`;
    const ctx = BABYLON.Engine.audioEngine?.audioContext;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`[MusicChannel] Fichier introuvable : ${url}`);

    const buffer      = await res.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(buffer);

    // Même pattern que SFXChannel : objet qui imite l'interface
    const gainNode = ctx.createGain();
    gainNode.gain.value = options.volume ?? 1;
    gainNode.connect(ctx.destination);

    let sourceNode = null;

    const sound = {
      _buffer:   audioBuffer,
      _ctx:      ctx,
      _gainNode: gainNode,
      _loop:     options.loop ?? true,
      isPlaying: false,

      play() {
        sourceNode = ctx.createBufferSource();
        sourceNode.buffer    = this._buffer;
        sourceNode.loop      = this._loop;
        sourceNode.connect(this._gainNode);
        sourceNode.start(0);
        this.isPlaying = true;
        sourceNode.onended = () => { this.isPlaying = false; };
      },

      stop() {
        sourceNode?.stop();
        sourceNode = null;
        this.isPlaying = false;
      },

      getVolume()      { return this._gainNode.gain.value; },
      setVolume(value) { this._gainNode.gain.value = Math.max(0, Math.min(1, value)); },
    };

    return sound;
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
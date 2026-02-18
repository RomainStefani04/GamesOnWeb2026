import { Sound } from '@babylonjs/core';
import { AUDIO_FORMATS } from './../SoundLibrabry';
import * as BABYLON from '@babylonjs/core';

/**
 * SFXChannel — Pool d'instances par son pour jouer N coups simultanément
 * sans latence et sans crachotement.
 */
export class SFXChannel {
  constructor(scene) {
    this._scene  = scene;
    this._volume = 1.0;
    this._muted  = false;
    this._pools  = new Map(); // key: src → Sound[]
  }

  /**
   * Précharge un son et crée son pool d'instances
   * @param {string} src
   * @param {number} poolSize
   */
  async preload(src, poolSize = 4) {
    if (this._pools.has(src)) return;

    const instances = await Promise.all(
        Array.from({ length: poolSize }, () => this._loadSound(src))
    );
    
    console.log('🎵 Pool créé:', src, instances); // 👈
    this._pools.set(src, instances);
    }

  /**
   * Joue un son depuis son pool
   * @param {string} src
   */
  play(src) {
    const pool = this._pools.get(src);

    if (!pool) {
      console.warn(`[SFXChannel] Son non préchargé : ${src}`);
      return;
    }

    if (this._muted) return;

    // Cherche une instance libre (non en cours de lecture)
    const available = pool.find(s => !s.isPlaying);

    if (available) {
      available.play();
    } else {
      // Toutes les instances sont occupées → on réutilise la plus ancienne
      pool[0].stop();
      pool[0].setVolume(this._volume);
      pool[0].play();
      // Rotation du pool pour la prochaine fois
      pool.push(pool.shift());
    }
  }

  setVolume(value) {
    this._volume = Math.max(0, Math.min(1, value));
  }

  mute(value) {
    this._muted = value;
  }

  // ─── Privé ───────────────────────────────────────────────────────────────

  _loadSound(src) {
    return new Promise((resolve, reject) => {
        const url = `${src}.${AUDIO_FORMATS[0]}`;
        const ctx = BABYLON.Engine.audioEngine?.audioContext;

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`❌ Fichier introuvable: ${url}`);
                return res.arrayBuffer();
            })
            .then(buffer => ctx.decodeAudioData(buffer))
            .then(decodedBuffer => {
                // On wrappe le buffer dans un objet qui imite l'interface BABYLON.Sound
                const sound = {
                    _buffer: decodedBuffer,
                    _ctx: ctx,
                    _gainNode: ctx.createGain(),
                    isPlaying: false,

                    play() {
                        const source = ctx.createBufferSource();
                        source.buffer = this._buffer;
                        source.connect(this._gainNode);
                        this._gainNode.connect(ctx.destination);
                        source.start(0);
                        this.isPlaying = true;
                        source.onended = () => { this.isPlaying = false; };
                    },

                    stop() {
                        this.isPlaying = false;
                    },

                    setVolume(value) {
                        this._gainNode.gain.value = value;
                    }
                };

                console.log('✅ Son prêt:', url);
                resolve(sound);
            })
            .catch(reject);
    });
}
}
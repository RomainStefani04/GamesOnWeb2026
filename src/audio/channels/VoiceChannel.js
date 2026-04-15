import { AUDIO_FORMATS } from './../SoundLibrabry';
import * as BABYLON from '@babylonjs/core';

export class VoiceChannel {
    constructor(scene) {
        this._scene           = scene;
        this._volume          = 1.0;
        this._muted           = false;
        this._current         = null;
        this._currentPriority = 0;
        this._pools           = new Map(); // ✅ ajout
    }

    async preload(src) {
        if (this._pools.has(src)) return;

        const instance = await this._loadSound(src);
        this._pools.set(src, [instance]);

        //console.log('🎵 Voice prête:', src, [instance]);
    }

    // ✅ Copié depuis SFXChannel (partagé via _getAudioContext)
    async _getAudioContext() {
        const cached = VoiceChannel._sharedCtx;
        if (cached && cached.state !== 'closed') {
            if (cached.state === 'suspended') await cached.resume();
            return cached;
        }

        let ctx = BABYLON.Engine.audioEngine?.audioContext ?? null;

        if (!ctx) {
            const instances = BABYLON.EngineStore?.Instances ?? [];
            for (const engine of instances) {
                const candidate = engine.audioEngine?.audioContext;
                if (candidate && candidate.state !== 'closed') { ctx = candidate; break; }
            }
        }

        if (!ctx) {
            const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
            if (!AudioCtx) throw new Error('❌ Web Audio API non supportée');
            ctx = new AudioCtx();
        }

        if (ctx.state === 'suspended') await ctx.resume();

        VoiceChannel._sharedCtx = ctx;
        return ctx;
    }

    _loadSound(src) {
        return new Promise((resolve, reject) => {
            const url = `${src}.${AUDIO_FORMATS[0]}`;

            Promise.all([fetch(url), this._getAudioContext()])
                .then(([res, ctx]) => {
                    if (!res.ok) throw new Error(`❌ Fichier introuvable: ${url}`);
                    return res.arrayBuffer().then(buffer => ({ buffer, ctx }));
                })
                .then(({ buffer, ctx }) =>
                    ctx.decodeAudioData(buffer).then(decodedBuffer => ({ ctx, decodedBuffer }))
                )
                .then(({ ctx, decodedBuffer }) => {
                    const gainNode = ctx.createGain();
                    gainNode.connect(ctx.destination);

                    resolve({
                        _buffer: decodedBuffer,
                        _ctx: ctx,
                        _gainNode: gainNode,
                        _source: null,
                        isPlaying: false,
                        play() {
                            this.stop();
                            const source = ctx.createBufferSource();
                            source.buffer = this._buffer;
                            source.connect(this._gainNode);
                            source.start(0);
                            this._source = source;
                            this.isPlaying = true;
                            source.onended = () => { this.isPlaying = false; this._source = null; };
                        },
                        stop() {
                            if (this._source) {
                                try { this._source.stop(); } catch (_) {}
                                this._source = null;
                            }
                            this.isPlaying = false;
                        },
                        setVolume(value) {
                            this._gainNode.gain.setTargetAtTime(
                                Math.max(0, Math.min(1, value)),
                                ctx.currentTime,
                                0.01
                            );
                        }
                    });
                })
                .catch(reject);
        });
    }

    /**
     * @param {string} src
     * @param {object} options
     * @param {number} options.priority - 0 = grunt basique, 10 = KO/special
     */
    play(src, { priority = 0 } = {}) {
        if (this._muted) return;
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

VoiceChannel._sharedCtx = null; // cache statique partagé
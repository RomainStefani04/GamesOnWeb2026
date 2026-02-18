import { SoundLibrary } from './SoundLibrabry';

/**
 * SoundSystem — Logique métier audio.
 * C'est lui qui fait le pont entre l'EventBus et l'AudioMixer.
 * Il connaît les règles du jeu (quel son pour quel event),
 * mais ne sait pas comment les sons sont techniquement joués.
 */
export class SoundSystem {
  /**
   * @param {AudioMixer} mixer
   * @param {EventBus}   eventBus
   */
  constructor(mixer, eventBus) {
    this._mixer    = mixer;
    this._eventBus = eventBus;
    this._unsubs   = []; // liste des unsubscribers pour cleanup
  }

  /**
   * Précharge tous les sons nécessaires pour une scène donnée
   * À appeler depuis ton SceneManager avant d'afficher la scène
   */
  async preloadForScene(sceneName) {
    const lib = SoundLibrary;

    if (sceneName === 'FightScene') {
      await Promise.all([
        // SFX de combat
        this._mixer.sfx.preload(lib.sfx.HIT_LIGHT.src,   lib.sfx.HIT_LIGHT.pool),
      ]);
    }

    if (sceneName === 'MenuScene') {
      await Promise.all([
        this._mixer.sfx.preload(lib.sfx.UI_SELECT.src,  lib.sfx.UI_SELECT.pool),
        this._mixer.sfx.preload(lib.sfx.UI_CONFIRM.src, lib.sfx.UI_CONFIRM.pool),
        this._mixer.sfx.preload(lib.sfx.UI_BACK.src,    lib.sfx.UI_BACK.pool),
      ]);
    }
  }

  /** Abonne tous les listeners — à appeler une fois au démarrage */
  init() {
    const { sfx, voice, music } = this._mixer;
    const lib = SoundLibrary;

    // ── Combat ──────────────────────────────────────────────────────────────
    this._unsubs.push(
      this._eventBus.on('hit:landed', ({ strength, blocked }) => {
        if (blocked) {
          sfx.play(lib.sfx.HIT_BLOCKED.src);
          return;
        }
        const map = {
          light:  lib.sfx.HIT_LIGHT.src,
          heavy:  lib.sfx.HIT_HEAVY.src,
        };
        sfx.play(map[strength] ?? lib.sfx.HIT_LIGHT.src);
      })
    );

    this._unsubs.push(
      this._eventBus.on('player:jump',    () => sfx.play(lib.sfx.JUMP.src))
    );

    this._unsubs.push(
      this._eventBus.on('player:land',    () => sfx.play(lib.sfx.LAND.src))
    );

    this._unsubs.push(
      this._eventBus.on('special:hadouken', ({ character }) => {
        sfx.play(lib.sfx.HADOUKEN.src);
        voice.play(lib.voice[`${character.toUpperCase()}_HADOUKEN`]?.src, { priority: 8 });
      })
    );

    this._unsubs.push(
      this._eventBus.on('round:ko', ({ character }) => {
        sfx.play(lib.sfx.KO.src);
        voice.play(lib.voice[`${character.toUpperCase()}_KO`]?.src, { priority: 10 });
        music.stop(800); // fade out la musique sur le KO
      })
    );

    // ── UI ──────────────────────────────────────────────────────────────────
    this._unsubs.push(
      this._eventBus.on('ui:select',  () => sfx.play(lib.sfx.UI_SELECT.src))
    );
    this._unsubs.push(
      this._eventBus.on('ui:confirm', () => sfx.play(lib.sfx.UI_CONFIRM.src))
    );
    this._unsubs.push(
      this._eventBus.on('ui:back',    () => sfx.play(lib.sfx.UI_BACK.src))
    );

    // ── Scènes ──────────────────────────────────────────────────────────────
    this._unsubs.push(
      this._eventBus.on('scene:fight:start', ({ stageId }) => {
        const key = `STAGE_${stageId.toUpperCase()}`;
        music.crossfadeTo(lib.music[key]?.src ?? lib.music.STAGE_RYU.src, 1200);
      })
    );

    this._unsubs.push(
      this._eventBus.on('scene:menu:enter', () => {
        music.crossfadeTo(lib.music.MAIN_MENU.src, 1000);
      })
    );
  }

  /** Cleanup — à appeler quand tu détruis le système */
  destroy() {
    this._unsubs.forEach(unsub => unsub());
    this._unsubs = [];
  }
}
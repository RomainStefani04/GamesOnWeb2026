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
        this._mixer.sfx.preload(lib.sfx.HIT_LIGHT.src,   lib.sfx.HIT_LIGHT.pool),
        this._mixer.sfx.preload(lib.sfx.HIT_HEAVY.src,   lib.sfx.HIT_HEAVY.pool),
        this._mixer.sfx.preload(lib.sfx.FIREBALL.src, lib.sfx.FIREBALL.pool),
        this._mixer.music.preload(lib.music.TOKYO_STAGE.src, 1),
      ]);
    }

    if (sceneName === 'CharactersSelectionScene') {
      await Promise.all([
        this._mixer.music.preload(lib.music.CHARACTER_SELECTION.src, 1),
        this._mixer.sfx.preload(lib.sfx.UI_SELECT.src, lib.sfx.UI_SELECT.pool),
        this._mixer.sfx.preload(lib.sfx.UI_CONFIRM.src, lib.sfx.UI_CONFIRM.pool),
        this._mixer.sfx.preload(lib.sfx.UI_BACK.src, lib.sfx.UI_BACK.pool),
        this._mixer.sfx.preload(lib.sfx.UI_HOOVER.src, lib.sfx.UI_HOOVER.pool),
      ]);
    }

    if (sceneName === 'MenuScene') {
      await Promise.all([
        this._mixer.music.preload(lib.music.MAIN_MENU.src, 1),
        this._mixer.sfx.preload(lib.sfx.UI_SELECT.src, lib.sfx.UI_SELECT.pool),
        this._mixer.sfx.preload(lib.sfx.UI_CONFIRM.src, lib.sfx.UI_CONFIRM.pool),
        this._mixer.sfx.preload(lib.sfx.UI_BACK.src, lib.sfx.UI_BACK.pool),
        this._mixer.sfx.preload(lib.sfx.UI_HOOVER.src, lib.sfx.UI_HOOVER.pool),
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
      this._eventBus.on('attack:fireball', () => {
        sfx.play(lib.sfx.FIREBALL.src);
      })
    );

    this._unsubs.push(
      this._eventBus.on('voice:entry', ({ character }) => {
        sfx.play(lib.sfx.HADOUKEN.src);
        voice.play(lib.voice[`${character.toUpperCase()}_ENTRY`]?.src, { priority: 8 });
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
    this._unsubs.push(
      this._eventBus.on('ui:hoover',    () => sfx.play(lib.sfx.UI_HOOVER.src))
    );

    // ── Scènes ──────────────────────────────────────────────────────────────
    this._unsubs.push(
      this._eventBus.on('scene:fight:enter', (city) => {
        const key = `${city.toUpperCase()}_STAGE`;
        music.crossfadeTo(lib.music[key]?.src, 1200);
      })
    );

    this._unsubs.push(
      this._eventBus.on('scene:menu:enter', () => {
        music.crossfadeTo(lib.music.MAIN_MENU.src, 1000);
      })
    );
    this._unsubs.push(
      this._eventBus.on('scene:characters:selection', () => {
        music.crossfadeTo(lib.music.CHARACTER_SELECTION.src, 1000);
      })
    );
    this._unsubs.push(
      this._eventBus.on('scene:loading', () => {
        music.stop();
      })
    );
  }

  /** Cleanup — à appeler quand tu détruis le système */
  destroy() {
    this._unsubs.forEach(unsub => unsub());
    this._unsubs = [];
  }
}
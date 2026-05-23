/**
 * SoundLibrary — Catalogue centralisé de tous les assets audio.
 * C'est ici et UNIQUEMENT ici que tu références les fichiers.
 * Ajouter un son = ajouter une entrée ici, rien d'autre à toucher.
 */
export const SoundLibrary = {

  music: {
    MAIN_MENU:    { src: 'assets/audio/music/main_menu_theme' },
    CHARACTER_SELECTION: { src: 'assets/audio/music/selection_menu_theme' },
    TOKYO_STAGE: { src: 'assets/audio/music/tokyo_theme' },
    KYOTO_STAGE: { src: 'assets/audio/music/kyoto_theme' },
    SHIBUYA_STAGE: { src: 'assets/audio/music/shibuya_theme' },
  },

  sfx: {
    // Coups
    HIT_LIGHT:    { src: 'assets/audio/sfx/hit_light',   pool: 2 },
    HIT_HEAVY:    { src: 'assets/audio/sfx/hit_heavy',   pool: 2 },
    HIT_BLOCKED:  { src: 'assets/audio/sfx/hit_blocked', pool: 2 },

    // Mouvements
    JUMP:         { src: 'assets/audio/sfx/jump',        pool: 2 },
    LAND:         { src: 'assets/audio/sfx/land',        pool: 2 },
    DASH:         { src: 'assets/audio/sfx/dash',        pool: 2 },

    // Spéciaux
    FIREBALL:     { src: 'assets/audio/sfx/fireball',    pool: 2 },
    HADOUKEN:     { src: 'assets/audio/sfx/hadouken',    pool: 2 },
    SHORYUKEN:    { src: 'assets/audio/sfx/shoryuken',   pool: 2 },

    // UI
    UI_SELECT:    { src: 'assets/audio/sfx/ui_select',   pool: 1 },
    UI_CONFIRM:   { src: 'assets/audio/sfx/ui_confirm',  pool: 1 },
    UI_BACK:      { src: 'assets/audio/sfx/ui_back',     pool: 1 },
    UI_HOOVER:    { src: 'assets/audio/sfx/ui_hoover',   pool: 1 },
    ROUND_START:  { src: 'assets/audio/sfx/round_start', pool: 1 },
    KO:           { src: 'assets/audio/sfx/ko',          pool: 1 },
  },

  voice: {
    SUKUNA_ENTRY: { src: 'assets/audio/voice/sukuna_entry_output' },
  },

  ambience: {
    CROWD_IDLE:     { src: 'assets/audio/ambience/crowd_idle'  },
    CROWD_HYPE:     { src: 'assets/audio/ambience/crowd_hype'  },
  },

};

// Formats supportés — l'ordre définit la priorité
export const AUDIO_FORMATS = ['mp3', 'ogg'];
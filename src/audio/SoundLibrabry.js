/**
 * SoundLibrary — Catalogue centralisé de tous les assets audio.
 * C'est ici et UNIQUEMENT ici que tu références les fichiers.
 * Ajouter un son = ajouter une entrée ici, rien d'autre à toucher.
 */
export const SoundLibrary = {

  music: {
    MAIN_MENU:    { src: 'assets/audio/music/main_menu'    },
  },

  sfx: {
    // Coups
    HIT_LIGHT:    { src: 'assets/audio/sfx/hit_light',   pool: 4 },
    HIT_HEAVY:    { src: 'assets/audio/sfx/hit_heavy',   pool: 3 },
    HIT_BLOCKED:  { src: 'assets/audio/sfx/hit_blocked', pool: 4 },

    // Mouvements
    JUMP:         { src: 'assets/audio/sfx/jump',        pool: 2 },
    LAND:         { src: 'assets/audio/sfx/land',        pool: 2 },
    DASH:         { src: 'assets/audio/sfx/dash',        pool: 2 },

    // Spéciaux
    HADOUKEN:     { src: 'assets/audio/sfx/hadouken',    pool: 2 },
    SHORYUKEN:    { src: 'assets/audio/sfx/shoryuken',   pool: 2 },

    // UI
    UI_SELECT:    { src: 'assets/audio/sfx/ui_select',   pool: 1 },
    UI_CONFIRM:   { src: 'assets/audio/sfx/ui_confirm',  pool: 1 },
    UI_BACK:      { src: 'assets/audio/sfx/ui_back',     pool: 1 },
    ROUND_START:  { src: 'assets/audio/sfx/round_start', pool: 1 },
    KO:           { src: 'assets/audio/sfx/ko',          pool: 1 },
  },

  voice: {
    RYU_HADOUKEN:   { src: 'assets/audio/voice/ryu_hadouken'   },
    RYU_SHORYUKEN:  { src: 'assets/audio/voice/ryu_shoryuken'  },
    RYU_KO:         { src: 'assets/audio/voice/ryu_ko'         },
    KEN_HADOUKEN:   { src: 'assets/audio/voice/ken_hadouken'   },
    KEN_KO:         { src: 'assets/audio/voice/ken_ko'         },
  },

  ambience: {
    CROWD_IDLE:     { src: 'assets/audio/ambience/crowd_idle'  },
    CROWD_HYPE:     { src: 'assets/audio/ambience/crowd_hype'  },
  },

};

// Formats supportés — l'ordre définit la priorité
export const AUDIO_FORMATS = ['mp3', 'ogg'];
export class SettingsManager {
    static volume      = parseFloat(localStorage.getItem('game_volume'))      || 0.5;
    static targetFPS   = parseInt(localStorage.getItem('game_fps'))           || 60;
    static controlMode = localStorage.getItem('game_control_mode')            || 'keyboard';

    static controlModes = {
        player1: localStorage.getItem('control_mode_p1') || 'keyboard',
        player2: localStorage.getItem('control_mode_p2') || 'keyboard'
    };

    static _defaultBindings() {
        return {
            player1: {
                moveRight:  'KeyD',
                moveLeft:   'KeyA',
                block:      'KeyS',
                jab:        'KeyQ',
                cross:      'KeyE',
                light_kick: 'KeyF',
                heavy_kick: 'KeyG',
                leg_sweep:  'KeyH',
                fireball:   'KeyR',
                jump:       'KeyW',
            },
            player2: {
                moveRight:  'ArrowRight',
                moveLeft:   'ArrowLeft',
                block:      'ArrowDown',
                jab:        'Numpad4',
                cross:      'Numpad6',
                light_kick: 'Numpad1',
                heavy_kick: 'Numpad2',
                leg_sweep:  'Numpad3',
                fireball:   'Numpad5',
                jump:       'ArrowUp',
            },
        };
    }

    static bindings = (() => {
        try {
            const saved = JSON.parse(localStorage.getItem('fight_bindings'));
            if (saved?.player1?.moveRight && saved?.player2?.moveRight) {
                return saved;
            }
        } catch (_) {
        }

        // Purge de l'ancien format pour éviter de retomber dedans au prochain lancement
        localStorage.removeItem('fight_bindings');
        return SettingsManager._defaultBindings();
    })();

    static save() {
        localStorage.setItem('fight_bindings',    JSON.stringify(this.bindings));
        localStorage.setItem('control_mode_p1',   this.controlModes.player1);
        localStorage.setItem('control_mode_p2',   this.controlModes.player2);
        localStorage.setItem('game_volume',       this.volume);
        localStorage.setItem('game_fps',          this.targetFPS);
        localStorage.setItem('game_control_mode', this.controlMode);
    }
}
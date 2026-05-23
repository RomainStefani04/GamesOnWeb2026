import { SettingsManager } from './SettingsManager';

export class InputMapper {
    constructor(inputManager, playerId = 'player1') {
        this.inputManager = inputManager;
        this.playerId     = playerId; // 'player1' ou 'player2'
    }

    isKeyPressed(action) {
        // On récupère le mode spécifique à CE joueur
        const currentMode = SettingsManager.controlModes[this.playerId];

        if (currentMode === 'gamepad') {
            // On récupère la manette correspondante (index 0 pour P1, 1 pour P2)
            const gpIndex = (this.playerId === 'player1') ? 0 : 1;
            const gp = this.inputManager.gamepads[gpIndex];
            
            if (gp) return this.checkGamepad(gp, action);
        }

        // Si on est en clavier ou que la manette est absente
        const playerBindings = SettingsManager.bindings[this.playerId];
        const key = playerBindings ? playerBindings[action] : null;
        return key ? this.inputManager.isKeyPressed(key) : false;
    }

    // On passe 'gp' en paramètre pour être sûr d'utiliser la bonne manette
    checkGamepad(gp, action) {
        const buttons = gp.browserGamepad?.buttons;
        const axes = gp.browserGamepad?.axes;
        if (!buttons) return false;

        const map = {
            jab: 2, cross: 3, light_kick: 0, heavy_kick: 1, 
            leg_sweep:  6,
            fireball:   7,
            pause: 9,
            jump: 12, block: 13, moveLeft: 14, moveRight: 15
        };

        let isPressed = false;
        const buttonIndex = map[action];

        // 1. D-Pad + Boutons
        if (buttonIndex !== undefined && buttons[buttonIndex]) {
            isPressed = buttons[buttonIndex].pressed || buttons[buttonIndex].value > 0.5;
        }

        // 2. Joysticks (Seulement si le bouton n'est pas déjà pressé)
        if (!isPressed && axes) {
            const threshold = 0.5;
            switch (action) {
                case 'moveRight': isPressed = axes[0] > threshold; break;
                case 'moveLeft':  isPressed = axes[0] < -threshold; break;
                case 'jump':      isPressed = axes[1] < -threshold; break;
                case 'block':     isPressed = axes[1] > threshold; break;
            }
        }

        return isPressed;
    }
}
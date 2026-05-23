import * as BABYLON from '@babylonjs/core';
import { SettingsManager } from './SettingsManager';

export class InputManager {
    constructor(scene) {
        this.keys = {};
        this.gamepads = []; // Tableau pour stocker plusieurs manettes

        const gamepadManager = new BABYLON.GamepadManager();
        
        gamepadManager.onGamepadConnectedObservable.add((gp) => {
            // gp.index donne l'ordre de branchement (0, 1, 2...)
            this.gamepads[gp.index] = gp;
            
            const targetPlayer = (gp.index === 0) ? 'player1' : 'player2';
            
            // On ne change le mode QUE pour ce joueur
            SettingsManager.controlModes[targetPlayer] = 'gamepad';
            SettingsManager.save();

            console.log(`Manette détectée pour ${targetPlayer}`);
            
            window.dispatchEvent(new CustomEvent('inputModeChanged', { 
                detail: { player: targetPlayer, mode: 'gamepad' } 
            }));
        });

        gamepadManager.onGamepadDisconnectedObservable.add((gp) => {
            const targetPlayer = (gp.index === 0) ? 'player1' : 'player2';
            this.gamepads[gp.index] = null;
            
            SettingsManager.controlModes[targetPlayer] = 'keyboard';
            SettingsManager.save();

            window.dispatchEvent(new CustomEvent('inputModeChanged', { 
                detail: { player: targetPlayer, mode: 'keyboard' } 
            }));
        });
    }

    isKeyPressed(key) {
        return this.keys[key] || false;
    }

    async captureNextKey() {
        this.isRebinding = true;
        this.lastKeyPressed = null;
        
        while (this.lastKeyPressed === null) {
            await new Promise(r => setTimeout(r, 16));
        }
        
        const key = this.lastKeyPressed;
        this.isRebinding = false;
        return key;
    }
}
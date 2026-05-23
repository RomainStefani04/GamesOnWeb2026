import * as BABYLON from '@babylonjs/core';
import { SettingsManager } from './SettingsManager';

export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.keys = {};
        this.gamepads = [];
        this.isRebinding = false;
        this.lastKeyPressed = null;

        this._registerKeyboardListeners();
        this._registerGamepadListeners();
    }

    _registerKeyboardListeners() {
        if (!this.scene) return;

        this.keyboardObserver = this.scene.onKeyboardObservable.add((kbInfo) => {
            const event = kbInfo.event;
            const key = event.code;

            if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                this.keys[key] = true;

                if (this.isRebinding) {
                    this.lastKeyPressed = key;
                }
            }

            if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
                this.keys[key] = false;
            }
        });
    }

    _registerGamepadListeners() {
        const gamepadManager = new BABYLON.GamepadManager();

        gamepadManager.onGamepadConnectedObservable.add((gp) => {
            this.gamepads[gp.index] = gp;

            const targetPlayer = (gp.index === 0) ? 'player1' : 'player2';

            SettingsManager.controlModes[targetPlayer] = 'gamepad';
            SettingsManager.save();

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
            await new Promise(resolve => setTimeout(resolve, 16));
        }

        const key = this.lastKeyPressed;
        this.isRebinding = false;
        return key;
    }

    dispose() {
        if (this.scene && this.keyboardObserver) {
            this.scene.onKeyboardObservable.remove(this.keyboardObserver);
            this.keyboardObserver = null;
        }
    }
}
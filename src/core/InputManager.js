import * as BABYLON from '@babylonjs/core';

export class InputManager {
    constructor(scene) {
        this.keys = {};
        this.mouseButtons = {};
        this.keysPressed = {};
        this.mouseButtonsPressed = {};

        // Gestion du clavier
        scene.onKeyboardObservable.add((info) => {
            this.keys[info.event.code] = info.type === 1;
        });

        // Gestion de la souris
        scene.onPointerObservable.add((info) => {
            if (info.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                this.mouseButtons[info.event.button] = true;
            } else if (info.type === BABYLON.PointerEventTypes.POINTERUP) {
                this.mouseButtons[info.event.button] = false;
            }
        });
    }

    isKeyPressed(key) {
        return this.keys[key] || false;
    }

    isKeyReleased(key) {
        const isPressed = this.isKeyPressed(key);
        if (isPressed) {
            this.keysPressed[key] = true;
            return false;
        }
        if (!isPressed && this.keysPressed[key]) {
            this.keysPressed[key] = false;
            return true;
        }
        return false;
    }

    isMouseButtonPressed(button) {
        return this.mouseButtons[button] || false;
    }

    isMouseButtonReleased(button) {
        const isPressed = this.isMouseButtonPressed(button);
        if (isPressed) {
            this.mouseButtonsPressed[button] = true;
            return false;
        }
        if (!isPressed && this.mouseButtonsPressed[button]) {
            this.mouseButtonsPressed[button] = false;
            return true;
        }
        return false;
    }
}
import * as BABYLON from '@babylonjs/core';
import { InputManager } from '../core/InputManager';
import { InputMapper } from '../core/InputMapper';

export class MenuScene {
    constructor(engine) {
        this.engine = engine;
        this.init();
    }

    
    init() {
        this.scene = new BABYLON.Scene(this.engine);
        this.inputManager = new InputManager(this.scene);
        this.inputMapper = new InputMapper(this.inputManager, "MenuScene");
    }

    onDispose() {
        this.scene.dispose();
    }

    render() {
    }
}
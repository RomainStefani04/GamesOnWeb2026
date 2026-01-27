import * as BABYLON from '@babylonjs/core';
import { InputManager } from "../core/InputManager";
import { InputMapper } from "../core/InputMapper";
import { Arena } from '../arena/Arena';
import { AssetManager } from '../core/AssetManager';
import { FightCamera } from '../arena/FightCamera';

export class FightScene {
    constructor(engine) {
        this.engine = engine;
        this.init();
    }

    init() {
        this.scene = new BABYLON.Scene(this.engine);
        this.assetManager = new AssetManager(this.scene);
        this.inputManager = new InputManager(this.scene);
        this.inputMapper = new InputMapper(this.inputManager, "FightScene");
        this.arena = new Arena(this.scene, this.assetManager);
        this.camera = new FightCamera(this.scene);
    }

    onDispose() {
        this.scene.dispose();
    }

    render() {
        this.scene.render();
    }

}
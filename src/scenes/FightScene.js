import * as BABYLON from '@babylonjs/core';
import { InputManager } from "../core/InputManager";
import { InputMapper } from "../core/InputMapper";
import { Arena } from '../arena/Arena';
import { AssetManager } from '../core/AssetManager';
import { FightCamera } from '../arena/FightCamera';

export class FightScene {
    constructor(engine, sceneManager, params = {}) {
        this.engine = engine;
        this.sceneManager = sceneManager;
        this.level = params.level || 1;
        this.city = params.city || "Unknown";
        
        this.init();
    }

    init() {
        this.scene = new BABYLON.Scene(this.engine);
        this.assetManager = new AssetManager(this.scene);
        this.inputManager = new InputManager(this.scene);
        this.inputMapper = new InputMapper(this.inputManager, "FightScene");
        this.camera = new FightCamera(this.scene);
        console.log(`FightScene initialisée - Niveau ${this.level} dans la ville de ${this.city}`);
        this.setupLevel();
    }

    setupLevel() {
        // Charger l'arène en fonction de la ville sélectionnée      
        console.log(`Chargement de l'arène: ${this.city}`);
        this.arena = new Arena(this.scene, this.assetManager, this.city);

    }

    onDispose() {
        this.scene.dispose();
    }

    render() {
        this.scene.render();
    }

}
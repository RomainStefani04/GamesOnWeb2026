import * as BABYLON from '@babylonjs/core';
import { SceneManager } from './SceneManager';
import { AssetManager } from './AssetManager';
import HavokPhysics from '@babylonjs/havok';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.initialized = false;
        this.init();
    }

    async init() {
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.assetManager = new AssetManager();
        this.havokInstance = await HavokPhysics();
        this.sceneManager = new SceneManager(this.engine, this.assetManager, this.havokInstance);

        // ==========================================
        // CHOISIR LE MODE DE DÉMARRAGE :
        // ==========================================

        // Mode 1 : Menu principal (production)
        this.sceneManager.switchTo('MenuScene');

        // Mode 2 : Combat direct vs IA (test)
        // this.sceneManager.switchTo('FightScene', {
        //     city: "Tokyo",
        //     characters: { player1: "akaza", player2: "akaza" },
        //     gameMode: "solo"
        // });

        // Mode 3 : Entraînement IA (self-play)
        // this.sceneManager.switchTo('TrainingScene', {
        //     city: "Tokyo",
        //     character: "akaza"
        // });

        this.initialized = true;
    }

    start() {
        const divFps = document.getElementById("fps");

        this.engine.runRenderLoop(() => {
            divFps.innerHTML = this.engine.getFps().toFixed() + " fps";
            if (!this.initialized) return;
            this.sceneManager.render();
        });

        window.addEventListener('resize', (event) => {
            this.engine.resize();
        });
    }
}
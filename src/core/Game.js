import * as BABYLON from '@babylonjs/core';
import { SceneManager } from './SceneManager';
import { AssetManager } from './AssetManager';
import HavokPhysics from '@babylonjs/havok';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.init();
        this.initialized = false;
    }

    async init() {
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.assetManager = new AssetManager();
        this.havokInstance = await HavokPhysics();
        this.sceneManager = new SceneManager(this.engine, this.assetManager, this.havokInstance);
        //this.sceneManager.switchTo('MenuScene');
        this.sceneManager.switchTo('FightScene', "kyoto");
        this.initialized = true;
    }

    start() {
        let divFps = document.getElementById("fps");
        
        this.engine.runRenderLoop(() => {
            divFps.innerHTML = this.engine.getFps().toFixed() + " fps";
            if (!this.initialized) return;
            this.sceneManager.render();
        });

        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }
}
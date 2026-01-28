import * as BABYLON from '@babylonjs/core';
import { SceneManager } from './SceneManager';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.sceneManager = new SceneManager(this.engine, this.inputManager);
        this.isInit = true;
    }

    start() {
        let divFps = document.getElementById("fps");   
        //this.sceneManager.switchTo('MenuScene');
        this.sceneManager.switchTo('FightScene');
        
        this.engine.runRenderLoop(() => {
            divFps.innerHTML = this.engine.getFps().toFixed() + " fps";
            
            if (!this.isInit) return;
            this.sceneManager.render();
        });

        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }
}
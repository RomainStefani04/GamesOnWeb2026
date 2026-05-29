import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Audio/audioEngine';
import '@babylonjs/core/Audio/sound';
import { SceneManager } from './SceneManager';
import { AssetManager } from './AssetManager';
import { eventBus } from './EventBus';  
import { AudioMixer } from './../audio/AudioMixer.js';
import { SoundSystem } from './../audio/SoundSystem.js';
import HavokPhysics from '@babylonjs/havok';
import { Player } from '../character/Player.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.initialized = false;
        this.init();
    }

    async init() {
        this.engine = new BABYLON.Engine(this.canvas, true);
        BABYLON.Engine.audioEngine = new BABYLON.AudioEngine();
        this.assetManager = new AssetManager();
        this.havokInstance = await HavokPhysics();
        
        this._audioScene = new BABYLON.Scene(this.engine);
        this._audioScene.autoClear = false; // elle ne rend rien visuellement
        new BABYLON.Camera('audioCamera', BABYLON.Vector3.Zero(), this._audioScene);
        this.audioMixer  = new AudioMixer(this._audioScene);
        this.soundSystem = new SoundSystem(this.audioMixer, eventBus);
        this.sceneManager = new SceneManager(this.engine, this.assetManager, this.havokInstance, this.soundSystem);
        // Abonne tous les listeners EventBus du SoundSystem
        this.soundSystem.init();

        this.sceneManager.switchTo('MenuScene');

        // this.sceneManager.switchTo('FightScene', {
        //     city: "tokyo",
        //     characters: {
        //         player1: 'akaza',
        //         player2: 'akaza'
        //     },
        //     gameMode: 'solo'
        // });

        this.initialized = true;
    }

    start() {
        const divFps = document.getElementById("fps");

        this.engine.runRenderLoop(() => {
            divFps.innerHTML = this.engine.getFps().toFixed() + " fps";
            if (!this.initialized) return;
            this._audioScene.render();
            this.sceneManager.render();
        });

        window.addEventListener('resize', (event) => {
            this.engine.resize();
        });
    }
}
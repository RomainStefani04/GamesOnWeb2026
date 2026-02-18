import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Audio/audioEngine';
import '@babylonjs/core/Audio/sound';
import { SceneManager } from './SceneManager';
import { AssetManager } from './AssetManager';
import { eventBus } from './EventBus';  
import { AudioMixer } from './../audio/AudioMixer.js';
import { SoundSystem } from './../audio/SoundSystem.js';
import HavokPhysics from '@babylonjs/havok';

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
        
        // ── Audio ──────────────────────────────────────────────────────────
        // On crée une scène Babylon dédiée uniquement à l'audio.
        // Pourquoi ? BabylonJS attache les Sound à une scène.
        // Si tu attaches les sons à la scène de combat, ils sont détruits
        // quand tu changes de scène. Une scène audio persistante règle ça.
        this._audioScene = new BABYLON.Scene(this.engine);
        this._audioScene.autoClear = false; // elle ne rend rien visuellement
        new BABYLON.Camera('audioCamera', BABYLON.Vector3.Zero(), this._audioScene);
        this.audioMixer  = new AudioMixer(this._audioScene);
        this.soundSystem = new SoundSystem(this.audioMixer, eventBus);
        this.sceneManager = new SceneManager(this.engine, this.assetManager, this.havokInstance, this.soundSystem);
        // Abonne tous les listeners EventBus du SoundSystem
        this.soundSystem.init();

        this.sceneManager.switchTo('MenuScene');
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

        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }
}
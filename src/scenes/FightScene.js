import * as BABYLON from '@babylonjs/core';
import { InputManager } from "../core/InputManager";
import { InputMapper } from "../core/InputMapper";
import { Arena } from '../arena/Arena';
import { FightCamera } from '../arena/FightCamera';
import { Player } from '../character/Player';


export class FightScene {
    constructor(engine, assetManager, havokInstance, city) {
        this.engine = engine;
        this.assetManager = assetManager;
        this.havokInstance = havokInstance;
        this.city = city;

        this.deltaTime = 0;
        this.lastTime = performance.now();
        
        this.init();
    }

    async init() {
        this.initScene();
        await this.initAssetManager();
        this.initPlayer();
        this.arena = new Arena(this.scene, this.assetManager, this.city);
    }

    initScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.inputManager = new InputManager(this.scene);
        this.fightCamera = new FightCamera(this.scene);
        this.havokPlugin = new BABYLON.HavokPlugin(true, this.havokInstance);
        this.scene.enablePhysics(
            new BABYLON.Vector3(0, -9.81, 0),
            this.havokPlugin
        );
    }

    async initAssetManager() {  
        this.assetManager.init(this.scene);
        await this.assetManager.loadFightAssets(this.city);
    }

    initPlayer() {
        let clonePlayer1 = this.assetManager.cloneCharacter()
        this.player = new Player(this.scene,
            "player1",
            new InputMapper(this.inputManager, "player1"), 
            clonePlayer1?.mesh,
            clonePlayer1?.animationGroups
        );
        this.player.setPosition(new BABYLON.Vector3(0, 0, 0));
    }

    // VERIFIER SI ON DISPOSE BIEN TOUT
    onDispose() {
        this.player?.dispose();
        this.fightCamera?.dispose();
        this.scene.dispose();
    }

    render() {
        if (this.assetManager.loaded === false) { return; }
        this.update();
        this.scene.render();
    }

    update() {
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.player?.update(this.deltaTime);
    }

}
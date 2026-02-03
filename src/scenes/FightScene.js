import * as BABYLON from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import { InputManager } from "../core/InputManager";
import { InputMapper } from "../core/InputMapper";
import { Arena } from '../arena/Arena';
import { AssetManager } from '../core/AssetManager';
import { FightCamera } from '../arena/FightCamera';
import { Player } from '../character/Player';


export class FightScene {
    constructor(engine, sceneManager, params = {}) {
        this.engine = engine;
        this.sceneManager = sceneManager;
        this.level = params.level;
        this.city = params.city;
        
        this.player = null;

        this.havokPlugin = null;
        this.deltaTime = 0;
        this.lastTime = performance.now();
        this.isReady = false;
        
        this.scene = new BABYLON.Scene(this.engine);
        this.fightCamera = new FightCamera(this.scene);

        this.initAsync();
    }

    async initAsync() {
        try {
            
            // Initialiser Havok pour plus tard (collisions je pense)
            await this.initHavok();
            
            this.assetManager = new AssetManager(this.scene);
            this.inputManager = new InputManager(this.scene);
            this.inputMapper = new InputMapper(this.inputManager, "FightScene");
        
            this.setupLevel();
            await this.setupPlayer();
            
            this.isReady = true;
            
        } catch (error) {
            console.error('Erreur initialisation FightScene:', error);
        }
    }

    async initHavok() {
        try {
            const havokInstance = await HavokPhysics();
            
            this.havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);
            
            this.scene.enablePhysics(
                new BABYLON.Vector3(0, -9.81, 0),
                this.havokPlugin
            );

            console.log('Havok Physics initialisé');
            
        } catch (error) {
            console.error('Erreur initialisation Havok:', error);
            throw error;
        }
    }


    setupLevel() {
        console.log(`Chargement de l'arène: ${this.city}`);
        this.arena = new Arena(this.scene, this.assetManager, this.city);
    }

    async setupPlayer() {
        this.player = new Player(this.scene, {
            name: "THE PLAYER",
            speed: 1.3
        });

        try {
            const result = await BABYLON.ImportMeshAsync("assets/models/character.glb", this.scene);
            this.player.initMesh(
                result.meshes[0],
                result.skeletons?.[0],
                result.animationGroups
            );
            this.player.mesh.position = new BABYLON.Vector3(0, 0, 0);
            
        } catch (error) {
            console.error("Erreur chargement joueur:", error);
        }

    }

   
    onDispose() {
        this.player?.dispose();
        this.fightCamera?.dispose();
        this.scene.dispose();
    }

    update() {
        if (!this.isReady) return;
        

        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (this.player) {
            this.player.update(this.deltaTime, this.inputMapper);
        }

    }

    render() {
        this.update();
        this.scene.render();
    }
}
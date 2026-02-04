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

        // Callback de progression
        this.onLoadProgress = params.onLoadProgress || (() => {});
        
        this.player = null;

        this.havokPlugin = null;
        this.deltaTime = 0;
        this.lastTime = performance.now();
        this.isReady = false;

        // Promise pour signaler que le chargement est terminé
        this.readyPromise = null;
        this.readyResolve = null;
        // Créer la promise
        this.readyPromise = new Promise((resolve) => {
            this.readyResolve = resolve;
        });
        
        this.scene = new BABYLON.Scene(this.engine);
        this.fightCamera = new FightCamera(this.scene);

        this.initAsync();
    }

    async waitForReady() {
        return this.readyPromise;
    }

    async initAsync() {
        try {
            
            // Initialiser Havok pour plus tard (collisions je pense)
            this.onLoadProgress(5, "Initialisation du moteur physique...");
            await this.initHavok();
            await this.delay(400);
            this.onLoadProgress(20, "Moteur physique prêt !");
            
            this.onLoadProgress(25, "Initialisation des systèmes...");
            this.assetManager = new AssetManager(this.scene);
            this.inputManager = new InputManager(this.scene);
            this.inputMapper = new InputMapper(this.inputManager, "FightScene");
            await this.delay(300);
            this.onLoadProgress(30, "Systèmes initialisés !");

            this.onLoadProgress(35, "Configuration du système de combat...");
            // Ici on foutra le système de combat
            await this.delay(200);
            this.onLoadProgress(40, "Système de combat prêt !");
        
            this.onLoadProgress(45, `Chargement de l'arène: ${this.city}...`);
            await this.setupLevel();
            this.onLoadProgress(60, "Arène chargée !");

            this.onLoadProgress(65, "Chargement des personnages...");
            await this.delay(400);
            await this.setupPlayer();
            this.onLoadProgress(85, "Personnages prêts !");

            this.onLoadProgress(95, "Finalisation...");
            await this.delay(200); // nous sommes des menteurs
            
            this.isReady = true;
            this.onLoadProgress(100, "Prêt à combattre !");

            this.readyResolve();

        } catch (error) {
            console.error('Erreur initialisation FightScene:', error);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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


    async setupLevel() {
        console.log(`Chargement de l'arène: ${this.city}`);
        this.arena = new Arena(this.scene, this.assetManager, this.city);
        await this.arena.waitForReady();
    }

    async setupPlayer() {
        this.player = new Player(this.scene, {
            name: "THE PLAYER",
            speed: 2.5
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
import * as BABYLON from '@babylonjs/core';

export class WeatherSystem {
    /**
     * @param {BABYLON.Scene} scene
     * @param {WetGroundSystem} wetGroundSystem - Référence pour créer les impacts
     */
    constructor(scene, wetGroundSystem) {
        this.scene = scene;
        this.wetGroundSystem = wetGroundSystem;
        
        this._rainDensity = 2500;
        this._arenaSize = 20;
        this._rainHeight = 15;

        this._initRainTexture();
        this._initRainSystem();
    }

    _initRainTexture() {
        this._rainTex = new BABYLON.DynamicTexture("rainTex", { width: 4, height: 16 }, this.scene, false);
        const ctx = this._rainTex.getContext();
        ctx.clearRect(0, 0, 4, 16);
        const grad = ctx.createLinearGradient(2, 0, 2, 16);
        grad.addColorStop(0, 'rgba(200, 225, 255, 0)');
        grad.addColorStop(0.2, 'rgba(225, 240, 255, 0.6)');
        grad.addColorStop(1, 'rgba(200, 225, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(1, 0, 2, 16);
        this._rainTex.update();
    }

    _initRainSystem() {
        // Utilisation du GPU pour la performance
        this._rain = new BABYLON.GPUParticleSystem('rain', { capacity: 10000 }, this.scene);
        this._rain.emitter = new BABYLON.Vector3(0, this._rainHeight, 0);

        const box = new BABYLON.BoxParticleEmitter();
        box.minEmitBox = new BABYLON.Vector3(-this._arenaSize/2, 0, -this._arenaSize/2);
        box.maxEmitBox = new BABYLON.Vector3(this._arenaSize/2, 0, this._arenaSize/2);
        this._rain.particleEmitterType = box;

        this._rain.particleTexture = this._rainTex;
        this._rain.emitRate = this._rainDensity;

        // Configuration de la chute (Verticale pure)
        this._rain.minLifeTime = 0.7;
        this._rain.maxLifeTime = 1.0;
        
        // On donne une vitesse initiale vers le bas
        this._rain.direction1 = new BABYLON.Vector3(0, -1, 0);
        this._rain.direction2 = new BABYLON.Vector3(0, -1, 0);
        this._rain.minEmitPower = 20;
        this._rain.maxEmitPower = 25;

        this._rain.minSize  = 0.02;
        this._rain.maxSize  = 0.03;
        this._rain.minScaleY = 6;
        this._rain.maxScaleY = 10;

        this._rain.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        this._rain.start();
    }

    /**
     * À appeler dans le render loop (ex: FightScene.update)
     * Génère des impacts aléatoires au sol pour simuler la pluie
     */
    update() {
        if (!this.wetGroundSystem) return;

        // On crée 2 à 3 impacts aléatoires par frame
        for (let i = 0; i < 2; i++) {
            const randomPos = new BABYLON.Vector3(
                (Math.random() - 0.5) * this._arenaSize,
                0.05, // Juste au dessus du sol
                (Math.random() - 0.5) * this._arenaSize
            );

            // On utilise une petite échelle (0.1 à 0.2) pour les gouttes d'eau
            const scale = 0.1 + Math.random() * 0.1;
            this.wetGroundSystem.addRipple(randomPos, scale);
        }
    }

    dispose() {
        this._rain?.dispose();
        this._rainTex?.dispose();
    }
}
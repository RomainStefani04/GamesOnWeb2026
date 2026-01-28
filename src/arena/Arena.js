import * as BABYLON from '@babylonjs/core';

export class Arena {
    constructor(scene, assetManager, city) {
        this.scene = scene;
        this.assetManager = assetManager;
        this.city = city;
        
        // Configuration des villes
        this.cityConfigs = {
            "Shibuya": {
            },
            "Kyoto": {
            },
            "Tokyo": {
            },
            "Sendai": {
            },
            "Jigoku": {
            }
        };
        
        this.init();
    }
    
    init() {
        const config = this.cityConfigs[this.city];
        
        this.setupLighting(config);
        this.setupSkybox(config);
        this.setupFog(config);
        this.setupGround(config);
        this.setupEnvironment(config);
        this.setupParticles(config);
    }

    setupLighting(config) {
        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;
    }

    // SKYBOX
    setupSkybox(config) {
    }

    // BROUILLARD
    setupFog(config) {
    }

    // SOL
    setupGround(config) {
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 100, height: 100}, this.scene);
    }

    // ENVIRONNEMENT (DÉCORS)
    setupEnvironment(config) {
        switch (config) {
            case "":
                this.createShibuyaEnvironment();
                break;
            case "":
                this.createKyotoEnvironment();
                break;
            case "":
                this.createTokyoEnvironment();
                break;
            case "":
                this.createSendaiEnvironment();
                break;
            case "":
                this.createJigokuEnvironment();
                break;
        }
    }

    // SHIBUYA
    createShibuyaEnvironment() {
    }

    // KYOTO
    createKyotoEnvironment() {
    }

    // TOKYO
    createTokyoEnvironment() {
    }

    // SENDAI
    createSendaiEnvironment() {
    }

    // JIGOKU
    createJigokuEnvironment() {
    }

    // PARTICULES AMBIANTES
    setupParticles(config) {
    }

    dispose() {
        if (this.particleSystem) {
            this.particleSystem.dispose();
        }
    }
}
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
    }


    // SKYBOX
    setupSkybox(config) {
    }


    // BROUILLARD
    setupFog(config) {
    }


    // SOL
    setupGround(config) {
    }

    // ENVIRONNEMENT (DÉCORS)
    setupEnvironment(config) {
        switch (config.ambiance) {
            case "urban_night":
                this.createShibuyaEnvironment();
                break;
            case "temple":
                this.createKyotoEnvironment();
                break;
            case "rooftop":
                this.createTokyoEnvironment();
                break;
            case "forest":
                this.createSendaiEnvironment();
                break;
            case "hell":
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
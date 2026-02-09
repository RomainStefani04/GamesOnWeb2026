import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

export class Arena {
    constructor(scene, assetManager, city) {
        this.scene = scene;
        this.assetManager = assetManager;
        this.city = city;
        
        this.init();
    }
    
    init() {
        this.ground = this.assetManager.cloneGround();
        this.setupLighting();
        this.setupArena();
    }

    setupLighting() {
        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;
    }

    setupArena() {
        let arenaClone = this.assetManager.cloneArena();
        this.arenaMesh = arenaClone.mesh;
        switch (this.city.toLowerCase()) {
            case "shibuya":
                this.setupShibuyaEnvironment();
                break;
            case "kyoto":
                this.setupKyotoEnvironment();
                break;
            case "tokyo":
                this.setupTokyoEnvironment();
                break;
            case "sendai":
                this.setupSendaiEnvironment();
                break;
            case "jigoku":
                this.setupJigokuEnvironment();
                break;
        }
    }

    setupShibuyaEnvironment() {
    }

    // KYOTO
    setupKyotoEnvironment() {
        this.arenaMesh.position = new BABYLON.Vector3(-1, 0, 0);
        this.arenaMesh.scaling = new BABYLON.Vector3(0.21, 0.21, 0.21);
        this.arenaMesh.rotation = new BABYLON.Vector3(0, 0, 0);
        //ciel bleu clair
        this.scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.92, 1);
    }

    // TOKYO
    setupTokyoEnvironment() {
        this.arenaMesh.position = new BABYLON.Vector3(-2.5, 0.03, -0.5);
        //this.arenaMesh.scaling = new BABYLON.Vector3(0.21, 0.21, 0.21);
        this.arenaMesh.rotation = new BABYLON.Vector3(0, 0, 0);
    }

    // SENDAI
    setupSendaiEnvironment() {
    }

    // JIGOKU
    setupJigokuEnvironment() {
    }

    dispose() {
        // Dispose les meshes
        this.ground?.dispose();
        this.arena?.dispose();
    }
}
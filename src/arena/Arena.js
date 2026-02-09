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
        this.createGround();
        this.setupLighting();
        this.setupArena();
    }

    createGround() {
        this.ground = BABYLON.MeshBuilder.CreateGround(
            "ground",
            { width: 20, height: 20 },
            this.scene
        );
        const material = new BABYLON.StandardMaterial("groundMat", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        this.ground.material = material;
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

    setupKyotoEnvironment() {
        this.arenaMesh.position = new BABYLON.Vector3(-1, 0, 0);
        this.arenaMesh.scaling = new BABYLON.Vector3(0.21, 0.21, 0.21);
        this.arenaMesh.rotation = new BABYLON.Vector3(0, 0, 0);
        this.scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.92, 1);
    }

    setupTokyoEnvironment() {
        this.arenaMesh.position = new BABYLON.Vector3(-2.5, 0.03, -0.5);
        this.arenaMesh.rotation = new BABYLON.Vector3(0, 0, 0);
    }

    setupSendaiEnvironment() {
    }

    setupJigokuEnvironment() {
    }

    dispose() {
        this.ground?.dispose();
        this.arenaMesh?.dispose();
    }
}
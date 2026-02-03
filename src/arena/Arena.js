import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

export class Arena {
    constructor(scene, assetManager, city) {
        this.scene = scene;
        this.assetManager = assetManager;
        this.city = city;
        
        //stocker pour pouvoir dispose()
        this.loadedMeshes = [];

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
        this.setupGround(config);
        this.setupParticles(config);
        this.setupEnvironment(this.city);
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
    async setupGround(config) {
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, this.scene);
        this.loadedMeshes.push(ground);
    }

    // ENVIRONNEMENT (DÉCORS)
    setupEnvironment(city) {
        switch (city) {
            case "Shibuya":
                this.createShibuyaEnvironment();
                break;
            case "Kyoto":
                this.createKyotoEnvironment();
                break;
            case "Tokyo":
                this.createTokyoEnvironment();
                break;
            case "Sendai":
                this.createSendaiEnvironment();
                break;
            case "Jigoku":
                this.createJigokuEnvironment();
                break;
        }
    }

    // SHIBUYA
    createShibuyaEnvironment() {
    }

    // KYOTO
    async createKyotoEnvironment() {
        const temple = await BABYLON.ImportMeshAsync("assets/models/Kyoto.glb", this.scene).then((result) => {
            this.mesh = result.meshes[0];
            this.mesh.position = new BABYLON.Vector3(-1, 0, 0);
            this.mesh.scaling = new BABYLON.Vector3(0.21, 0.21, 0.21);
            this.mesh.rotation = new BABYLON.Vector3(0, 0, 0);
            this.loadedMeshes.push(this.mesh);
        });

        //ciel bleu clair
        this.scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.92, 1);
    }

    // TOKYO
    async createTokyoEnvironment() {
        const street = await BABYLON.ImportMeshAsync("assets/models/Tokyo.glb", this.scene).then((result) => {
            this.mesh = result.meshes[0];
            this.mesh.position = new BABYLON.Vector3(-2.5, 0.03, -0.5);
            //this.mesh.scaling = new BABYLON.Vector3(0.21, 0.21, 0.21);
            this.mesh.rotation = new BABYLON.Vector3(0, 0, 0);
            this.loadedMeshes.push(this.mesh);
        }); 
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

        for (const mesh of this.loadedMeshes) {
            if (mesh && !mesh.isDisposed()) {
                mesh.dispose();
            }
        }
        this.loadedMeshes = [];
    }
}
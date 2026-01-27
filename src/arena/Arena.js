import * as BABYLON from '@babylonjs/core';
import { FightCamera } from './FightCamera';

export class Arena {
    constructor(scene, assetManager) {
        this.scene = scene;
        this.assetManager = assetManager;
        this.init();
    }
    
    init() {

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Load character model
        var charac = this.assetManager.loadModel("models/character.glb", (meshes) => {
            let character = meshes[0];
            character.position = new BABYLON.Vector3(0, 0, 0);
            character.scaling = new BABYLON.Vector3(1, 1, 1);
        });

        charac.position.y = 1;


        // Our built-in 'ground' shape.
        var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 100, height: 100}, this.scene);
        
    };
}
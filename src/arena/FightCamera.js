import * as BABYLON from '@babylonjs/core';

export class FightCamera {
    constructor(scene) {
        this.scene = scene;
        this.camera = null;
        this.init();
    }

    init() {
        this.camera = new BABYLON.ArcRotateCamera("camera1", 0, 0, 0, new BABYLON.Vector3(0, 0, 0), this.scene);
        console.log("Positionnement de la caméra de combat: "+this.camera.position);
        var angle = 20;
        this.camera.lowerAlphaLimit = angle
        this.camera.upperAlphaLimit = angle
        this.camera.lowerBetaLimit = angle
        this.camera.upperBetaLimit = angle
        this.camera.panningDistanceLimit = 10
        this.camera.lowerRadiusLimit = angle
        this.camera.upperRadiusLimit = angle
        this.camera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);
    }
}
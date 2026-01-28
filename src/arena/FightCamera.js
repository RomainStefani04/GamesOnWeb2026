import * as BABYLON from '@babylonjs/core';

export class FightCamera {
    constructor(scene) {
        this.scene = scene;
        this.camera = null;
        this.init();
    }

    init() {
        this.camera = new BABYLON.ArcRotateCamera("camera1", 0, 0, 0, new BABYLON.Vector3(0, 1.3, 0), this.scene);

        this.camera.setPosition(new BABYLON.Vector3(4, 1.4, 0));

        this.camera.inputs.clear();
        this.camera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);
    }
}
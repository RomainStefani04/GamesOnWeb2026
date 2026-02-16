import * as BABYLON from '@babylonjs/core';
import { InputManager } from "../core/InputManager";
import { InputMapper } from "../core/InputMapper";
import { Arena } from '../arena/Arena';
import { FightCamera } from '../arena/FightCamera';
import { Player } from '../character/Player';
import { GridMaterial } from '@babylonjs/materials';
import { CombatSystem } from '../combat/CombatSystem';


export class FightScene {
    constructor(engine, assetManager, havokInstance, city) {
        this.engine = engine;
        this.assetManager = assetManager;
        this.havokInstance = havokInstance;
        this.city = city;

        this.deltaTime = 0;
        this.lastTime = performance.now();

        this.player1 = null;
        this.player2 = null;
        this.arena = null;
        this.combatSystem = null;

        this.initScene();
    }

    initScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.inputManager = new InputManager(this.scene);
        this.fightCamera = new FightCamera(this.scene);
        this.havokPlugin = new BABYLON.HavokPlugin(true, this.havokInstance);
        this.scene.enablePhysics(
            new BABYLON.Vector3(0, -9.81, 0),
            this.havokPlugin
        );
    }

    setup() {
        this.initPlayer();
        this.arena = new Arena(this.scene, this.assetManager, this.city);
        this.combatSystem = new CombatSystem(this.player1, this.player2);
        this.ajouterGridPourDev();
    }

    ajouterGridPourDev() {
        // console.log("Pour debug donc a suppr");
        // // const grid = BABYLON.MeshBuilder.CreateGround("debugGrid", { width: 20, height: 20, subdivisions: 20 }, this.scene);
        // // const gridMat = new GridMaterial("gridMat", this.scene);
        // // gridMat.majorUnitFrequency = 5;
        // // gridMat.minorUnitVisibility = 0.3;
        // // gridMat.gridRatio = 1; // 1 unité = 1 case
        // // gridMat.mainColor = new BABYLON.Color3(1, 1, 1);
        // // gridMat.lineColor = new BABYLON.Color3(0.5, 0.5, 1);
        // // gridMat.opacity = 0.8;
        // // grid.material = gridMat;
        // // grid.position.y = 0.01; // légèrement au-dessus du sol pour éviter le z-fighting
        
        // const vGrid = BABYLON.MeshBuilder.CreatePlane("debugGridVertical", { width: 20, height: 10 }, this.scene);
        // const vGridMat = new GridMaterial("vGridMat", this.scene);
        // vGridMat.majorUnitFrequency = 5;
        // vGridMat.minorUnitVisibility = 0.3;
        // vGridMat.gridRatio = 0.1;
        // vGridMat.mainColor = new BABYLON.Color3(1, 1, 1);
        // vGridMat.lineColor = new BABYLON.Color3(0.5, 0.5, 1);
        // vGridMat.opacity = 0.6;
        // vGridMat.backFaceCulling = false;

        // vGrid.material = vGridMat;
        // vGrid.position.x = -0.5;   // légèrement derrière les persos (côté opposé à la caméra)
        // vGrid.position.y = 5;       // centré verticalement
        // vGrid.rotation.y = Math.PI / 2; // tourne le plan pour qu'il soit face à la caméra (plan ZY)
    }

    initPlayer() {
        const clonePlayer1 = this.assetManager.cloneCharacter();
        this.player1 = new Player(
            this.scene,
            "player1",
            new InputMapper(this.inputManager, "player1"),
            clonePlayer1?.mesh,
            clonePlayer1?.animationGroups
        );
        this.player1.setPosition(new BABYLON.Vector3(0, 0, -0.5));
        
        const clonePlayer2 = this.assetManager.cloneCharacter();
        this.player2 = new Player(
            this.scene,
            "player2",
            new InputMapper(this.inputManager, "player2"),
            clonePlayer2?.mesh,
            clonePlayer2?.animationGroups
        );
        this.player2.setPosition(new BABYLON.Vector3(0, 0, 0.5));
    }

    render() {
        this.update();
        this.scene.render();
    }

    update() {
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (this.player1 && this.player2) {
            this.updateFacingDirections();
        }
        this.player1?.update(this.deltaTime);
        this.player2?.update(this.deltaTime);
    }

    updateFacingDirections() {
        const p1z = this.player1.mesh.position.z;
        const p2z = this.player2.mesh.position.z;
        
        this.player1.setFacingDirection(p1z < p2z ? 1 : -1);
        this.player2.setFacingDirection(p2z < p1z ? 1 : -1);
    }

    onDispose() {
        this.player1?.dispose();
        this.player2?.dispose();
        this.fightCamera?.dispose();
        this.scene?.dispose();
    }
}
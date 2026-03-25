import * as BABYLON from '@babylonjs/core';
import { InputManager } from "../core/InputManager";
import { InputMapper } from "../core/InputMapper";
import { Arena } from '../arena/Arena';
import { FightCamera } from '../arena/FightCamera';
import { Player } from '../character/Player';
import { AIPlayer } from '../character/AIPlayer';       // [AI]
import { GridMaterial } from '@babylonjs/materials';
import { MatchManager } from '../combat/MatchManager';


export class FightScene {
    constructor(engine, assetManager, havokInstance, city, characters, gameMode = "pvp") {
        this.engine = engine;
        this.assetManager = assetManager;
        this.havokInstance = havokInstance;
        this.city = city;
        this.characters = characters;
        this.gameMode = gameMode;   // [AI] "pvp" ou "solo"

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
        this.matchManager = new MatchManager(this.player1, this.player2);

        // [AI] Connecter l'IA si mode solo
        if (this.gameMode === "solo" && this.player2 instanceof AIPlayer) {
            this.player2.initAI(this.player1, this.matchManager);
            this.connectAIRewards();
        }

        //this.ajouterDebugGrid();
    }

    ajouterDebugGrid() {
        const vGrid = BABYLON.MeshBuilder.CreatePlane("debugGridVertical", { width: 20, height: 10 }, this.scene);
        const vGridMat = new GridMaterial("vGridMat", this.scene);
        vGridMat.majorUnitFrequency = 5;
        vGridMat.minorUnitVisibility = 0.3;
        vGridMat.gridRatio = 0.1;
        vGridMat.mainColor = new BABYLON.Color3(1, 1, 1);
        vGridMat.lineColor = new BABYLON.Color3(0.5, 0.5, 1);
        vGridMat.opacity = 0.6;
        vGridMat.backFaceCulling = false;

        vGrid.material = vGridMat;
        vGrid.position.x = -0.5;
        vGrid.position.y = 5;
        vGrid.rotation.y = Math.PI / 2;
    }

    initPlayer() {
        // --- Joueur 1 : toujours humain ---
        const clonePlayer1 = this.assetManager.cloneCharacterByKey(this.characters.player1);
        this.player1 = new Player(
            this.scene,
            "player1",
            this.characters.player1,
            new InputMapper(this.inputManager, "player1"),
            clonePlayer1?.mesh,
            clonePlayer1?.animationGroups
        );
        this.player1.setPosition(new BABYLON.Vector3(0, 0, -2));
        
        // --- Joueur 2 : humain (PvP) ou IA (solo) ---
        const clonePlayer2 = this.assetManager.cloneCharacterByKey(this.characters.player2);

        if (this.gameMode === "solo") {
            // [AI] Créer un AIPlayer au lieu d'un Player
            this.player2 = new AIPlayer(
                this.scene,
                "player2",
                this.characters.player2,
                clonePlayer2?.mesh,
                clonePlayer2?.animationGroups,
                {
                    // Config de l'IA (modifiable ici)
                    epsilon: 1.0,
                    decisionInterval: 0.1,
                    rewards: {} // utilise les defaults du RewardCalculator
                }
            );
        } else {
            // PvP : joueur humain classique
            this.player2 = new Player(
                this.scene,
                "player2",
                this.characters.player2,
                new InputMapper(this.inputManager, "player2"),
                clonePlayer2?.mesh,
                clonePlayer2?.animationGroups
            );
        }

        this.player2.setPosition(new BABYLON.Vector3(0, 0, 2));
    }

    /**
     * [AI] Connecte les événements de combat au RewardCalculator de l'IA.
     * Le CombatSystem émet des événements (hit, block, ko),
     * et on les traduit en rewards pour l'IA.
     */
    connectAIRewards() {
        const rewardCalc = this.player2.getRewardCalculator();
        const aiName = this.player2.name;

        this.matchManager.combatSystem.onCombatEvent.add((event) => {
            switch (event.type) {
                case 'hit':
                    if (event.attacker.name === aiName) {
                        // L'IA a touché l'adversaire
                        rewardCalc.onDealDamage(event.damage, event.defender.maxHealth);
                    } else if (event.defender.name === aiName) {
                        // L'IA s'est fait toucher
                        rewardCalc.onTakeDamage(event.damage, this.player2.maxHealth);
                    }
                    break;

                case 'block':
                    if (event.defender.name === aiName) {
                        // L'IA a bloqué un coup
                        rewardCalc.onSuccessfulBlock();
                    }
                    break;

                case 'ko':
                    if (event.attacker.name === aiName) {
                        // L'IA a KO l'adversaire
                        rewardCalc.onKnockoutOpponent();
                    } else if (event.defender.name === aiName) {
                        // L'IA s'est fait KO
                        rewardCalc.onGetKnockedOut();
                    }
                    break;
            }
        });
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

        this.matchManager?.updateMatchTimer(this.deltaTime);
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
import * as BABYLON from '@babylonjs/core';
import { InputManager }      from '../core/InputManager';
import { InputMapper }       from '../core/InputMapper';
import { Arena }             from '../arena/Arena';
import { FightCamera }       from '../arena/FightCamera';
import { Player }            from '../character/Player';
import { GridMaterial }      from '@babylonjs/materials';
import { MatchManager }      from '../combat/MatchManager';
import { WeatherSystem }     from '../weather/WeatherSystem';     // ← nouveau
import { FootstepDetector }  from '../weather/FootstepDetector';  // ← nouveau

/**
 * FightScene — Scène principale de combat.
 *
 * Nouvelles responsabilités (weather system) :
 *   - Instanciation du WeatherSystem (pluie GPU)
 *   - Instanciation de deux FootstepDetectors (un par joueur)
 *   - Connexion des animations de coup de poing → WeatherSystem.triggerPunchShockwave()
 *   - Propagation du deltaTime aux sous-systèmes météo via update()
 *
 * Point d'entrée météo unique : `this._weatherMode`
 * Modifiez-le pour activer/désactiver ('rain' | 'clear').
 */
export class FightScene {
    constructor(engine, assetManager, havokInstance, city, characters) {
        this.engine       = engine;
        this.assetManager = assetManager;
        this.havokInstance = havokInstance;
        this.city         = city;
        this.characters   = characters;

        this.deltaTime = 0;
        this.lastTime  = performance.now();

        this.player1 = null;
        this.player2 = null;
        this.arena   = null;
        this.combatSystem = null;

        // ── Météo ──────────────────────────────────────────────────────────
        // Changez 'rain' en 'clear' pour désactiver le système météo.
        this._weatherMode = 'rain';

        this._weatherSystem   = null;   // WeatherSystem (pluie GPU)
        this._footDetector1   = null;   // FootstepDetector joueur 1
        this._footDetector2   = null;   // FootstepDetector joueur 2

        // Noms des animations de coup de poing dans vos AnimationGroups.
        this._punchAnimNames = ['jab', 'cross'];

        this.initScene();
    }

    initScene() {
        this.scene        = new BABYLON.Scene(this.engine);
        this.inputManager = new InputManager(this.scene);
        this.fightCamera  = new FightCamera(this.scene);
        this.havokPlugin  = new BABYLON.HavokPlugin(true, this.havokInstance);
        this.scene.enablePhysics(
            new BABYLON.Vector3(0, -9.81, 0),
            this.havokPlugin
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SETUP
    // ═══════════════════════════════════════════════════════════════════════

    setup() {
        this.initPlayer();

        // ── Arena ──────────────────────────────────────────────────────────
        // On passe le weatherMode à l'Arena pour activer le WetGroundSystem
        // et ajuster les lumières / ciel automatiquement.
        this.arena = new Arena(
            this.scene,
            this.assetManager,
            this.city,
            this._weatherMode   // transmission du mode météo
        );

        if (this.arena.shadowGenerator) {
            // On ajoute tous les morceaux des joueurs pour qu'ils projettent des ombres
            this.player1.mesh.getChildMeshes().forEach(m => {
                this.arena.shadowGenerator.addShadowCaster(m);
            });
            this.player2.mesh.getChildMeshes().forEach(m => {
                this.arena.shadowGenerator.addShadowCaster(m);
            });
        }

        const wgs = this.arena.wetGroundSystem;
        console.log("FightScene : wetGroundSystem", wgs);
        if (wgs) {
            // Récupère tous les meshes enfants du personnage (corps, vêtements, etc.)
            this.player1.mesh.getChildMeshes().forEach(m => {
                wgs.addMeshToReflections(m);
            });
            this.player2.mesh.getChildMeshes().forEach(m => {
                wgs.addMeshToReflections(m);
            });
        }

        this.matchManager = new MatchManager(this.player1, this.player2);

        // ── Systèmes météo ─────────────────────────────────────────────────
        if (this._weatherMode === 'rain') {
            this._initWeatherSystems();
        }
    }

    /**
     * Initialise le WeatherSystem et les FootstepDetectors.
     * Appelé APRÈS Arena pour garantir que this.arena.ground est disponible.
     */
    _initWeatherSystems() {
        // ── 1. Pluie GPU ───────────────────────────────────────────────────
        this._weatherSystem = new WeatherSystem(this.scene, {
            rainDensity:    3000,
            windForce:      new BABYLON.Vector3(1.2, 0, 0.3),
            arenaHalfWidth: 10,
            rainHeight:     12,
        });

        // ── 2. Détecteurs de pas ───────────────────────────────────────────
        // wetGroundSystem est créé dans Arena.createGround() si mode = 'rain'.
        const wgs = this.arena.wetGroundSystem;

        if (wgs && this.arena.ground) {
            this._footDetector1 = new FootstepDetector(
                this.scene,
                this.player1,
                wgs,
                this.arena.ground,
                {
                    leftFootBone:   'LeftFoot',
                    rightFootBone:  'RightFoot',
                    cooldownMs:     180,
                    rippleScale:    1.0,
                }
            );

            this._footDetector2 = new FootstepDetector(
                this.scene,
                this.player2,
                wgs,
                this.arena.ground,
                {
                    leftFootBone:   'LeftFoot',
                    rightFootBone:  'RightFoot',
                    cooldownMs:     180,
                    rippleScale:    1.0,
                }
            );

            // Callback audio optionnel : branchez ici votre système de son
            // this._footDetector1.onFootstep = (side, pos) => audioManager.playFootstep(side);
        }

    }



    // ═══════════════════════════════════════════════════════════════════════
    //  INITIALISATION DES JOUEURS
    // ═══════════════════════════════════════════════════════════════════════

    initPlayer() {
        const clonePlayer1 = this.assetManager.cloneCharacterByKey(this.characters.player1);
        this.player1 = new Player(
            this.scene,
            'player1',
            this.characters.player1,
            new InputMapper(this.inputManager, 'player1'),
            clonePlayer1?.mesh,
            clonePlayer1?.animationGroups
        );
        this.player1.setPosition(new BABYLON.Vector3(0, 0, -2));

        const clonePlayer2 = this.assetManager.cloneCharacterByKey(this.characters.player2);
        this.player2 = new Player(
            this.scene,
            'player2',
            this.characters.player2,
            new InputMapper(this.inputManager, 'player2'),
            clonePlayer2?.mesh,
            clonePlayer2?.animationGroups
        );
        this.player2.setPosition(new BABYLON.Vector3(0, 0, 2));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  RENDER LOOP
    // ═══════════════════════════════════════════════════════════════════════

    render() {
        this.update();
        this.scene.render();
    }

    update() {
        const currentTime  = performance.now();
        this.deltaTime     = (currentTime - this.lastTime) / 1000;
        this.lastTime      = currentTime;

        if (this.player1 && this.player2) {
            this.updateFacingDirections();
        }

        this.player1?.update(this.deltaTime);
        this.player2?.update(this.deltaTime);

        this.matchManager?.updateMatchTimer(this.deltaTime);

        // ── Mise à jour météo ──────────────────────────────────────────────
        // WeatherSystem et WetGroundSystem s'auto-updatant via leurs propres
        // observables (scene.onBeforeRenderObservable), donc aucun appel
        // supplémentaire n'est nécessaire ici.
        // Cette section est réservée aux logiques météo qui dépendent
        // de l'état du match (ex : intensifier la pluie lors d'un KO).
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  LOGIQUE DE COMBAT — FACING
    // ═══════════════════════════════════════════════════════════════════════

    updateFacingDirections() {
        const p1z = this.player1.mesh.position.z;
        const p2z = this.player2.mesh.position.z;

        this.player1.setFacingDirection(p1z < p2z ?  1 : -1);
        this.player2.setFacingDirection(p2z < p1z ?  1 : -1);
    }


    // ═══════════════════════════════════════════════════════════════════════
    //  NETTOYAGE
    // ═══════════════════════════════════════════════════════════════════════

    onDispose() {
        // Systèmes météo — libère les observables et les GPU buffers
        this._weatherSystem?.dispose();
        this._footDetector1?.dispose();
        this._footDetector2?.dispose();

        // Systèmes de base
        this.player1?.dispose();
        this.player2?.dispose();
        this.fightCamera?.dispose();
        this.arena?.dispose();
        this.scene?.dispose();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  DEBUG GRID
    // ═══════════════════════════════════════════════════════════════════════

    ajouterDebugGrid() {
        const vGrid = BABYLON.MeshBuilder.CreatePlane(
            'debugGridVertical',
            { width: 20, height: 10 },
            this.scene
        );
        const vGridMat = new GridMaterial('vGridMat', this.scene);
        vGridMat.majorUnitFrequency   = 5;
        vGridMat.minorUnitVisibility  = 0.3;
        vGridMat.gridRatio            = 0.1;
        vGridMat.mainColor            = new BABYLON.Color3(1, 1, 1);
        vGridMat.lineColor            = new BABYLON.Color3(0.5, 0.5, 1);
        vGridMat.opacity              = 0.6;
        vGridMat.backFaceCulling      = false;
        vGrid.material                = vGridMat;
        vGrid.position.x              = -0.5;
        vGrid.position.y              = 5;
        vGrid.rotation.y              = Math.PI / 2;
    }
}
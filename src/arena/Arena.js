import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { WetGroundSystem } from '../weather/WetGroundSystem';  // ← nouveau

/**
 * Arena — Scène d'arène de combat avec support météo intégré.
 *
 * Modifications par rapport à la version originale :
 *   - createGround()       → retourne le mesh + expose this.ground (inchangé)
 *   - setupArena()         → instancie WetGroundSystem si weatherMode = 'rain'
 *   - wetGroundSystem      → propriété publique pour accès depuis FightScene
 *   - dispose()            → nettoyage du WetGroundSystem
 *
 * Usage depuis FightScene :
 *   this.arena = new Arena(this.scene, this.assetManager, this.city, 'rain');
 *   const wgs = this.arena.wetGroundSystem;
 */
export class Arena {
    /**
     * @param {BABYLON.Scene}   scene
     * @param {AssetManager}    assetManager
     * @param {string}          city
     * @param {'rain'|'clear'|'snow'} [weatherMode='clear'] - Mode météo actif
     */
    constructor(scene, assetManager, city, weatherMode = 'clear') {
        this.scene       = scene;
        this.assetManager = assetManager;
        this.city        = city;
        this.weatherMode = weatherMode;
        this.shadowGenerator = null; // Référence au générateur d'ombres

        // ── Références publiques ────────────────────────────────────────────
        this.ground          = null;    // BABYLON.Mesh du sol
        this.arenaMesh       = null;    // Mesh de décor chargé
        this.wetGroundSystem = null;    // WetGroundSystem (null si pas de pluie)

        this.init();
    }

    init() {
        this.createGround();
        this.setupLighting();
        this.setupArena();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  SOL
    // ═══════════════════════════════════════════════════════════════════════

    createGround() {
        this.ground = BABYLON.MeshBuilder.CreateGround(
            'ground',
            { width: 20, height: 20 },
            this.scene
        );
        this.ground.receiveShadows = true;

        // ── Physique statique Havok ─────────────────────────────────────────
        // PhysicsMotionType.STATIC : le sol ne bougera jamais.
        // Les personnages ne peuvent pas le traverser.
        const groundBody = new BABYLON.PhysicsBody(
            this.ground,
            BABYLON.PhysicsMotionType.STATIC,
            false,
            this.scene
        );

        const groundShape = new BABYLON.PhysicsShapeBox(
            new BABYLON.Vector3(0, 0, 0),
            BABYLON.Quaternion.Identity(),
            new BABYLON.Vector3(20, 0.1, 20),
            this.scene
        );
        groundShape.material = { friction: 0.8, restitution: 0 };
        groundBody.shape     = groundShape;

        // ── Activation du WetGroundSystem si mode pluie ─────────────────────
        // Fait APRÈS la création du mesh (le PBR remplace le StandardMaterial).
        if (this.weatherMode === 'rain') {
            this.wetGroundSystem = new WetGroundSystem(
                this.scene,
                this.ground,
                {
                    textureSize:    512,
                    maxRipples:     24,
                    groundWidth:    20,
                    rippleDuration: 0.9,
                    rippleMaxRadius: 55,
                }
            );
        } else {
            // ── Matériau par défaut (sec) ───────────────────────────────────────
            const material = new BABYLON.StandardMaterial('groundMat', this.scene);
            material.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
            this.ground.material = material;
        }

    }

    // ═══════════════════════════════════════════════════════════════════════
    //  ÉCLAIRAGE
    // ═══════════════════════════════════════════════════════════════════════

    setupLighting() {
        // 1. Ta lumière directionnelle
        const light = new BABYLON.DirectionalLight(
            "mainLight",
            new BABYLON.Vector3(-1, -1, 0), // Envoie vers le bas et vers le fond (X-)
            this.scene
        );
        
        // Positionnée en haut et un peu derrière (Z négatif)
        light.position = new BABYLON.Vector3(10, 15, 0);
        light.intensity = 2;
        this.mainLight = light;

        // // --- VISUALISATION (DEBUG) ---
        
        // // Affiche une sphère là où se trouve la "source" de la lumière
        // const lightGizmo = new BABYLON.LightGizmo();
        // lightGizmo.light = light;
        // lightGizmo.scaleRatio = 2; // Pour qu'elle soit bien visible

        // // Affiche le "Frustum" (le volume dans lequel les ombres sont calculées)
        // // Cela te montrera une boîte blanche qui part de la lumière vers ta scène
        // const frustumViewer = new BABYLON.DirectionalLightFrustumViewer(light, this.scene);
        
        // // Pour voir le vecteur (la flèche) de direction
        // // On crée un petit mesh qui pointe dans la même direction
        // const arrow = BABYLON.MeshBuilder.CreateBox("lightDirArrow", { size: 3 }, this.scene);
        // arrow.position = light.position.clone();
        // arrow.lookAt(light.position.add(light.direction));
        // const arrowMat = new BABYLON.StandardMaterial("arrowMat", this.scene);
        // arrowMat.emissiveColor = BABYLON.Color3.Yellow();
        // arrow.material = arrowMat;

        // 2. Générateur d'ombres
        this.shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
        this.shadowGenerator.useBlurExponentialShadowMap = true;
        this.shadowGenerator.blurKernel = 32;

        // 3. Lumière ambiante
        const ambient = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(0, 1, 0), this.scene);
        ambient.intensity = 0.3;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  ARÈNE & ENVIRONNEMENTS
    // ═══════════════════════════════════════════════════════════════════════

    setupArena() {
        const arenaClone = this.assetManager.cloneArena();
        this.arenaMesh   = arenaClone.mesh;
        this.arenaMesh.getChildMeshes().forEach(mesh => {
            mesh.receiveShadows = true; // Les ombres des joueurs s'afficheront sur les murs
        });

        if (this.wetGroundSystem) {
            const allMeshes = this.arenaMesh.getChildMeshes();
            this.wetGroundSystem.addMeshToReflections(allMeshes);
        }

        switch (this.city.toLowerCase()) {
            case 'shibuya':
                this.setupShibuyaEnvironment();
                break;
            case 'kyoto':
                this.setupKyotoEnvironment();
                break;
            case 'tokyo':
                this.setupTokyoEnvironment();
                break;
            case 'sendai':
                this.setupSendaiEnvironment();
                break;
            case 'jigoku':
                this.setupJigokuEnvironment();
                break;
        }
    }

    setupShibuyaEnvironment() {}

    setupKyotoEnvironment() {
        this.arenaMesh.position = new BABYLON.Vector3(-1, 0, 0);
        this.arenaMesh.scaling  = new BABYLON.Vector3(0.21, 0.21, 0.21);
        this.arenaMesh.rotation = new BABYLON.Vector3(0, 0, 0);

        // Par temps de pluie → ciel plus sombre (nuageux)
        this.scene.clearColor = this.weatherMode === 'rain'
            ? new BABYLON.Color4(0.25, 0.32, 0.42, 1)  // gris-bleu orageux
            : new BABYLON.Color4(0.53, 0.81, 0.92, 1);  // bleu clair original
    }

    setupTokyoEnvironment() {
        this.arenaMesh.position = new BABYLON.Vector3(-2.5, 0.01, -0.5);
        this.arenaMesh.rotation = new BABYLON.Vector3(0, 0, 0);

        if (this.weatherMode === 'rain') {
            // Tokyo sous la pluie : néons réfléchis sur l'asphalte mouillé
            this.scene.clearColor = new BABYLON.Color4(0.25, 0.32, 0.42, 1);
        }
    }

    setupSendaiEnvironment() {}

    setupJigokuEnvironment() {}

    // ═══════════════════════════════════════════════════════════════════════
    //  NETTOYAGE
    // ═══════════════════════════════════════════════════════════════════════

    dispose() {
        this.wetGroundSystem?.dispose();
        this.ground?.dispose();
        this.arenaMesh?.dispose();
    }
}
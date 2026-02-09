import * as BABYLON from '@babylonjs/core';

export class AssetManager {
    constructor() {
        this.scene = null;

        this.containers = {
            arena: null,
            character: null
        };

        // Chemins des assets
        this.paths = {
            arenas: {
                "tokyo": "assets/models/Tokyo.glb",
                "kyoto": "assets/models/Kyoto.glb",
                "shibuya": "assets/models/Shibuya.glb",
                "sendai": "assets/models/Sendai.glb",
                "jigoku": "assets/models/Jigoku.glb"
            },
            character: "assets/models/character.glb"
        };

        // Tracker les instances pour le dispose
        this.instances = [];
        this.loaded = false;
    }

    init(scene) {
        this.dispose();
        this.loaded = false;
        this.scene = scene;
    }

    async loadFightAssets(arenaName, onProgress = () => {}) {
        const arenaPath = this.paths.arenas[arenaName.toLowerCase()];
        if (!arenaPath) {
            throw new Error(`Arène inconnue: ${arenaName}`);
        }

        // Étape 1 : Charger l'arène
        onProgress(10, "アリーナ読み込み中... | Chargement de l'arène...");
        this.containers.arena = await BABYLON.LoadAssetContainerAsync(
            arenaPath,
            this.scene
        );

        // Étape 2 : Charger le personnage
        onProgress(50, "キャラクター読み込み中... | Chargement du personnage...");
        this.containers.character = await BABYLON.LoadAssetContainerAsync(
            this.paths.character,
            this.scene
        );

        // Chargement terminé
        onProgress(100, "準備完了！ | Prêt !");
        this.loaded = true;
    }

    cloneArena() {
        if (!this.containers.arena) {
            throw new Error("Arena not loaded");
        }

        const instance = this.containers.arena.instantiateModelsToScene(
            (name) => `${name}`
        );

        this.instances.push(instance);

        return {
            mesh: instance.rootNodes[0],
        };
    }

    cloneCharacter() {
        if (!this.containers.character) {
            throw new Error("Character not loaded");
        }

        const instance = this.containers.character.instantiateModelsToScene(
            (name) => `${name}`
        );

        this.instances.push(instance);
        return {
            mesh: instance.rootNodes[0],
            animationGroups: instance.animationGroups
        };
    }

    dispose() {
        // Dispose les instances créées
        this.instances.forEach(instance => {
            instance.rootNodes.forEach(node => node.dispose());
            instance.animationGroups?.forEach(anim => anim.dispose());
        });
        this.instances = [];

        // Dispose les containers
        Object.keys(this.containers).forEach(key => {
            this.containers[key]?.dispose();
            this.containers[key] = null;
        });

        this.loaded = false;
        this.scene = null;
    }
}
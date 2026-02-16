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
            characters: {
                "yuta": {
                    model: "assets/models/characters/yuta.glb",
                    portrait: "assets/images/characters/yuta.png",
                    name: "Yuta Okkotsu"
                },
                "gyutaro": {
                    model: "assets/models/characters/gyutaro.glb",
                    portrait: "assets/images/characters/gyutaro.png",
                    name: "Gyutaro"
                },
                "akaza": {
                    model: "assets/models/characters/akaza.glb",
                    portrait: "assets/images/characters/akaza.png",
                    name: "Akaza"
                },
                "yuji": {
                    model: "assets/models/characters/yuji.glb",
                    portrait: "assets/images/characters/yuji.png",
                    name: "Yuji Itadori"
                },
                "sukuna": {
                    model: "assets/models/characters/sukuna.glb",
                    portrait: "assets/images/characters/sukuna.png",
                    name: "Ryomen Sukuna"
                },
                "toji": {
                    model: "assets/models/characters/toji.glb",
                    portrait: "assets/images/characters/toji.png",
                    name: "Toji Fushiguro"
                }}
        };

        this.characterContainers = {};

        // Tracker les instances pour le dispose
        this.instances = [];
        this.loaded = false;
    }

    init(scene) {
        this.dispose();
        this.loaded = false;
        this.scene = scene;
    }

    async loadCharacterSelectionAssets(onProgress = () => {}) {
        const characterKeys = Object.keys(this.paths.characters);
        const total = characterKeys.length;
        let loaded = 0;

        for (const key of characterKeys) {
            const charData = this.paths.characters[key];
            onProgress(
                Math.round((loaded / total) * 90) + 5,
                `${charData.name} 読み込み中... | Chargement de ${charData.name}...`
            );

            try {
                this.characterContainers[key] = await BABYLON.LoadAssetContainerAsync(
                    charData.model,
                    this.scene
                );
            } catch (e) {
                console.warn(`Impossible de charger le modèle pour ${key}:`, e);
                this.characterContainers[key] = null;
            }

            loaded++;
        }

        onProgress(100, "準備完了！ | Prêt !");
        this.loaded = true;
    }

    cloneCharacterByKey(key) {
        console.log(`Cloner personnage pour ${key}`);
        const container = this.characterContainers[key];
        console.log("Container trouvé:", container);
        if (!container) {
            throw new Error(`Character container not loaded for: ${key}`);
        }

        const instance = container.instantiateModelsToScene(
            (name) => `${name}_${key}_${Date.now()}`
        );

        this.instances.push(instance);
        return {
            mesh: instance.rootNodes[0],
            animationGroups: instance.animationGroups
        };
    }

    getCharacterList() {
        return Object.entries(this.paths.characters).map(([key, data]) => ({
            key,
            name: data.name,
            nameRomaji: data.nameRomaji,
            portrait: data.portrait
        }));
    }

    async loadFightAssets(arenaName, characterKeys, onProgress = () => {}) {
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

        // Étape 2 : Charger les personnages sélectionnés
        let progressStep = 40; // On commence après l'arène
        for (const key of characterKeys) {
            const charData = this.paths.characters[key];
            onProgress(progressStep, `キャラ読み込み中... | Chargement de ${charData.name}...`);
            
            try {
                this.characterContainers[key] = await BABYLON.LoadAssetContainerAsync(
                    charData.model,
                    this.scene
                );
            } catch (e) {
                console.error(`Erreur chargement perso ${key}:`, e);
            }
            progressStep += 25;
        }

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

        Object.keys(this.characterContainers).forEach(key => {
            this.characterContainers[key]?.dispose();
            this.characterContainers[key] = null;
        });
        this.characterContainers = {};

        this.loaded = false;
        this.scene = null;
    }
}
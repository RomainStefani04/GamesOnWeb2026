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
        const container = this.characterContainers[key];
        if (!container) {
            throw new Error(`Character container not loaded for: ${key}`);
        }

        // 1. On crée un identifiant unique pour cette instance spécifique
        const instanceId = Date.now();
        const instance = container.instantiateModelsToScene(
            (name) => `${name}_${key}_${instanceId}`
        );

        let finalAnimationGroups = instance.animationGroups;

        // 2. Si ce n'est pas Akaza, on applique le re-ciblage natif BabylonJS 9
        if (key !== "akaza") {
            const akazaContainer = this.characterContainers["akaza"];
            
            if (akazaContainer && akazaContainer.animationGroups) {
                // On récupère le nœud racine du personnage que l'on vient de cloner (ex: Yuji)
                const targetRootNode = instance.rootNodes[0];

                // On initialise l'AnimatorAvatar sur notre personnage cible
                // Cette classe va scanner le squelette sous le targetRootNode
                const avatar = new BABYLON.AnimatorAvatar(`${key}_avatar_${instanceId}`, targetRootNode);
                
                // Facultatif : Désactive les logs d'avertissements dans la console si tes squelettes matchent à 100%
                avatar.showWarnings = false; 

                // On mappe chaque groupe d'animation d'Akaza vers notre nouvel avatar
                finalAnimationGroups = akazaContainer.animationGroups.map(sourceGroup => {
                    // L'API magique de la V9 : elle crée un nouveau groupe adapté au squelette cible
                    const retargetedGroup = avatar.retargetAnimationGroup(sourceGroup);
                    
                    // On renomme proprement le groupe pour s'y retrouver dans l'Inspector
                    retargetedGroup.name = `${sourceGroup.name}_${key}_${instanceId}`;
                    
                    return retargetedGroup;
                });

                // On écrase les animations de l'instance par les animations re-ciblées.
                // Crucial pour que ton code de 'dispose()' actuel nettoie tout automatiquement !
                instance.animationGroups = finalAnimationGroups;
            } else {
                console.warn(`[AssetManager] Impossible de re-cibler : Le modèle d'Akaza (banque d'animations) n'est pas chargé.`);
            }
        }

        this.instances.push(instance);

        return {
            mesh: instance.rootNodes[0],
            animationGroups: finalAnimationGroups
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

        // Étape 2 : Préparer les personnages à charger
        // Le Set garantit qu'Akaza est inclus, sans doublon si un joueur l'a choisi
        const keysToLoad = Array.from(new Set([...characterKeys, "akaza"]));
        
        // Calcul dynamique de la progression (on a ~70% de la barre à distribuer)
        let progressStep = 20; 
        const stepIncrement = Math.floor(70 / keysToLoad.length);

        for (const key of keysToLoad) {
            const charData = this.paths.characters[key];
            
            // Petite distinction cosmétique dans le loader si Akaza est chargé "en douce"
            const isHiddenBank = !characterKeys.includes(key);
            const loadingMessage = isHiddenBank 
                ? `システム準備中... | Configuration du système d'animations...`
                : `${charData.name} 読み込み中... | Chargement de ${charData.name}...`;

            onProgress(progressStep, loadingMessage);
            
            try {
                this.characterContainers[key] = await BABYLON.LoadAssetContainerAsync(
                    charData.model,
                    this.scene
                );
            } catch (e) {
                console.error(`Erreur chargement perso ${key}:`, e);
                // Si c'est Akaza qui plante, on prévient direct car les anims vont casser
                if (key === "akaza") {
                    console.error("CRITICAL: Le modèle source des animations (Akaza) n'a pas pu être chargé !");
                }
            }
            progressStep += stepIncrement;
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
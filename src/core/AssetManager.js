import * as BABYLON from '@babylonjs/core';

export class AssetManager {
    constructor() {
        this.scene = null;
        
        // Containers (assets en mémoire, pas encore dans la scène)
        this.containers = {
            arena: null,
            character: null,
            ground: null
        };

        // Juste les chemins, pas de config de positionnement
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
        this.loaded = true;
    }

    /**
     * Prépare l'AssetManager pour une nouvelle scène
     */
    init(scene) {
        this.dispose();
        this.loaded = false;
        this.scene = scene;
    }

    async loadFightAssets(arenaName) {
        await this.createGroundContainer();

        const arenaPath = this.paths.arenas[arenaName.toLowerCase()];
        if (!arenaPath) {
            throw new Error(`Arène inconnue: ${arenaName}`);
        }

        // Charger l'arène
        this.containers.arena = await BABYLON.LoadAssetContainerAsync(
            arenaPath,
            this.scene
        );
        // Charger le personnage
        this.containers.character = await BABYLON.LoadAssetContainerAsync(
            this.paths.character,
            this.scene
        );
        this.loaded = true;
    }

    async createGroundContainer() {
        // Créer un container vide
        const container = new BABYLON.AssetContainer(this.scene);
        
        // Créer le ground
        const ground = BABYLON.MeshBuilder.CreateGround(
            "ground_template",
            {
                width: 20,
                height: 20, 
            },
            this.scene
        );

        // Optionnel: ajouter un matériau par défaut
        const material = new BABYLON.StandardMaterial("groundMat_template", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        ground.material = material;

        // Ajouter le mesh et le matériau au container
        container.meshes.push(ground);
        container.materials.push(material);

        // Retirer de la scène (important!)
        ground.setEnabled(false);
        
        this.containers.ground = container;
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
    
    cloneGround() {
        if (!this.containers.ground) {
            throw new Error("Ground not loaded");
        }

        const instance = this.containers.ground.instantiateModelsToScene(
            (name) => `${name}`
        );

        this.instances.push(instance);

        return {
            mesh: instance.rootNodes[0]
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
        this.containers.arena?.dispose();
        this.containers.character?.dispose();
        this.containers.arena = null;
        this.containers.character = null;

        this.scene = null;
    }
}
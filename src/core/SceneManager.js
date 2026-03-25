import { MenuScene } from "../scenes/MenuScene";
import { FightScene } from "../scenes/FightScene";
import { LoadingScene } from "../scenes/LoadingScene";
import { CharactersSelectionScene } from "../scenes/CharactersSelectionScene";
import { TrainingScene } from "../scenes/TrainingScene";       // [AI Phase 2]

export class SceneManager {
    constructor(engine, assetManager, havokInstance) {
        this.engine = engine;
        this.assetManager = assetManager;
        this.havokInstance = havokInstance;
        this.currentScene = null;
    }

    async switchTo(name, options = {}) {
        this.currentScene?.onDispose();
        this.currentScene = null;

        switch (name) {
            case 'MenuScene':
                this.currentScene = new MenuScene(this.engine, this);
                break;

            case 'CharactersSelectionScene':
                await this.loadCharactersSelection(options.city, options.gameMode);
                break;

            case 'FightScene':
                await this.loadFightScene(options.city, options.characters, options.gameMode || "pvp");
                break;

            // [AI Phase 2] Scène d'entraînement
            case 'TrainingScene':
                await this.loadTrainingScene(options.city || "Tokyo", options.character || "akaza");
                break;
        }
    }

    async loadCharactersSelection(city, gameMode) {
        const loadingScene = new LoadingScene(this.engine);
        this.currentScene = loadingScene;

        const charSelection = new CharactersSelectionScene(
            this.engine, this, this.assetManager, city, gameMode
        );

        this.assetManager.init(charSelection.scene);
        await this.assetManager.loadCharacterSelectionAssets((progress, message) => {
            loadingScene.updateProgress(progress, message);
        });

        charSelection.setup();

        await new Promise(resolve => setTimeout(resolve, 400));
        loadingScene.onDispose();
        this.currentScene = charSelection;
    }
    
    async loadFightScene(city, characters, gameMode = "pvp") {
        const loadingScene = new LoadingScene(this.engine);
        this.currentScene = loadingScene;

        const fightScene = new FightScene(
            this.engine, this.assetManager, this.havokInstance, city, characters, gameMode
        );

        this.assetManager.init(fightScene.scene);

        const characterKeys = [characters.player1, characters.player2];
        
        await this.assetManager.loadFightAssets(city, characterKeys, (progress, message) => {
            loadingScene.updateProgress(progress, message);
        });

        fightScene.setup();

        await new Promise(resolve => setTimeout(resolve, 400));
        loadingScene.onDispose();
        this.currentScene = fightScene;
    }

    // [AI Phase 2] Chargement de la scène d'entraînement
    async loadTrainingScene(city, characterKey) {
        const loadingScene = new LoadingScene(this.engine);
        this.currentScene = loadingScene;

        const trainingScene = new TrainingScene(
            this.engine, this, this.assetManager, this.havokInstance, city, characterKey
        );

        this.assetManager.init(trainingScene.scene);

        // Charger l'arène + le personnage (x2 pour self-play)
        await this.assetManager.loadFightAssets(city, [characterKey], (progress, message) => {
            loadingScene.updateProgress(progress, message);
        });

        trainingScene.setup();

        await new Promise(resolve => setTimeout(resolve, 400));
        loadingScene.onDispose();
        this.currentScene = trainingScene;
    }

    render() {
        this.currentScene?.render();
    }
}
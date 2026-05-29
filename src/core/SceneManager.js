import { MenuScene } from "../scenes/MenuScene";
import { FightScene } from "../scenes/FightScene";
import { LoadingScene } from "../scenes/LoadingScene";
import { CharactersSelectionScene } from "../scenes/CharactersSelectionScene";
import { eventBus } from "./EventBus";

export class SceneManager {
    constructor(engine, assetManager, havokInstance, soundSystem) {
        this.engine = engine;
        this.assetManager = assetManager;
        this.havokInstance = havokInstance;
        this.soundSystem = soundSystem;
        this.currentScene = null;
    }

    async switchTo(name, options = {}) {
        this.soundSystem.preloadForScene(name); // Précharge les sons de la scène cible
        this.currentScene?.onDispose();
        this.currentScene = null;

        switch (name) {
            case 'MenuScene':
                this.currentScene = new MenuScene(this.engine, this);
                eventBus.emit('scene:menu:enter');
                break;

            case 'CharactersSelectionScene':
                await this.loadCharactersSelection(options.city, options.gameMode);
                eventBus.emit('scene:characters:selection');
                break;

            case 'FightScene':
                await this.loadFightScene(options.city, options.characters, options.gameMode);
                break;
        }
    }

    async loadCharactersSelection(city, gameMode) {
        const loadingScene = new LoadingScene(this.engine);
        eventBus.emit('scene:loading');
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
    
    async loadFightScene(city, characters, gameMode) {
        const loadingScene = new LoadingScene(this.engine);
        eventBus.emit('scene:loading');
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
        eventBus.emit('scene:fight:enter', city);
    }

    render() {
        this.currentScene?.render();    
    }
}
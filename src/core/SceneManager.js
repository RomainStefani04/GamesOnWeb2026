import { MenuScene } from "../scenes/MenuScene";
import { FightScene } from "../scenes/FightScene";
import { LoadingScene } from "../scenes/LoadingScene";

export class SceneManager {
    constructor(engine, assetManager, havokInstance) {
        this.engine = engine;
        this.assetManager = assetManager;
        this.havokInstance = havokInstance;
        this.currentScene = null;
    }

    async switchTo(name, city) {
        this.currentScene?.onDispose();
        this.currentScene = null;

        switch (name) {
            case 'MenuScene':
                this.currentScene = new MenuScene(this.engine, this);
                break;

            case 'FightScene':
                await this.loadFightScene(city);
                break;
        }
    }
    
    async loadFightScene(city) {
        const loadingScene = new LoadingScene(this.engine);
        this.currentScene = loadingScene;

        const fightScene = new FightScene(
            this.engine, this.assetManager, this.havokInstance, city
        );

        this.assetManager.init(fightScene.scene);
        await this.assetManager.loadFightAssets(city, (progress, message) => {
            loadingScene.updateProgress(progress, message);
        });

        fightScene.setup();

        await new Promise(resolve => setTimeout(resolve, 400));
        loadingScene.onDispose();
        this.currentScene = fightScene;
    }

    render() {
        this.currentScene?.render();
    }
}
import { FightScene } from "../scenes/FightScene";
import { LoadingScene } from "../scenes/LoadingScene";
import { MenuScene } from "../scenes/MenuScene";

export class SceneManager {
    constructor(engine, assetManager, havokInstance) {
        this.engine = engine;
        this.assetManager = assetManager;
        this.havokInstance = havokInstance;
        this.currentScene = null;
    }

    switchTo(name, city) {
        this.currentScene?.onDispose();

        switch (name) {
            case 'MenuScene':
                this.currentScene = new MenuScene(this.engine, this);
                break;
            case 'FightScene':
                this.currentScene = new FightScene(this.engine, this.assetManager, this.havokInstance, city);
                break;
        }
    }
    
    render() {
        if (this.currentScene) {
            this.currentScene.render();
        }
    }
}
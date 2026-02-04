import { FightScene } from "../scenes/FightScene";
import { LoadingScene } from "../scenes/LoadingScene";
import { MenuScene } from "../scenes/MenuScene";

export class SceneManager {
    constructor(engine) {
        this.engine = engine;
        this.currentScene = null;
        this.sceneParams = {};
    }

    switchTo(name, params = {}) {
        this.sceneParams = params;
        this.currentScene?.onDispose();

        switch (name) {
            case 'MenuScene':
                this.currentScene = new MenuScene(this.engine, this);
                break;
            case 'FightScene':
                this.currentScene = new LoadingScene(this.engine, this, {
                    targetScene: 'FightScene',
                    targetParams: params
                });
                break;
        }
    }

    switchToPreloaded(sceneInstance) {
        this.currentScene?.onDispose();
        this.currentScene = sceneInstance;
    }

    getParams() {
        return this.sceneParams;
    }
    
    render() {
        if (this.currentScene) {
            this.currentScene.render();
        }
    }
}
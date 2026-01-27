import { FightScene } from "../scenes/FightScene";
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
                this.currentScene = new FightScene(this.engine, this, params);
                break;
        }
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
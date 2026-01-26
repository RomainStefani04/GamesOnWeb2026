import { FightScene } from "../scenes/FightScene";
import { MenuScene } from "../scenes/MenuScene";

export class SceneManager {
    constructor(engine) {
        this.engine = engine;
        this.currentScene = null;
    }

    switchTo(name) {
        this.currentScene?.onDispose();

        switch (name) {
            case 'MenuScene':
                this.currentScene = new MenuScene(this.engine);
                break;
            case 'FightScene':
                this.currentScene = new FightScene(this.engine);
                break;
        }
    }
    
    render() {
        if (this.currentScene) {
            this.currentScene.render();
        }
    }
}
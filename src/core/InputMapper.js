export class InputMapper {
    constructor(inputManager, sceneName) {
        this.inputManager = inputManager;
        this.mapKeys = {};
        this.init(sceneName);
    }

    init(sceneName) {
        switch (sceneName) {
            case "MenuScene":
                this.setupMenuSceneMappings();
                break;
            case "FightScene":
                this.setupFightSceneMappings();
                break;
        }
    }

    setupMenuSceneMappings() {
        this.mapKeys["select"] = 'Enter';
        this.mapKeys["back"] = 'Escape';
        this.mapKeys["up"] = 'ArrowUp';
        this.mapKeys["down"] = 'ArrowDown';
    }


    setupFightSceneMappings() {
        // Mouvements
        this.mapKeys["moveRight"] = 'KeyD';
        this.mapKeys["moveLeft"] = 'KeyQ';

        // Actions
        this.mapKeys["jab"] = 'KeyA';
        this.mapKeys["cross"] = 'KeyE';
    }

    isKeyPressed(action) {
        const key = this.mapKeys[action];
        return key ? this.inputManager.isKeyPressed(key) : false;
    }

    isKeyReleased(action) {
        const key = this.mapKeys[action];
        return key ? this.inputManager.isKeyReleased(key) : false;
    }

    isMouseButtonPressed(action) {
        const button = this.mapKeys[action];
        return button !== undefined ? this.inputManager.isMouseButtonPressed(button) : false;
    }

    isMouseButtonReleased(action) {
        const button = this.mapKeys[action];
        return button !== undefined ? this.inputManager.isMouseButtonReleased(button) : false;
    }

}
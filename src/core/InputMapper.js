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
        // Example: Map 'Enter' key to 'Select' action in MenuScene
        this.selectActionKey = 'Enter';
    }

    setupFightSceneMappings() {
        this.mapKeys["moveRight"] = 'KeyD';
    }

    isKeyPressed(key) {
        return this.inputManager.isKeyPressed(this.mapKeys[key]);
    }

    isKeyReleased(key) {
        return this.inputManager.isKeyReleased(this.mapKeys[key]);
    }

    isMouseButtonPressed(key) {
        return this.inputManager.isMouseButtonPressed(this.mapKeys[key]);
    }

    isMouseButtonReleased(key) {
        return this.inputManager.isMouseButtonReleased(this.mapKeys[key]);
    }

}
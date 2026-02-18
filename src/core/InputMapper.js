export class InputMapper {
    constructor(inputManager, profile) {
        this.inputManager = inputManager;
        this.mapKeys = {};
        this.init(profile);
    }

    init(profile) {
        switch (profile) {
            case "menu":
                this.mapKeys = {
                    "select" : 'Enter',
                    "back" : 'Escape',
                    "up" : 'ArrowUp',
                    "down" : 'ArrowDown'
                };
                break;
            case "player1":
                this.mapKeys = {
                    "moveRight" : 'KeyD',
                    "moveLeft" : 'KeyA',
                    "block" : 'KeyS',
                    "jab" : 'KeyQ',
                    "cross" : 'KeyE'
                };
                break;
            case "player2":
                this.mapKeys = {
                    "moveRight" : 'ArrowRight',
                    "moveLeft" : 'ArrowLeft',
                    "block" : 'ArrowDown',
                    "jab" : 'Numpad1',
                    "cross" : 'Numpad2'
                };
                break;
        }
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
// classe abstraite pour etats des persos
export class CharacterState {
    constructor(stateMachine) {
        this.stateMachine = stateMachine;
        this.character = stateMachine.character;
        this.name = "BaseState";
        this.isBlocking = false;
    }

    enter(params = {}) {}
    exit() {}
    update(deltaTime) {}
}
// classe abstraite pour etats des persos
export class CharacterState {
    constructor(stateMachine) {
        this.stateMachine = stateMachine;
        this.character = stateMachine.character;
        this.name = "BaseState";
    }


    enter() {}
    exit() {}
    update(deltaTime) {}
    handleInput(inputMapper) {}
}
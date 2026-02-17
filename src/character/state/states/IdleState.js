import { CharacterState } from './CharacterState';

export class IdleState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Idle";
        this.animationSpeed = 1.2;
        this.blendingSpeed = 0.1;
    }

    enter(params = {}) {
        this.character.stop();
        this.character.playAnimation('idle', true, this.animationSpeed, this.blendingSpeed);
    }

    exit() {}

    update(deltaTime) {}
}
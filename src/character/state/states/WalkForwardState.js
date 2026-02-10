import { CharacterState } from './CharacterState';

export class WalkForwardState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "WalkForward";
        this.animationSpeed = 4;
        this.blendingSpeed = 0.1;
    }

    enter() {
        this.character.playAnimation('walk_forward', true, this.animationSpeed, this.blendingSpeed);
    }

    exit() {
        this.character.stop();
    }

    update(deltaTime) {
        // Velocity directe, Havok gère le deltaTime
        const speed = this.character.facingDirection * this.character.speed;
        this.character.move(speed);
    }
}
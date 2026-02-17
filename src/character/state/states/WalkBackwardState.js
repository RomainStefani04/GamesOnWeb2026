import { CharacterState } from './CharacterState';

export class WalkBackwardState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "WalkBackward";
        this.backwardSpeedMultiplier = 0.8;
        this.animationSpeed = 2.6;
        this.blendingSpeed = 0.1;
    }

    enter(params = {}) {
        this.character.playAnimation('walk_backward', true, this.animationSpeed, this.blendingSpeed);
    }

    exit() {
        this.character.stop();
    }

    update(deltaTime) {
        // Reculer = direction opposée, plus lent
        const speed = -this.character.facingDirection * this.character.speed * this.backwardSpeedMultiplier;
        this.character.move(speed);
    }
}
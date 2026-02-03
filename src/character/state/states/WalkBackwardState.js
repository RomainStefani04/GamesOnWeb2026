import { CharacterState } from './CharacterState';


export class WalkBackwardState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "WalkBackward";
        this.backwardSpeedMultiplier = 0.8; //plus lent en reculant
        this.animationSpeed = 1.5;
        this.blendingSpeed = 0.1;
    }

    enter() {
        this.character.playAnimation('walk_backward', true, this.animationSpeed, this.blendingSpeed);
    }

    exit() {}

    update(deltaTime) {
        // Reculer (direction opposée à facingDirection)
        const velocity = -this.character.facingDirection * this.character.speed * this.backwardSpeedMultiplier * deltaTime;
        this.character.move({ x: 0, y: 0, z: velocity });
    }
}
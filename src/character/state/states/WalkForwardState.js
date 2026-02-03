import { CharacterState } from './CharacterState';


export class WalkForwardState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "WalkForward";
        this.animationSpeed = 2.4;
        this.blendingSpeed = 0.1;
    }

    enter() {
        this.character.playAnimation('walk_forward', true, this.animationSpeed, this.blendingSpeed);
    }

    exit() {}

    update(deltaTime) {
        // Avancer dans la direction où le personnage fait face
        const velocity = this.character.facingDirection * this.character.speed * deltaTime;
        this.character.move({ x: 0, y: 0, z: velocity });
    }
}
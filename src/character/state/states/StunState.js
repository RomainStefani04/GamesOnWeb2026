import { CharacterState } from './CharacterState';

export class StunState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Stun";
        this.isBlocking = false;
        this.duration = 0;
        this.elapsed = 0;
        this.animationSpeed = 1.2;
        this.blendingSpeed = 1;
    }

    enter(params = {}) {
        this.isBlocking = true;
        this.duration = params.duration || 0.3;
        this.elapsed = 0;
        this.character.stop();
        this.character.playAnimation('stun', false, this.animationSpeed, this.blendingSpeed);
    }

    exit() {
        this.isBlocking = false;
    }

    update(deltaTime) {
        this.elapsed += deltaTime;
        if (this.elapsed >= this.duration) {
            this.isBlocking = false;
        }
    }
}
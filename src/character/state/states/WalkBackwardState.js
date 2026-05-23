import { CharacterState } from './CharacterState';

export class WalkBackwardState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "WalkBackward";
        this.backwardSpeedMultiplier = 0.8;
        this.animation = {
            name: 'walk_backward',
            loop: true,
            speed: 2.6,
            blending: 0.1,
            from: null,
            to: null
        };
    }

    enter(params = {}) {
        this.playStateAnimation();
    }

    exit() {
        this.character.stop();
    }

    update(deltaTime) {
        const speed = -this.character.facingDirection * this.character.speed * this.backwardSpeedMultiplier;
        this.character.move(speed);
    }
}
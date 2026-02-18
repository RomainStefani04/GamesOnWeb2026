import { CharacterState } from './CharacterState';

export class WalkForwardState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "WalkForward";
        this.animation = {
            name: 'walk_forward',
            loop: true,
            speed: 4,
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
        const speed = this.character.facingDirection * this.character.speed;
        this.character.move(speed);
    }
}
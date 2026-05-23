import { CharacterState } from './CharacterState';

export class SweepFallState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Sweep Fall";
        this.animation = {
            name: 'sweep_fall',
            loop: true,
            speed: 1,
            blending: 0.1,
            from: 0,
            to: 80
        };
    }

    enter(params = {}) {
        this.isBlocking = true;
        this.duration = params.duration || 1;
        this.elapsed = 0;
        this.character.stop();
        this.playStateAnimation();
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
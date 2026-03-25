import { CharacterState } from './CharacterState';

export class BlockState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Block";
        this.animation = {
            name: 'block',
            loop: false,
            speed: 1,
            blending: 0.1,
            from: 0,
            to: 12
        };
        this.active = false;
        this.frameToActivate = 10;
    }

    enter(params = {}) {
        this.character.stop();
        this.elapsedTime = 0;
        this.playStateAnimation();
        this.active = false;
    }

    exit() {
        this.active = false;
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;
        const currentFrame = this.elapsedTime * this.animation.speed * 60;
        if (currentFrame >= this.frameToActivate) {
            this.active = true;
        }
    }
}
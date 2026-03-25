import { CharacterState } from './CharacterState';

export class StunState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Stun";
        this.duration = 0;
        this.elapsedTime = 0;
        this.animation = {
            name: 'stun',
            loop: false,
            speed: 1.2,
            blending: 1,
            from: 20,       // skip le début de l'animation
            to: null
        };
    }

    enter(params = {}) {
        this.isBlocking = true;
        this.duration = params.duration || 0.3;
        this.elapsedTime = 0;
        this.character.stop();
        this.playStateAnimation();
    }

    exit() {
        this.isBlocking = false;
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;
        if (this.elapsedTime >= this.duration) {
            this.isBlocking = false;
        }
    }
}
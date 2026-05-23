import { CharacterState } from './CharacterState';

export class IdleState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Idle";
        this.animation = {
            name: 'idle',
            loop: true,
            speed: 1.2,
            blending: 0.1,
            from: null,
            to: null
        };
    }

    enter(params = {}) {
        this.character.stop();
        this.playStateAnimation();
    }
}
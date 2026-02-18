import { CharacterState } from './CharacterState';

export class VictoryState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Victory";
        this.animation = {
            name: 'victory',
            loop: false,
            speed: 1,
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
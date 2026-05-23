import { CharacterState } from './CharacterState';

export class VictoryState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Victory";
        this.animation = {
            name: 'victory',
            loop: true,
            speed: 1,
            blending: 0.1,
            from: 40,
            to: null
        };
    }

    enter(params = {}) {
        this.character.stop();
        this.playStateAnimation();
    }
}
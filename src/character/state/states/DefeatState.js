import { CharacterState } from './CharacterState';

export class DefeatState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Defeat";
        this.animation = {
            name: 'defeat',
            loop: false,
            speed: 1,
            blending: 0.8,
            from: null,
            to: null
        };
    }

    enter(params = {}) {
        this.character.stop();
        this.playStateAnimation();
    }
}
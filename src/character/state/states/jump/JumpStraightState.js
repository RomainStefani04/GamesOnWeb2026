import { JumpState } from './JumpState';

export class JumpStraightState extends JumpState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "JumpStraight";
        this.horizontalImpulse = 0;
        this.animation = {
            ...this.animation,
            name: 'jump',
            from: 40,
            to: 63
        };
    }
}
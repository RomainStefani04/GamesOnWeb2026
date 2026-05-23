import { JumpState } from './JumpState';

export class JumpBackwardState extends JumpState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "JumpBackward";
        this.horizontalImpulse = -100;      // Négatif = arrière, ratio plus faible que forward
        this.animation = {
            ...this.animation,
            name: 'backflip',
            from: 30,
            to:110
        };
    }
}
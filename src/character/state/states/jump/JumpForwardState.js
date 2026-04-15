import { JumpState } from './JumpState';

export class JumpForwardState extends JumpState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "JumpForward";
        this.horizontalImpulse = 100;       // Ajuste selon ton gameplay
        this.animation = {
            ...this.animation,
            name: 'frontflip',
            from: 20,
            to: 70
        };
    }

}
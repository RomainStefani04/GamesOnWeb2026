import { AttackState } from './AttackState';

/**
 * Cross - Coup de poing puissant
 */
export class CrossState extends AttackState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Cross";
        this.animationName = 'cross';
        this.animationSpeed = 2.0;
    }

    enter() {
        super.enter();
    }

    update(deltaTime) {
        super.update(deltaTime);
    }
}
import { AttackState } from './AttackState';

/**
 * Cross - Coup de poing puissant
 */
export class CrossState extends AttackState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Cross";
        this.animationName = 'cross';
        this.attackDuration = 1.5;
    }

    enter(params = {}) {
        super.enter(params);
    }

    update(deltaTime) {
        super.update(deltaTime);
    }
}
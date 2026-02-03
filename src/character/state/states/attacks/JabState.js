import { AttackState } from './AttackState';

/**
 * Jab - Coup de poing rapide
 */
export class JabState extends AttackState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Jab";
        this.animationName = 'jab';
        this.attackDuration = 0.60;
    }

    enter(params = {}) {
        super.enter(params);
    }

    update(deltaTime) {
        super.update(deltaTime);
    }
}
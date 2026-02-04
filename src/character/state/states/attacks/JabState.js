import { AttackState } from './AttackState';

/**
 * Jab - Coup de poing rapide
 */
export class JabState extends AttackState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Jab";
        this.animationName = 'jab';
        this.animationSpeed = 1.8;
    }

    enter() {
        super.enter();
    }

    update(deltaTime) {
        super.update(deltaTime);
    }
}
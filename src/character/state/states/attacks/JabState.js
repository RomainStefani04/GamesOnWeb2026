import { AttackState } from './AttackState';
import { MoveRegistry } from '../../../../combat/MoveRegistry';

/**
 * Jab — Coup de poing rapide
 */
export class JabState extends AttackState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Jab";
        this.moveData = MoveRegistry.jab;
        this.animation = {
            name: 'jab',
            loop: false,
            speed: 1.8,
            blending: 0.1,
            from: 0,
            to: 60
        };
    }
}
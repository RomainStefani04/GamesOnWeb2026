import { AttackState } from './AttackState';
import { MoveRegistry } from '../../../../combat/MoveRegistry';

/**
 * Jab — Coup de poing rapide
 * Données du coup chargées depuis MoveRegistry
 */
export class JabState extends AttackState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Jab";
        this.animationName = 'jab';
        this.animationSpeed = 1.8;
        this.moveData = MoveRegistry.jab;
    }
}
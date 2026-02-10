import { AttackState } from './AttackState';
import { MoveRegistry } from '../../../../combat/MoveRegistry';

/**
 * Cross — Coup de poing puissant
 * Données du coup chargées depuis MoveRegistry
 */
export class CrossState extends AttackState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Cross";
        this.animationName = 'cross';
        this.animationSpeed = 2.0;
        this.moveData = MoveRegistry.cross;
    }
}
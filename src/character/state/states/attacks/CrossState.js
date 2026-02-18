import { AttackState } from './AttackState';
import { MoveRegistry } from '../../../../combat/MoveRegistry';

/**
 * Cross — Coup de poing puissant
 */
export class CrossState extends AttackState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Cross";
        this.moveData = MoveRegistry.cross;
        this.animation = {
            name: 'cross',
            loop: false,
            speed: 2.0,
            blending: 0.1,
            from: null,
            to: null
        };
    }
}
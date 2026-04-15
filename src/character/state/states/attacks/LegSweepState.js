import { AttackState } from './AttackState';
import { MoveRegistry } from '../../../../combat/MoveRegistry';

/**
 * Leg Sweep — Coup de pied bas
 */
export class LegSweepState extends AttackState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Leg Sweep";
        this.moveData = MoveRegistry.leg_sweep;
        this.animation = {
            name: 'leg_sweep',
            loop: false,
            speed: 1.6,
            blending: 0.1,
            from: 0,
            to: 120
        };
    }
}
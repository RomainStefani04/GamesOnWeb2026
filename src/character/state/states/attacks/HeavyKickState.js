import { AttackState } from './AttackState';
import { MoveRegistry } from '../../../../combat/MoveRegistry';

/**
 * Heavy Kick — Coup de poing rapide
 */
export class HeavyKickState extends AttackState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Heavy Kick";
        this.moveData = MoveRegistry.heavy_kick;
        this.animation = {
            name: 'heavy_kick',
            loop: false,
            speed: 1.6,
            blending: 0.1,
            from: 0,
            to: 60
        };
    }
}
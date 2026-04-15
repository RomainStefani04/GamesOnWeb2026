import { AttackState } from './AttackState';
import { MoveRegistry } from '../../../../combat/MoveRegistry';

/**
 * Light Kick — Coup de poing rapide
 */
export class LightKickState extends AttackState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Light Kick";
        this.moveData = MoveRegistry.light_kick;
        this.animation = {
            name: 'light_kick',
            loop: false,
            speed: 1.6,
            blending: 0.1,
            from: 0,
            to: 110
        };
    }
}
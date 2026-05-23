import { IdleState } from './states/IdleState';
import { WalkForwardState } from './states/WalkForwardState';
import { WalkBackwardState } from './states/WalkBackwardState';
import { JabState } from './states/attacks/JabState';
import { CrossState } from './states/attacks/CrossState';
import { StunState } from './states/StunState';
import { BlockState } from './states/BlockState';
import { VictoryState } from './states/VictoryState';
import { DefeatState } from './states/DefeatState';
import { LightKickState } from './states/attacks/LightKickState';
import { HeavyKickState } from './states/attacks/HeavyKickState';
import { LegSweepState } from './states/attacks/LegSweepState';
import { SweepFallState } from './states/SweepFallState';
import { FireballState } from './states/attacks/FireballState';
import { JumpStraightState } from './states/jump/JumpStraightState';
import { JumpForwardState } from './states/jump/JumpForwardState';
import { JumpBackwardState } from './states/jump/JumpBackwardState';

// en gros sert à gérer les changements d'états du perso
export class CharacterStateMachine {
    constructor(character, inputMapper) {
        this.character = character;
        this.inputMapper = inputMapper;
        this.states = {};
        this.currentState = null;

        this.initStates();
    }

    initStates() {
        this.states = {
            idle: new IdleState(this),
            walkforward: new WalkForwardState(this),
            walkbackward: new WalkBackwardState(this),
            jab: new JabState(this),
            cross: new CrossState(this),
            light_kick: new LightKickState(this),
            heavy_kick: new HeavyKickState(this),
            leg_sweep: new LegSweepState(this),
            fireball: new FireballState(this),
            stun: new StunState(this),
            block: new BlockState(this),
            sweep_fall: new SweepFallState(this),
            victory: new VictoryState(this),
            defeat: new DefeatState(this),
            jump_straight: new JumpStraightState(this),
            jump_forward: new JumpForwardState(this),
            jump_backward: new JumpBackwardState(this),
        };

        this.mapStateMove = new Map();
        this.mapStateMove.set('moveRight', this.states.walkforward);
        this.mapStateMove.set('moveLeft', this.states.walkbackward);
        this.mapStateMove.set('block', this.states.block);
        this.mapStateAttack = new Map();
        this.mapStateAttack.set('jump', this.states.jump_straight);
        this.mapStateAttack.set('jab', this.states.jab);
        this.mapStateAttack.set('cross', this.states.cross);
        this.mapStateAttack.set('light_kick', this.states.light_kick);
        this.mapStateAttack.set('heavy_kick', this.states.heavy_kick);
        this.mapStateAttack.set('leg_sweep', this.states.leg_sweep);
        this.mapStateAttack.set('fireball', this.states.fireball);
        // État initial
        this.changeState(this.states.idle);
    }

    changeState(newState, params = {}) {
        this.currentState?.exit();
        this.currentState = newState;
        this.currentState.enter(params);
    }

    //update de l état courant
    update(deltaTime) {
        this.updateFacingInput();
        if (!this.character.isReadOnly && !this.currentState.isBlocking) {
            this.handleInput();
        }
        this.currentState.update(deltaTime);
    }

    updateFacingInput() {
        // Swap les input avancer reculer selon le facing du personnage
        this.mapStateMove.set('moveRight', this.character.facingDirection === 1 ? this.states.walkforward : this.states.walkbackward);
        this.mapStateMove.set('moveLeft', this.character.facingDirection === 1 ? this.states.walkbackward : this.states.walkforward);
    }

    handleInput() {
        if (this.inputMapper.isKeyPressed('jump')) {
            const isMovingForward = this.currentState === this.states.walkforward;
            const isMovingBackward = this.currentState === this.states.walkbackward;

            if (isMovingForward) {
                this.changeState(this.states.jump_forward);
            } else if (isMovingBackward) {
                this.changeState(this.states.jump_backward);
            } else {
                this.changeState(this.states.jump_straight);
            }
            return;
        }
        for (const [input, state] of this.mapStateAttack.entries()) {
            if (this.inputMapper.isKeyPressed(input)) {
                this.changeState(state);
                return;
            }
        }
        // Recuperer la cle de la valeur actuelle dans la map
        const inputCurrentState = [...this.mapStateMove.entries()].find(([key, value]) => value === this.currentState)?.[0];
        if (inputCurrentState && this.inputMapper.isKeyPressed(inputCurrentState)) {
            return;
        }
        for (const [input, state] of this.mapStateMove.entries()) {
            if (this.inputMapper.isKeyPressed(input)) {
                this.changeState(state);
                return;
            }
        }
        this.changeState(this.states.idle);
    }

}
import { IdleState } from './states/IdleState';
import { WalkForwardState } from './states/WalkForwardState';
import { WalkBackwardState } from './states/WalkBackwardState';
import { JabState } from './states/attacks/JabState';
import { CrossState } from './states/attacks/CrossState';
import { StunState } from './states/StunState';

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
            stun: new StunState(this),
        };

        this.mapStateMove = new Map();
        this.mapStateMove.set('moveRight', this.states.walkforward);
        this.mapStateMove.set('moveLeft', this.states.walkbackward);
        
        this.mapStateAttack = new Map();
        this.mapStateAttack.set('jab', this.states.jab);
        this.mapStateAttack.set('cross', this.states.cross);

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
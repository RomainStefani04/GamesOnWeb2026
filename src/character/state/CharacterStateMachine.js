import { IdleState } from './states/IdleState';
import { WalkForwardState } from './states/WalkForwardState';
import { WalkBackwardState } from './states/WalkBackwardState';
import { JabState } from './states/attacks/JabState';
import { CrossState } from './states/attacks/CrossState';

// en gros sert à gérer les changements d'états du perso
export class CharacterStateMachine {
    constructor(character) {
        this.character = character;
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
        };

        this.mapStateMove = new Map();
        this.mapStateMove.set('moveRight', this.states.walkforward);
        this.mapStateMove.set('moveLeft', this.states.walkbackward);
        
        this.mapStateAttack = new Map();
        this.mapStateAttack.set('jab', this.states.jab);
        this.mapStateAttack.set('cross', this.states.cross);

        console.log("States initialized:", Object.keys(this.states));

        // État initial
        this.changeState(this.states.idle);
    }

    changeState(newState) {
        this.currentState?.exit();
        this.currentState = newState;
        this.currentState.enter();
    }

    //update de l état courant
    update(deltaTime, inputMapper) {
        this.updateFacingInput();
        if (!this.currentState.isBlocking) {
            this.handleInput(inputMapper);
        }
        this.currentState.update(deltaTime);
    }

    updateFacingInput() {
        // Swap les input avancer reculer selon le facing du personnage
        this.mapStateMove.set('moveRight', this.character.facingDirection === 1 ? this.states.walkforward : this.states.walkbackward);
        this.mapStateMove.set('moveLeft', this.character.facingDirection === 1 ? this.states.walkbackward : this.states.walkforward);
    }

    handleInput(inputMapper) {
        let stateChanged = false;
        this.mapStateAttack.keys().forEach(input => {
            if (inputMapper.isKeyPressed(input) && !stateChanged) {
                this.changeState(this.mapStateAttack.get(input));
                stateChanged = true;
                return;
            }
        });
        if (stateChanged) {return;}
        // Recuperer la cle de la valeur actuelle dans la map
        const inputCurrentState = [...this.mapStateMove.entries()].find(([key, value]) => value === this.currentState)?.[0];
        if (inputCurrentState && inputMapper.isKeyPressed(inputCurrentState) && !stateChanged) {
            return;
        }
        this.mapStateMove.keys().forEach(input => {
            if (inputMapper.isKeyPressed(input) && !stateChanged) {
                this.changeState(this.mapStateMove.get(input));
                stateChanged = true;
                return;
            }
        });
        if (!stateChanged) {
            this.changeState(this.states.idle);
        }
    }

}
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
        this.previousState = null;

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

        console.log("States initialized:", Object.keys(this.states));

        // État initial
        this.changeState('idle');
    }


    // change d'état
    changeState(stateName) {
        const newState = this.states[stateName];

        if (!newState) {
            console.log(`État "${stateName}" non trouvé`);
            return;
        }

        // Sortie de l'état précédent
        if (this.currentState) {
            this.currentState.exit();
            this.previousState = this.currentState;
        }

        // Entrée dans le nouvel état
        this.currentState = newState;
        this.currentState.enter();

        console.log(`State: ${this.previousState?.name || 'none'} → ${this.currentState.name}`);
    }


    // Retourne à l'état précédent
    returnToPreviousState() {
        if (this.previousState) {
            this.changeState(this.previousState.name.toLowerCase());
        }
    }

    //update de l état courant
    update(deltaTime, inputMapper) {
        if (this.currentState) {
            this.currentState.handleInput(inputMapper);
            this.currentState.update(deltaTime);
        }
    }

    // savoir si on est dans un état précis
    isInState(stateName) {
        return this.currentState?.name.toLowerCase() === stateName.toLowerCase();
    }


    // règles de transition entre états
    canTransitionTo(stateName) {

        //exemple : pas d'attaque en sautant
        if (stateName === 'attack' && this.isInState('jump')) {
            return false;
        }
        return true;
    }
}
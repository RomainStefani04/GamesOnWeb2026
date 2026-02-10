import { Character } from '../character/Character';
import { CharacterStateMachine } from '../character/state/CharacterStateMachine';


export class Player extends Character {
    constructor(scene, name, inputMapper, mesh, animationGroups) {
        super(scene, name, mesh, animationGroups);
        // La state machine sera initialisée après le chargement du mesh (c'est claude qui le dit)
        this.stateMachine = null;
        this.stateMachine = new CharacterStateMachine(this, inputMapper);
    }

    // Regarder pourquoi on a 2 init et super()
    initMesh(mesh, animationGroups) {
        super.initMesh(mesh, animationGroups);
    }

    update(deltaTime) {
        this.stateMachine.update(deltaTime);
    }

    getCurrentState() {
        return this.stateMachine?.currentState?.name;
    }
}
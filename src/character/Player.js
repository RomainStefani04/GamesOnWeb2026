import { Character } from '../character/Character';
import { CharacterStateMachine } from '../character/state/CharacterStateMachine';


export class Player extends Character {
    constructor(scene, config = {}) {
        super(scene, {
            name: config.name,
            speed: config.speed
        });

        // La state machine sera initialisée après le chargement du mesh (c'est claude qui le dit)
        this.stateMachine = null;
        this.isReady = false;
    }


    initMesh(mesh, skeleton = null, animationGroups = []) {
        super.initMesh(mesh, skeleton, animationGroups);
        
        // Initialiser la state machine maintenant que le mesh est prêt (c'est claude qui le dit)
        this.stateMachine = new CharacterStateMachine(this);
        this.isReady = true;
        
        console.log(`Player "${this.name}" initialisé avec ${Object.keys(this.animationGroups).length} animations`);
    }


    update(deltaTime, inputMapper) {
        if (!this.isReady) return;
        
        this.stateMachine.update(deltaTime, inputMapper);
    }

    getCurrentState() {
        return this.stateMachine?.currentState?.name || "Unknown";
    }
}
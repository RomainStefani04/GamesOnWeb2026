import { CharacterState } from './CharacterState';

export class IdleState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Idle";
        this.animationSpeed = 1.2;
        this.blendingSpeed = 0.1;
    }

    enter() {
        this.character.playAnimation('idle', true, this.animationSpeed, this.blendingSpeed);
    }

    exit() {
        // peut être des trucs à faire en sortant de l'état
    }

    update(deltaTime) {
        // Logique spécifique à l'état idle (aucune idées de ce que ça peut être)
    }
}
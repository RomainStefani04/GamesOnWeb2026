import { CharacterState } from '../CharacterState';


export class AttackState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Attack";
        this.animationName = 'attack';
        this.attackDuration = 0.4;
        this.animationSpeed = 1.0;
        this.elapsedTime = 0;
        this.blendingSpeed = 0.1;
    }

    enter() {
        this.character.playAnimation(this.animationName, false, this.animationSpeed, this.blendingSpeed);
        this.elapsedTime = 0;
    }

    exit() {
        // désactiver la hitbox (quand se sera mis en place)
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;

        // Fin de l'attaque
        if (this.elapsedTime >= this.attackDuration) {
            this.onAttackEnd();
        }
    }

    onAttackEnd() {
    }
}
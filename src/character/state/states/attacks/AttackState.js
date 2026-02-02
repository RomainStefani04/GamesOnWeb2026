import { CharacterState } from '../CharacterState';


export class AttackState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Attack";
        this.animationName = 'attack';
        this.attackDuration = 0.4;
        this.elapsedTime = 0;
    }

    enter() {
        this.character.playAnimation(this.animationName, false);

    }

    exit() {
        // désactiver la hitbox (quand se sera mis en place)
    }

    handleInput(inputMapper) {
    }

    update(deltaTime) {
        this.elapsedTime += deltaTime;

        // Fin de l'attaque
        if (this.elapsedTime >= this.attackDuration) {
            this.onAttackEnd();
        }
    }

    onAttackEnd() {
        this.stateMachine.changeState('idle');
    }
}
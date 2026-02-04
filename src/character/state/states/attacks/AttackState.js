import { CharacterState } from '../CharacterState';


export class AttackState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Attack";
        this.animationName = 'attack';
        this.animationSpeed = 1.0;
        this.elapsedTime = 0;
        this.blendingSpeed = 0.1;
    }

    enter() {
        this.isBlocking = true;
        let anim = this.character.playAnimation(this.animationName, false, this.animationSpeed, this.blendingSpeed);
        anim.onAnimationGroupEndObservable.addOnce(() => this.onAttackEnd());
    }

    exit() {
        // désactiver la hitbox (quand se sera mis en place)
    }

    update(deltaTime) {
    }

    onAttackEnd() {
        this.isBlocking = false;
    }
}
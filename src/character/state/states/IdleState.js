import { CharacterState } from './CharacterState';

export class IdleState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Idle";
    }

    enter() {
        this.character.playAnimation('idle', true);
    }

    exit() {
        // peut être des trucs à faire en sortant de l'état
    }

    handleInput(inputMapper) {
        const isRight = inputMapper.isKeyPressed('moveRight');
        const isLeft = inputMapper.isKeyPressed('moveLeft');

        //forward ou backward selon facingDirection
        if (isRight || isLeft) {
            const isMovingForward = 
                (this.character.facingDirection === 1 && isRight) ||
                (this.character.facingDirection === -1 && isLeft);

            if (isMovingForward) {
                this.stateMachine.changeState('walkforward');
            } else {
                this.stateMachine.changeState('walkbackward');
            }
            return;
        }


        // Attaques
        if (inputMapper.isKeyPressed('jab')) {
            this.stateMachine.changeState('jab');
            return;
        }

        if (inputMapper.isKeyPressed('cross')) {
            this.stateMachine.changeState('cross');
            return;
        }
    }

    update(deltaTime) {
        // Logique spécifique à l'état idle (aucune idées de ce que ça peut être)
    }
}
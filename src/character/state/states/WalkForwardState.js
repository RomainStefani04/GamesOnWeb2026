import { CharacterState } from './CharacterState';


export class WalkForwardState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "WalkForward";
        this.animationSpeed = 2.4;
    }

    enter() {
        this.character.playAnimation('walk_forward', true, this.animationSpeed);
    }

    exit() {}

    handleInput(inputMapper) {
        const isRight = inputMapper.isKeyPressed('moveRight');
        const isLeft = inputMapper.isKeyPressed('moveLeft');

        // Si on appuie dans la direction opposée, changer vers WalkBackward
        if (this.character.facingDirection === 1 && isLeft && !isRight) {
            this.stateMachine.changeState('walk_backward');
            return;
        }
        if (this.character.facingDirection === -1 && isRight && !isLeft) {
            this.stateMachine.changeState('walk_backward');
            return;
        }

        // Si plus de mouvement, retour à idle
        if (!isRight && !isLeft) {
            this.stateMachine.changeState('idle');
            return;
        }

        // Transitions vers d'autres états
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
        // Avancer dans la direction où le personnage fait face
        const velocity = this.character.facingDirection * this.character.speed * deltaTime;
        this.character.move({ x: 0, y: 0, z: velocity });
    }
}
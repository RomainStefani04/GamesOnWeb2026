import { CharacterState } from './CharacterState';


export class WalkBackwardState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "WalkBackward";
        this.backwardSpeedMultiplier = 0.8; //plus lent en reculant
        this.animationSpeed = 2.6;
        this.blendingSpeed = 0.1;
    }

    enter() {
        this.character.playAnimation('walk_backward', true, this.animationSpeed, this.blendingSpeed);
    }

    exit() {}

    handleInput(inputMapper) {
        const isRight = inputMapper.isKeyPressed('moveRight');
        const isLeft = inputMapper.isKeyPressed('moveLeft');

        // Si on appuie dans la direction du personnage, changer vers WalkForward
        if (this.character.facingDirection === 1 && isRight && !isLeft) {
            this.stateMachine.changeState('walk_forward');
            return;
        }
        if (this.character.facingDirection === -1 && isLeft && !isRight) {
            this.stateMachine.changeState('walk_forward');
            return;
        }

        // Si plus de mouvement, retour à idle
        if (!isRight && !isLeft) {
            this.stateMachine.changeState('idle');
            return;
        }

        // Transitions
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
        // Reculer (direction opposée à facingDirection)
        const velocity = -this.character.facingDirection * this.character.speed * this.backwardSpeedMultiplier * deltaTime;
        this.character.move({ x: 0, y: 0, z: velocity });
    }
}
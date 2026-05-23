import { CharacterState } from '../CharacterState';
import * as BABYLON from '@babylonjs/core';

export class JumpState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Jump";

        this.jumpImpulseVertical = 350;     // Intensité impulsion verticale
        this.horizontalImpulse = 0;        // Surchargé par les enfants
        this.maxAirTime = 1.2;             // Sécurité anti-boucle infinie (secondes)
        this._airTime = 0;

        this.animation = {
            name: 'jump',         // Surchargé par les enfants
            loop: false,
            speed: 1,
            blending: 0.08,
            from: null,
            to: null
        };
    }

    enter(params = {}) {
        this.isBlocking = true; // Empêche d'autres actions pendant le saut
        this._airTime = 0;
        this._applyJumpImpulse();
        this.playStateAnimation();
    }

    exit() {
        this.isBlocking = false; // Autorise à nouveau les autres actions
        // Stopper tout mouvement horizontal résiduel si besoin
    }

    update(deltaTime) {
        this._airTime += deltaTime;

        if (this._hasLanded()) {
            this._onLand();
            return;
        }
    }

    // --- Méthodes internes ---

    _applyJumpImpulse() {
        const body = this.character.physicsBody; 
        if (!body) return;

        const impulse = new BABYLON.Vector3(
            0,
            this.jumpImpulseVertical,
            this.horizontalImpulse * this.character.facingDirection
        );

        this.character.hurtbox.scaling.y = 0.5;


        body.applyImpulse(
            impulse,
            this.character.mesh.getAbsolutePosition() 
        );
    }

    _hasLanded() {
        // Double condition : temps minimum écoulé + personnage au sol
        const minAirTime = 0.15; // évite détection immédiate au départ du saut
        if (this._airTime < minAirTime) return false;

        // Fallback : vitesse verticale quasi nulle = retombée
        const velocity = this.character.physicsBody.getLinearVelocity();
        // console.log("Vitesse actuelle :", velocity.y );
        if (velocity && Math.abs(velocity.y) < 0.001 && this._airTime > minAirTime){
            this.character.hurtbox.scaling.y = 1;
            return true;
        }
            
        // Sécurité : durée max dépassée
        if (this._airTime >= this.maxAirTime) return true;

        return false;
    }

    _onLand() {
        // console.log("Personnage a atterri après", this._airTime.toFixed(2), "secondes de saut.");
        this.stateMachine.changeState(this.stateMachine.states.idle);
    }
}
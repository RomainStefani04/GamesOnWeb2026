import * as BABYLON from '@babylonjs/core';
import { CharacterState } from '../CharacterState';

export class AttackState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Attack";
        this.animationName = 'attack';
        this.animationSpeed = 1.0;
        this.blendingSpeed = 0.1;

        this.elapsedTime = 0;
        this.hitboxActive = false;
        this.hitboxMesh = null;
        this.hitboxBody = null;
        this.hasHit = false;

        this.moveData = null;
    }

    enter() {
        this.isBlocking = true;
        this.elapsedTime = 0;
        this.hitboxActive = false;
        this.hasHit = false;

        this.character.stop();

        let anim = this.character.playAnimation(this.animationName, false, this.animationSpeed, this.blendingSpeed);
        anim.onAnimationGroupEndObservable.addOnce(() => this.onAttackEnd());
    }

    exit() {
        this.deactivateHitbox();
    }

    update(deltaTime) {
        if (!this.moveData?.hitbox) return;

        this.elapsedTime += deltaTime;
        // Convertir le temps écoulé en frame (base 60fps * vitesse d'anim)
        const currentFrame = this.elapsedTime * this.animationSpeed * 60;
        const hitbox = this.moveData.hitbox;
        const shouldBeActive = currentFrame >= hitbox.activeFrame && currentFrame <= hitbox.endFrame;

        if (shouldBeActive && !this.hitboxActive) {
            this.activateHitbox();
        } else if (!shouldBeActive && this.hitboxActive) {
            this.deactivateHitbox();
        }
    }

    activateHitbox() {
        const hitbox = this.moveData.hitbox;
        const scene = this.character.scene;

        // Mesh box — identique à avant
        this.hitboxMesh = BABYLON.MeshBuilder.CreateBox(
            `hitbox_${this.character.name}_${this.name}`,
            {
                width: hitbox.size.x,
                height: hitbox.size.y,
                depth: hitbox.size.z
            },
            scene
        );

        const debugMat = new BABYLON.StandardMaterial(`hitboxMat_${this.name}`, scene);
        debugMat.diffuseColor = new BABYLON.Color3(1, 0, 0);
        debugMat.alpha = 0.4;
        this.hitboxMesh.material = debugMat;
        this.hitboxMesh.isVisible = false; // Debug Pour afficher/cacher la hitbox

        this.hitboxMesh.metadata = {
            type: 'hitbox',
            attacker: this.character,
            moveData: this.moveData
        };

        this.updateHitboxPosition();

        // À la place du PhysicsBody trigger : check intersectsMesh chaque frame
        this.collisionObserver = scene.onBeforeRenderObservable.add(() => {
            if (this.hasHit) return;

            for (const mesh of scene.meshes) {
                if (!mesh.metadata || mesh.metadata.type !== 'hurtbox') continue;
                if (mesh.metadata.character === this.character) continue;
                // Force la mise a jour de la position pour bien verifier
                this.hitboxMesh.computeWorldMatrix(true);
                mesh.computeWorldMatrix(true);
                if (this.hitboxMesh.intersectsMesh(mesh, false)) {
                    this.onHitboxCollision(mesh.metadata.character);
                    return;
                }
            }
        });

        this.hitboxActive = true;
    }

    deactivateHitbox() {
        if (this.collisionObserver) {
            this.character.scene.onBeforeRenderObservable.remove(this.collisionObserver);
            this.collisionObserver = null;
        }
        if (this.hitboxMesh) {
            this.hitboxMesh.dispose();
            this.hitboxMesh = null;
        }
        this.hitboxActive = false;
    }
    
    updateHitboxPosition() {
        if (!this.hitboxMesh) return;

        const charPos = this.character.mesh.position;
        const hitbox = this.moveData.hitbox;
        const facing = this.character.facingDirection;

        this.hitboxMesh.position.set(
            charPos.x + (hitbox.offset.x || 0),
            charPos.y + hitbox.offset.y,
            charPos.z + hitbox.offset.z * facing
        );
    }

    onHitboxCollision(defenderCharacter) {
        if (this.hasHit) return;

        this.hasHit = true;
        this.character.onHit.notifyObservers({
            attacker: this.character,
            defender: defenderCharacter,
            damage: this.moveData.damage,
            moveName: this.name
        });
    }

    onAttackEnd() {
        this.isBlocking = false;
    }
}
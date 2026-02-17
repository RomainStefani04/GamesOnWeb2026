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
        this.hitboxMesh = null;
        this.boneNode = null;
        this.hasHit = false;
        this.syncObserver = null;
        this.damageObserver = null;

        this.moveData = null;
    }

    enter() {
        this.isBlocking = true;
        this.elapsedTime = 0;
        this.hasHit = false;

        this.character.stop();
        this.createHitbox();

        let anim = this.character.playAnimation(
            this.animationName, false, this.animationSpeed, this.blendingSpeed
        );
        anim.onAnimationGroupEndObservable.addOnce(() => this.onAttackEnd());
    }

    exit() {
        this.destroyHitbox();
    }

    update(deltaTime) {
        if (!this.moveData?.hitbox) return;
        this.elapsedTime += deltaTime;
    }

    createHitbox() {
        const scene = this.character.scene;
        const hitbox = this.moveData.hitbox;

        this.boneNode = this.character.getBoneNode(this.moveData.boneName);
        if (!this.boneNode) {
            console.warn(`Bone "${this.moveData.boneName}" non trouvé`);
            return;
        }

        // Simple mesh sphère, pas de physics body
        this.hitboxMesh = BABYLON.MeshBuilder.CreateSphere(
            `hitbox_${this.character.name}_${this.name}`,
            { diameter: hitbox.radius * 2 },
            scene
        );

        const debugMat = new BABYLON.StandardMaterial(`hitboxMat_${this.name}`, scene);
        debugMat.diffuseColor = new BABYLON.Color3(1, 0, 0);
        debugMat.alpha = 0.4;
        this.hitboxMesh.material = debugMat;
        this.hitboxMesh.isVisible = false; // false une fois calé

        this.hitboxMesh.isPickable = false;
        this.hitboxMesh.parent = this.boneNode;
        const boneScale = this.boneNode.getWorldMatrix().getRow(0).length();
        if (boneScale > 0) {
            const compensate = 1 / boneScale;
            this.hitboxMesh.scaling.setAll(compensate);
        }
        
        // Check dégâts uniquement pendant les frames actives
        this.damageObserver = scene.onBeforeRenderObservable.add(() => {
            if (this.hasHit || !this.moveData?.hitbox) return;

            const currentFrame = this.elapsedTime * this.animationSpeed * 60;
            const isInActiveFrames = currentFrame >= this.moveData.hitbox.activeFrame
                                  && currentFrame <= this.moveData.hitbox.endFrame;
            if (!isInActiveFrames) return;

            for (const mesh of scene.meshes) {
                if (!mesh.metadata || mesh.metadata.type !== 'hurtbox') continue;
                if (mesh.metadata.character === this.character) continue;
                this.hitboxMesh.computeWorldMatrix(true);
                mesh.computeWorldMatrix(true);
                if (this.hitboxMesh.intersectsMesh(mesh, false)) {
                    this.onHitboxCollision(mesh.metadata.character);
                    return;
                }
            }
        });
    }

    destroyHitbox() {
        if (this.syncObserver) {
            this.character.scene.onBeforeRenderObservable.remove(this.syncObserver);
            this.syncObserver = null;
        }
        if (this.damageObserver) {
            this.character.scene.onBeforeRenderObservable.remove(this.damageObserver);
            this.damageObserver = null;
        }
        if (this.hitboxMesh) {
            this.hitboxMesh.dispose();
            this.hitboxMesh = null;
        }
        this.boneNode = null;
    }

    onHitboxCollision(defenderCharacter) {
        if (this.hasHit) return;
        this.hasHit = true;

        const knockback = this.moveData.knockback || 150;
        const direction = this.character.facingDirection;

        const sm = defenderCharacter.stateMachine;
        sm.changeState(sm.states.stun, { duration: this.moveData.stunDuration });
        
        if (defenderCharacter.physicsBody) {
            defenderCharacter.physicsBody.applyImpulse(
                new BABYLON.Vector3(0, 0, direction * knockback),
                defenderCharacter.mesh.position
            );
        }

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
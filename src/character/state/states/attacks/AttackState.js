import * as BABYLON from '@babylonjs/core';
import { CharacterState } from '../CharacterState';

export class AttackState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Attack";

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

        const anim = this.playStateAnimation();
        if (anim) {
            anim.onAnimationGroupEndObservable.addOnce(() => this.onAttackEnd());
        }
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

        this.hitboxMesh = BABYLON.MeshBuilder.CreateSphere(
            `hitbox_${this.character.name}_${this.name}`,
            { diameter: hitbox.radius * 2 },
            scene
        );

        const debugMat = new BABYLON.StandardMaterial(`hitboxMat_${this.name}`, scene);
        debugMat.diffuseColor = new BABYLON.Color3(1, 0, 0);
        debugMat.alpha = 0.4;
        this.hitboxMesh.material = debugMat;
        this.hitboxMesh.isVisible = true;

        this.hitboxMesh.isPickable = false;
        this.hitboxMesh.parent = this.boneNode;
        const boneScale = this.boneNode.getWorldMatrix().getRow(0).length();
        if (boneScale > 0) {
            const compensate = 1 / boneScale;
            this.hitboxMesh.scaling.setAll(compensate);
        }
        
        this.damageObserver = scene.onBeforeRenderObservable.add(() => {
            if (this.hasHit || !this.moveData?.hitbox) return;

            const currentFrame = this.elapsedTime * this.animation.speed * 60;
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

        this.character.onHit.notifyObservers({
            attacker: this.character,
            defender: defenderCharacter,
            moveData: this.moveData,
        });
    }

    onAttackEnd() {
        this.isBlocking = false;
    }
}
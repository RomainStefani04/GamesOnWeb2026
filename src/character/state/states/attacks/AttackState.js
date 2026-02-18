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
        if (this.hasHit) return;

        const currentFrame = this.elapsedTime * this.animation.speed * 60;
        const isInActiveFrames = currentFrame >= this.moveData.hitbox.activeFrame
                            && currentFrame <= this.moveData.hitbox.endFrame;
        if (!isInActiveFrames) return;

        for (const mesh of this.character.scene.meshes) {
            if (!mesh.metadata || mesh.metadata.type !== 'hurtbox') continue;
            if (mesh.metadata.character === this.character) continue;
            this.hitboxMesh.computeWorldMatrix(true);
            mesh.computeWorldMatrix(true);
            if (this.hitboxMesh.intersectsMesh(mesh, false)) {
                this.onHitboxCollision(mesh.metadata.character);
                return;
            }
        }
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
        this.hitboxMesh.isVisible = false;

        this.hitboxMesh.isPickable = false;
        this.hitboxMesh.parent = this.boneNode;
        const boneScale = this.boneNode.getWorldMatrix().getRow(0).length();
        if (boneScale > 0) {
            const compensate = 1 / boneScale;
            this.hitboxMesh.scaling.setAll(compensate);
        }
    }

    destroyHitbox() {
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
import * as BABYLON from '@babylonjs/core';

export class FootstepDetector {
    constructor(scene, player, wetGroundSystem, groundMesh, options = {}) {
        this.scene = scene;
        this.player = player; // Instance de la classe Player
        this.wetGround = wetGroundSystem;
        this.groundMesh = groundMesh;

        this._leftBoneName = options.leftFootBone ?? 'LeftFoot';
        this._rightBoneName = options.rightFootBone ?? 'RightFoot';
        
        // État interne comme dans AttackState
        this._feet = {
            left: { mesh: null, bone: null, wasGrounded: false, lastImpact: 0 , prevPosition: null,},
            right: { mesh: null, bone: null, wasGrounded: false, lastImpact: 0 , prevPosition: null,}
        };

        this._cooldownMs = 150;
        this._rippleScale = options.rippleScale ?? 1.0;

        this._init();
    }

    _init() {
        // 1. Créer les sondes pour chaque pied
        this._createProbe('left', this._leftBoneName);
        this._createProbe('right', this._rightBoneName);

        // 2. Observer de rendu (comme ton damageObserver)
        this._observer = this.scene.onBeforeRenderObservable.add(() => {
            this._updateFoot('left');
            this._updateFoot('right');
        });
    }

    _createProbe(side, boneName) {
        const boneNode = this.player.getBoneNode(boneName);
        if (!boneNode) return;

        // Création du mesh (comme ta hitbox)
        const mesh = BABYLON.MeshBuilder.CreateSphere(
            `footProbe_${side}_${this.player.name}`,
            { diameter: 0.19 },
            this.scene
        );

        // Debug visuel (Rouge/Bleu)
        const mat = new BABYLON.StandardMaterial(`footMat_${side}`, this.scene);
        mat.diffuseColor = (side === 'left') ? new BABYLON.Color3(0, 0, 1) : new BABYLON.Color3(1, 0, 0);
        mat.alpha = 0.4;
        mesh.material = mat;
        mesh.isVisible = true;
        mesh.isPickable = false;

        // Configuration du parentage et compensation de scale (Ton code AttackState)
        mesh.parent = boneNode;
        const boneScale = boneNode.getWorldMatrix().getRow(0).length();
        if (boneScale > 0) {
            const compensate = 1 / boneScale;
            mesh.scaling.setAll(compensate);
        }

        this._feet[side].mesh = mesh;
        this._feet[side].bone = boneNode;
    }

    _updateFoot(side) {
        const foot = this._feet[side];
        if (!foot.mesh || !this.groundMesh) return;

        foot.mesh.computeWorldMatrix(true);
        this.groundMesh.computeWorldMatrix(true);

        const isGrounded = foot.mesh.intersectsMesh(this.groundMesh, false);
        const now = performance.now();

        // Calcul de la vitesse à partir du déplacement entre frames
        const currentPos = foot.mesh.getAbsolutePosition();
        let speed = 0;

        if (foot.prevPosition) {
        const dt = (now - foot._lastUpdateTime) / 1000;
        if (dt > 0) {
            const deltaY = Math.abs(currentPos.y - foot.prevPosition.y); // ← uniquement Y
            speed = deltaY / dt;
        }
    }

        // Sauvegarde pour la prochaine frame
        foot.prevPosition = currentPos.clone();
        foot._lastUpdateTime = now;

        // Front montant Air → Sol
        if (isGrounded && !foot.wasGrounded) {
            if (now - foot.lastImpact > this._cooldownMs) {

                const impactPoint = foot.mesh.getAbsolutePosition();

                if (this.wetGround) {
                    this.wetGround.addRipple(impactPoint, this._rippleScale, speed);
                }

                foot.lastImpact = now;
            }
        }

        foot.wasGrounded = isGrounded;
    }
    dispose() {
        if (this._observer) {
            this.scene.onBeforeRenderObservable.remove(this._observer);
        }
        this._feet.left.mesh?.dispose();
        this._feet.right.mesh?.dispose();
    }
}
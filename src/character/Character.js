import * as BABYLON from '@babylonjs/core';

export class Character {
    constructor(scene, name, mesh, animationGroups) {
        this.scene = scene;
        this.name = name;
        this.speed = 2.5;

        // État
        this.facingDirection = 1;
        this.isGrounded = true;

        // Physics
        this.physicsBody = null;
        this.hurtbox = null;

        // Animations
        this.currentAnimation = null;
        this.mapAnimations = {};

        // Observable pour notifier les hits (remonte vers CombatSystem)
        this.onHit = new BABYLON.Observable();

        this.maxHealth = 100;
        this.currentHealth = this.maxHealth;

        this.isReadOnly = false; // Permet de bloquer les inputs

        this.initMesh(mesh, animationGroups);
        this.initPhysics();
    }

    /**
     * Mappe les AnimationGroups par mot-clé.
     * Aucune config de frames ici — c'est la responsabilité des States.
     */
    initMesh(mesh, animationGroups) {
        this.mesh = mesh;
        this.animationGroups = animationGroups || [];

        // Mapping mot-clé → AnimationGroup
        const ANIMATION_KEYS = [
            'idle', 'walk_forward', 'walk_backward',
            'jab', 'cross', 'light_kick', 'heavy_kick', 'leg_sweep', 'fireball', 'stun',
            'jump', 'block', 'victory', 'defeat' , 'sweep_fall', 'frontflip', 'backflip'
        ];
        
        this.animationGroups.forEach(group => {
            const fullName = group.name.toLowerCase();
            const matchedKey = ANIMATION_KEYS.find(key => fullName.includes(key));
            if (matchedKey) {
                this.mapAnimations[matchedKey] = group;
            }
            group.stop();
        });
    }

    getBoneNode(boneName) {
        if (!this.mesh) return null;
        return this.mesh.getChildTransformNodes(false)
            .find(n => n.name.includes(boneName)) || null;
    }

    initPhysics() {
        if (!this.mesh) return;

        this.mesh.metadata = { character: this, type: 'character' };

        this.physicsBody = new BABYLON.PhysicsBody(
            this.mesh,
            BABYLON.PhysicsMotionType.DYNAMIC,
            false,
            this.scene
        );

        const shape = new BABYLON.PhysicsShapeCapsule(
            new BABYLON.Vector3(0, 0.3, 0),
            new BABYLON.Vector3(0, 1.5, 0),
            0.25,
            this.scene
        );

        shape.material = { friction: 0.8, restitution: 0 };
        this.physicsBody.shape = shape;
        this.physicsBody.setMassProperties({
            mass: 70,
            inertia: new BABYLON.Vector3(0, 0, 0)
        });

        this.physicsBody.disablePreStep = false;
        this.physicsBody.setCollisionCallbackEnabled(true);
        this.initHurtbox();
    }

    initHurtbox() {
        this.hurtbox = BABYLON.MeshBuilder.CreateCapsule(
            `hurtbox_${this.name}`,
            { height: 1.5, radius: 0.25, tessellation: 16 },
            this.scene
        );

        this.hurtbox.metadata = { type: 'hurtbox', character: this };

        const mat = new BABYLON.StandardMaterial(`hurtboxMat_${this.name}`, this.scene);
        mat.diffuseColor = new BABYLON.Color3(0, 1, 0);
        mat.alpha = 0.4;
        this.hurtbox.material = mat;
        this.hurtbox.isVisible = false;

        this.hurtbox.parent = this.mesh;
        this.hurtbox.position.y = 0.9;
        this.hurtbox.isPickable = false;
    }

    move(velocityZ) {
        if (!this.physicsBody) return;

        const currentVel = this.physicsBody.getLinearVelocity();
        this.physicsBody.setLinearVelocity(
            new BABYLON.Vector3(0, currentVel.y, velocityZ)
        );
    }

    stop() {
        if (!this.physicsBody) return;

        const currentVel = this.physicsBody.getLinearVelocity();
        this.physicsBody.setLinearVelocity(
            new BABYLON.Vector3(0, currentVel.y, 0)
        );
    }

    playAnimation(animationName, loop = true, speedRatio = 1.0, blendingSpeed = 1.0, from = null, to = null) {
        const anim = this.mapAnimations[animationName.toLowerCase()];
        if (!anim) {
            console.warn(`Animation "${animationName}" non trouvée`);
            return null;
        }

        if (this.currentAnimation && this.currentAnimation !== anim) {
            this.currentAnimation.stop();
        }

        for (const animGroup of Object.values(this.mapAnimations)) {
            animGroup.enableBlending = true;
            animGroup.blendingSpeed = blendingSpeed;
        }

        this.currentAnimation = anim;
        const speedRatioAnim = speedRatio ?? anim.speedRatio;
        const startFrame = from ?? anim.from;
        const endFrame = to ?? anim.to;
        anim.start(loop, speedRatioAnim, startFrame, endFrame, false);
        return anim;
    }

    setFacingDirection(direction) {
        if (this.stateMachine?.currentState?.isBlocking) return;
        if (this.facingDirection === direction) return;
        this.facingDirection = direction;
        if (this.mesh) {
            this.mesh.rotation = new BABYLON.Vector3(0, direction === 1 ? Math.PI : 0, 0);
        }
    }

    setPosition(position) {
        if (this.mesh) {
            this.mesh.position = position.clone();
        }
    }

    dispose() {
        this.physicsBody?.dispose();
        this.hurtbox?.dispose();
        this.mesh?.dispose();
        this.onHit.clear();
    }
}
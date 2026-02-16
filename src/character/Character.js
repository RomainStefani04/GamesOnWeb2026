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

        this.initMesh(mesh, animationGroups);
        this.initPhysics();
    }

    initMesh(mesh, animationGroups) {
        this.mesh = mesh;
        this.animationGroups = animationGroups || [];
        
        this.animationGroups.forEach(group => {
            const fullName = group.name.toLowerCase();
            let targetKey = null;

            // Identification de l'animation par mot-clé (indépendant du suffixe de clone)
            if (fullName.includes('idle')) targetKey = 'idle';
            else if (fullName.includes('walk_forward')) targetKey = 'walk_forward';
            else if (fullName.includes('walk_backward')) targetKey = 'walk_backward';
            else if (fullName.includes('jab')) {
                targetKey = 'jab';
                group.from = 0; // Vos réglages spécifiques
                group.to = 60;
            }
            else if (fullName.includes('cross')) targetKey = 'cross';

            if (targetKey) {
                this.mapAnimations[targetKey] = group;
                console.log(`[${this.name}] Animation mappée : ${targetKey} (original: ${group.name})`);
            }
            
            group.stop(); // On s'assure qu'elles ne jouent pas toutes en même temps
        });
    }

    initPhysics() {
        if (!this.mesh) return;

        // Tag le mesh pour identifier le character lors des collisions
        this.mesh.metadata = { character: this, type: 'character' };

        this.physicsBody = new BABYLON.PhysicsBody(
            this.mesh,
            BABYLON.PhysicsMotionType.DYNAMIC,
            false,
            this.scene
        );

        // Capsule qui englobe le perso (ajuster selon ton modèle)
        const shape = new BABYLON.PhysicsShapeCapsule(
            new BABYLON.Vector3(0, 0.3, 0),   // point bas
            new BABYLON.Vector3(0, 1.5, 0),   // point haut
            0.25,                               // rayon
            this.scene
        );

        // Pas de rebond, friction pour pas glisser
        shape.material = { friction: 0.8, restitution: 0 };
        this.physicsBody.shape = shape;
        this.physicsBody.setMassProperties({
            mass: 70,
            inertia: new BABYLON.Vector3(0, 0, 0) // bloque toutes les rotations
        });

        // Empêche le perso de dormir (sinon il freeze après un moment sans bouger)
        this.physicsBody.disablePreStep = false;
        
        this.physicsBody.setCollisionCallbackEnabled(true);
        this.initHurtbox();
    }

    initHurtbox() {
        this.hurtbox = BABYLON.MeshBuilder.CreateCapsule(
            `hurtbox_${this.name}`,
            {
                height: 1.5,
                radius: 0.25,
                tessellation: 16
            },
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
            new BABYLON.Vector3(
                0,              // bloque X (pas de mouvement latéral)
                currentVel.y,   // garde Y (gravité, sauts)
                velocityZ
            )
        );
    }

    stop() {
        if (!this.physicsBody) return;

        const currentVel = this.physicsBody.getLinearVelocity();
        this.physicsBody.setLinearVelocity(
            new BABYLON.Vector3(0, currentVel.y, 0)
        );
    }

    playAnimation(animationName, loop = true, speedRatio = 1.0, blendingSpeed = 1.0) {
        const anim = this.mapAnimations[animationName.toLowerCase()];
        if (!anim) {
            console.warn(`Animation "${animationName}" non trouvée`);
            return;
        }

        if (this.currentAnimation && this.currentAnimation !== anim) {
            this.currentAnimation.stop();
        }

        for (const animGroup of Object.values(this.mapAnimations)) {
            animGroup.enableBlending = true;
            animGroup.blendingSpeed = blendingSpeed;
        }

        this.currentAnimation = anim;
        anim.speedRatio = speedRatio;
        anim.start(loop, speedRatio, anim.from, anim.to, false);
        return anim;
    }

    setFacingDirection(direction) {
        if (this.stateMachine?.currentState?.isBlocking) return; // bloque le changement de facing pendant les attaques
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
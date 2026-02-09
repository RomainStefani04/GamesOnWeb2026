import * as BABYLON from '@babylonjs/core';


export class Character {
    constructor(scene, name, mesh, animationGroups) {
        this.scene = scene;
        // Config
        this.name = name;
        this.speed = 2.5;

        // État
        this.facingDirection = 1;
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        
        // Références
        this.currentAnimation = null;
        this.mapAnimations = {};
        this.initMesh(mesh, animationGroups);
    }

    // Voir si on doit le deplacer dans l'assetManager en fonction du perso 
    // (gestion des animations différentes en fonction du glb)
    initMesh(mesh, animationGroups) {
        this.mesh = mesh;
        this.animationGroups = animationGroups || [];
        animationGroups.forEach(group => {
            const name = group.name.toLowerCase();
            switch (name) {
                case 'jab':
                    group.from = 0;
                    group.to = 60;
                    break;
            }
            this.mapAnimations[name] = group;
            group.stop();
        });
        console.log(this.mapAnimations)
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

        if (this.currentAnimation && this.currentAnimation !== anim) {
            this.currentAnimation.stop();
        }

        this.currentAnimation = anim;
        anim.speedRatio = speedRatio;

        anim.start(loop, speedRatio, anim.from, anim.to, false);
        return anim;
    }

    move(velocity) {
        if (!this.mesh) return;
        
        this.mesh.position.x += velocity.x || 0;
        this.mesh.position.y += velocity.y || 0;
        this.mesh.position.z += velocity.z || 0;
    }

    // à changer automatique en fonction de l'adversaire
    setFacingDirection(direction) {
        if (this.facingDirection === direction) return;
        
        this.facingDirection = direction;
        if (this.mesh) {
            this.mesh.scaling.x = Math.abs(this.mesh.scaling.x) * direction;
        }
    }

    setPosition(position) {
        if (this.mesh) {
            this.mesh.position = position.clone();
        }
    }

    dispose() {
        if (this.mesh) this.mesh.dispose();
    }
}
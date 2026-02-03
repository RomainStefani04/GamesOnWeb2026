import * as BABYLON from '@babylonjs/core';


export class Character {
    constructor(scene, config = {}) {
        this.scene = scene;
        
        // Config
        this.name = config.name;
        this.speed = config.speed;

        // État
        this.facingDirection = 1;
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        
        // Références
        this.mesh = null;
        this.skeleton = null;
        this.animationGroups = {};
        this.currentAnimation = null;
        

    }


    initMesh(mesh, skeleton = null, animationGroups = []) {
        this.mesh = mesh;
        this.skeleton = skeleton;
        
        animationGroups.forEach(group => {
            const name = group.name.toLowerCase();
            this.animationGroups[name] = group;
            group.stop();
        });
    }

   
    playAnimation(animationName, loop = true, speedRatio = 1.0, blendingSpeed = 1.0) {
        const anim = this.animationGroups[animationName.toLowerCase()];
        
        if (!anim) {
            console.warn(`Animation "${animationName}" non trouvée`);
            return;
        }

        if (this.currentAnimation && this.currentAnimation !== anim) {
            this.currentAnimation.stop();
        }

        for (const animGroup of Object.values(this.animationGroups)) {
            animGroup.enableBlending = true;
            animGroup.blendingSpeed = blendingSpeed;
        }

        if (this.currentAnimation && this.currentAnimation !== anim) {
            this.currentAnimation.stop();
        }

        this.currentAnimation = anim;
        anim.speedRatio = speedRatio;
        
        anim.start(loop, speedRatio, anim.from, anim.to, false);
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


    getPosition() {
        return this.mesh?.position || BABYLON.Vector3.Zero();
    }

    dispose() {
        if (this.mesh) this.mesh.dispose();
    }
}
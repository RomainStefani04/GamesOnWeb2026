import * as BABYLON from '@babylonjs/core';
import { FireballVisuals } from '../../../../utils/FireballVisuals';

export class Projectile {
    constructor(character, moveData) {
        this.character = character;
        this.scene = character.scene;
        this.moveData = moveData;
        this.hasHit = false;

        const speed = moveData.projectileSpeed ?? 8;
        const direction = character.facingDirection ?? 1;
        const lifetime = moveData.projectileLifetime ?? 3;
        

        this.createMesh();

        //this.visuals = new FireballVisuals(this.scene, this.mesh);
        
        // Gère le déplacement et la collision
        this.updateObserver = this.scene.onBeforeRenderObservable.add(() => {
            this.update(speed, direction);
            this.checkCollisions();
        });

        // Détruit le projectile après sa durée de vie
        setTimeout(() => this.destroy(), lifetime * 1000);
    }

    createMesh() {
        const hitbox = this.moveData.hitbox;
        
        // 1. On récupère la position de spawn
        const boneNode = this.character.getBoneNode(this.moveData.boneName);
        const spawnPosition = boneNode 
            ? BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.Zero(), boneNode.getWorldMatrix())
            : this.character.mesh.position.clone();

        // 2. Création de la sphère (le projectile)
        this.mesh = BABYLON.MeshBuilder.CreateSphere(
            `projectile_${this.character.name}`,
            { diameter: hitbox.radius },
            this.scene
        );
        this.mesh.position.copyFrom(spawnPosition);
        this.mesh.isPickable = false;

        // Matériau de debug (optionnel si tu veux que seule la particule soit visible)
        const debugMat = new BABYLON.StandardMaterial(`hitboxMat_projectile`, this.scene);
        debugMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
        debugMat.alpha = 0.3; // On baisse l'alpha pour mieux voir les particules
        this.mesh.material = debugMat;

        // 3. Création du Système de Particules
        this.pSystem = new BABYLON.ParticleSystem("particles", 500, this.scene);
        this.pSystem.particleTexture = new BABYLON.Texture("assets/textures/Flare.png", this.scene);
        
        // On dit au système que l'émetteur est notre mesh de projectile
        this.pSystem.emitter = this.mesh; 
        
        // Configuration visuelle
        this.pSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        this.pSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0); 
        this.pSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
        
        this.pSystem.color1 = new BABYLON.Color4(1.0, 0.05, 0.05, .9);
        this.pSystem.color2 = new BABYLON.Color4(0.85, 0.05, 0, .9);
        this.pSystem.colorDead = new BABYLON.Color4(.5, .02, 0, .5);
        
        this.pSystem.minSize = 0.2;
        this.pSystem.maxSize = 0.6;
        this.pSystem.minLifeTime = 0.1;
        this.pSystem.maxLifeTime = 0.4;
        this.pSystem.emitRate = 400;
        this.pSystem.addSizeGradient(0, 0.8); 
        this.pSystem.addSizeGradient(0.8, 0.0);
        
        // Pour que les particules restent un peu derrière quand le projectile avance
        this.pSystem.gravity = new BABYLON.Vector3(0, 0, 0);
        
        // Démarrage
        this.pSystem.start();
    }

    update(speed, direction) {
        if (!this.mesh) return;
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
        this.mesh.position.z += direction * speed * deltaTime;
    }

    checkCollisions() {
        if (this.hasHit || !this.mesh) return;

        for (const targetMesh of this.scene.meshes) {
            if (!targetMesh.metadata || targetMesh.metadata.type !== 'hurtbox') continue;
            if (targetMesh.metadata.character === this.character) continue; // Ignore le lanceur

            this.mesh.computeWorldMatrix(true);
            targetMesh.computeWorldMatrix(true);

            if (this.mesh.intersectsMesh(targetMesh, false)) {
                this.onHit(targetMesh.metadata.character);
                return;
            }
        }
    }

    onHit(defenderCharacter) {
        if (this.hasHit) return;
        this.hasHit = true;

        this.character.onHit.notifyObservers({
            attacker: this.character,
            defender: defenderCharacter,
            moveData: this.moveData,
        });

        this.destroy(); // Le projectile disparaît quand il touche
    }

    destroy() {
        if (this.updateObserver) {
            this.scene.onBeforeRenderObservable.remove(this.updateObserver);
            this.updateObserver = null;
        }
        if (this.pSystem) {
            this.pSystem.stop();
            // On attend un peu que les particules existantes disparaissent avant de dispose
            setTimeout(() => {
                if (this.pSystem) this.pSystem.dispose();
            }, 500);
        }
        if (this.mesh) {
            this.mesh.dispose();
            this.mesh = null;
        }
    }
}
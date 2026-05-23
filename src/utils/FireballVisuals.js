// FireballVisuals.js
import * as BABYLON from '@babylonjs/core';

export class FireballVisuals {
    constructor(scene, parentMesh) {
        this.scene = scene;
        this.parentMesh = parentMesh;
        this.systems = [];
        this._loadParticles();
    }

    async _loadParticles() {
        const set = await BABYLON.ParticleHelper.CreateAsync("sun", this.scene);
        
        // Sécurité : si le projectile a été détruit pendant le await
        if (!this.parentMesh || this.parentMesh.isDisposed()) {
            set.dispose();
            return;
        }

        this.systems = set.systems;

        set.systems.forEach(system => {
            // 1. Nettoyage de l'émetteur par défaut créé par le helper
            if (system.emitter && system.emitter.dispose) {
                // On ne dispose pas si c'est déjà notre parentMesh
                if (system.emitter !== this.parentMesh) {
                    // system.emitter.dispose(); // Optionnel mais propre
                }
            }

            // 2. Assignation du mesh mobile
            system.emitter = this.parentMesh;
            
            // 3. Forcer le "World Space" pour que la traînée reste derrière
            system.isLocal = false;

            // 4. Reset immédiat pour téléporter les particules au mesh
            system.reset(); 

            // Peaufinage visuel
            system.minSize = 0.2;
            system.maxSize = 0.5;
        });

        set.start();
    }

    stop() {
        this.systems.forEach(s => s.stop());
    }

    dispose() {
        this.systems.forEach(s => s.dispose());
    }
}
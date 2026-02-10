import * as BABYLON from '@babylonjs/core';
import { CharacterState } from '../CharacterState';

export class AttackState extends CharacterState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Attack";
        this.animationName = 'attack';
        this.animationSpeed = 1.0;
        this.blendingSpeed = 0.1;

        // Hitbox tracking
        this.elapsedTime = 0;
        this.hitboxActive = false;
        this.hitboxMesh = null;
        this.hitboxBody = null;
        this.hasHit = false;         // un seul hit par attaque

        // Données du coup — assignées par les sous-classes (JabState, CrossState)
        this.moveData = null;
    }

    enter() {
        this.isBlocking = true;
        this.elapsedTime = 0;
        this.hitboxActive = false;
        this.hasHit = false;

        // Stop le mouvement pendant l'attaque
        this.character.stop();

        let anim = this.character.playAnimation(this.animationName, false, this.animationSpeed, this.blendingSpeed);
        anim.onAnimationGroupEndObservable.addOnce(() => this.onAttackEnd());
    }

    exit() {
        this.deactivateHitbox();
    }

    update(deltaTime) {
        if (!this.moveData?.hitbox) return;

        this.elapsedTime += deltaTime;
        // Convertir le temps écoulé en frame (base 60fps * vitesse d'anim)
        const currentFrame = this.elapsedTime * this.animationSpeed * 60;
        const hitbox = this.moveData.hitbox;

        if (currentFrame >= hitbox.activeFrame && currentFrame <= hitbox.endFrame) {
            if (!this.hitboxActive) {
                this.activateHitbox();
            }
            this.updateHitboxPosition();
        } else if (this.hitboxActive) {
            this.deactivateHitbox();
        }
    }

    // ==========================================
    // HITBOX — Création / Mise à jour / Suppression
    // ==========================================

    activateHitbox() {
        const hitbox = this.moveData.hitbox;
        const scene = this.character.scene;

        // Créer le mesh de la hitbox (visible en debug)
        this.hitboxMesh = BABYLON.MeshBuilder.CreateBox(
            `hitbox_${this.character.name}_${this.name}`,
            {
                width: hitbox.size.x,
                height: hitbox.size.y,
                depth: hitbox.size.z
            },
            scene
        );

        // Matériau debug — rouge semi-transparent
        const debugMat = new BABYLON.StandardMaterial(`hitboxMat_${this.name}`, scene);
        debugMat.diffuseColor = new BABYLON.Color3(1, 0, 0);
        debugMat.alpha = 0.4;
        this.hitboxMesh.material = debugMat;
        this.hitboxMesh.isVisible = true; // passer à false en prod

        // Tag pour identifier l'attaquant dans les collisions
        this.hitboxMesh.metadata = {
            type: 'hitbox',
            attacker: this.character,
            moveData: this.moveData
        };

        this.updateHitboxPosition();

        // Physics body KINEMATIC + trigger (détecte sans pousser)
        this.hitboxBody = new BABYLON.PhysicsBody(
            this.hitboxMesh,
            BABYLON.PhysicsMotionType.KINEMATIC,
            false,
            scene
        );

        const shape = new BABYLON.PhysicsShapeBox(
            new BABYLON.Vector3(0, 0, 0),
            BABYLON.Quaternion.Identity(),
            new BABYLON.Vector3(hitbox.size.x, hitbox.size.y, hitbox.size.z),
            scene
        );
        shape.isTrigger = true;
        this.hitboxBody.shape = shape;

        // Écouter les collisions trigger
        this.hitboxBody.setCollisionCallbackEnabled(true);
        this.hitboxBody.getCollisionObservable().add((event) => {
            this.onHitboxCollision(event);
        });

        this.hitboxActive = true;
    }

    /**
     * Positionne la hitbox devant le personnage selon son facing.
     */
    updateHitboxPosition() {
        if (!this.hitboxMesh) return;

        const charPos = this.character.mesh.position;
        const hitbox = this.moveData.hitbox;
        const facing = this.character.facingDirection;

        this.hitboxMesh.position.set(
            charPos.x + (hitbox.offset.x || 0),
            charPos.y + hitbox.offset.y,
            charPos.z + hitbox.offset.z * facing
        );
    }

    deactivateHitbox() {
        if (this.hitboxBody) {
            this.hitboxBody.dispose();
            this.hitboxBody = null;
        }
        if (this.hitboxMesh) {
            this.hitboxMesh.dispose();
            this.hitboxMesh = null;
        }
        this.hitboxActive = false;
    }

    // ==========================================
    // COLLISION — Détection du hit
    // ==========================================

    /**
     * Appelé par Havok quand la hitbox trigger touche un autre body.
     * Filtre les collisions pour ne garder que les hits valides.
     */
    onHitboxCollision(event) {
        // Déjà touché pendant cette attaque
        if (this.hasHit) return;

        const otherBody = event.collidedAgainst;
        const otherMesh = otherBody?.transformNode;

        // Vérifier que c'est bien un character et pas nous-même
        if (!otherMesh?.metadata) return;
        if (otherMesh.metadata.type !== 'character') return;
        if (otherMesh.metadata.character === this.character) return;

        // HIT CONFIRMÉ — notifier vers le haut
        this.hasHit = true;
        const hitData = {
            attacker: this.character,
            defender: otherMesh.metadata.character,
            damage: this.moveData.damage,
            moveName: this.name
        };

        console.log(`[HIT] ${hitData.attacker.name} → ${hitData.defender.name} (${hitData.moveName}: ${hitData.damage} dmg)`);

        // Notifie via l'Observable du Character
        // Le CombatSystem pourra s'abonner à ça
        this.character.onHit.notifyObservers(hitData);
    }

    // ==========================================
    // FIN D'ATTAQUE
    // ==========================================

    onAttackEnd() {
        this.deactivateHitbox();
        this.isBlocking = false;
    }
}
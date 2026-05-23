import * as BABYLON from '@babylonjs/core';
import { eventBus } from './../core/EventBus';

export class CombatSystem {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.onHealthChanged = new BABYLON.Observable();

        this.player1.onHit.add((payload) => this.onHit(payload));
        this.player2.onHit.add((payload) => this.onHit(payload));
    }

    onHit({ attacker, defender, moveData }) {
        const sm = defender.stateMachine;
        const isBlocking = sm.currentState.name === "Block" && sm.currentState.active;

        // 1. Gestion des états (Stun ou Fall)
        if (moveData.isSweep) {
            // Le sweep fait tomber, qu'on bloque ou non (mécanique classique si pas de parade basse)
            // Si tu veux que le block annule le sweep, entoure ça d'un if (!isBlocking)
            sm.changeState(sm.states.sweep_fall, { duration: moveData.stunDuration });
        } 
        else if (!isBlocking) {
            // Pas de block et pas un sweep : stun normal
            sm.changeState(sm.states.stun, { duration: moveData.stunDuration });
        }

        // 2. Physique (Knockback)
        if (defender.physicsBody) {
            const force = new BABYLON.Vector3(0, 0, attacker.facingDirection * moveData.knockback);
            defender.physicsBody.applyImpulse(force, defender.mesh.position);
        }

        // 3. Dégâts
        const finalDamage = isBlocking ? Math.floor(moveData.damage * 0.2) : moveData.damage; // Exemple: 20% si block
        defender.currentHealth = Math.max(0, defender.currentHealth - finalDamage);

        // 4. Events & Notifications
        const hitType = moveData.damage > 15 ? 'heavy' : 'light';
        eventBus.emit('hit:landed', { strength: hitType, moveName: moveData.name });

        this.onHealthChanged.notifyObservers({
            player: defender,
            newHp: defender.currentHealth,
            percentage: (defender.currentHealth / defender.maxHealth)
        });
    }
}
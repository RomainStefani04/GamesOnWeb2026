import * as BABYLON from '@babylonjs/core';

export class CombatSystem {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;

        this.onHealthChanged = new BABYLON.Observable();

        // [AI] Observable pour les événements de combat détaillés
        // Émet : { type: 'hit'|'block'|'ko', attacker, defender, moveData, blocked }
        this.onCombatEvent = new BABYLON.Observable();

        this.player1.onHit.add(({attacker, defender, moveData}) => this.onHit(attacker, defender, moveData));
        this.player2.onHit.add(({attacker, defender, moveData}) => this.onHit(attacker, defender, moveData));
    }

    onHit(attacker, defender, moveData) {
        // [AI] Détecter si le coup est bloqué
        const isBlocked = defender.stateMachine.currentState.name === "Block" 
                       && defender.stateMachine.currentState.active;

        if (!isBlocked) {
            const sm = defender.stateMachine;
            sm.changeState(sm.states.stun, { duration: moveData.stunDuration });
        }

        if (defender.physicsBody) {
            defender.physicsBody.applyImpulse(
                new BABYLON.Vector3(0, 0, attacker.facingDirection * moveData.knockback),
                defender.mesh.position
            );
        }

        defender.currentHealth = Math.max(0, defender.currentHealth - moveData.damage);

        // Notifier le changement de vie (pour l'UI)
        this.onHealthChanged.notifyObservers({
            player: defender,
            newHp: defender.currentHealth,
            percentage: (defender.currentHealth / defender.maxHealth)
        });

        // [AI] Notifier l'événement de combat (pour le RewardCalculator)
        this.onCombatEvent.notifyObservers({
            type: isBlocked ? 'block' : 'hit',
            attacker: attacker,
            defender: defender,
            moveData: moveData,
            blocked: isBlocked,
            damage: moveData.damage,
            defenderHpAfter: defender.currentHealth
        });

        // [AI] Détecter le KO
        if (defender.currentHealth <= 0) {
            this.onCombatEvent.notifyObservers({
                type: 'ko',
                attacker: attacker,
                defender: defender,
                moveData: moveData
            });
        }
    }
}
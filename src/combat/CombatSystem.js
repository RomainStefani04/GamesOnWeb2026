import * as BABYLON from '@babylonjs/core';
import { eventBus } from './../core/EventBus';

export class CombatSystem {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;

        this.onHealthChanged = new BABYLON.Observable();

        this.player1.onHit.add(({attacker, defender, damage, moveName}) => this.onHit(attacker, defender, damage, moveName));
        this.player2.onHit.add(({attacker, defender, damage, moveName}) => this.onHit(attacker, defender, damage, moveName));
    }

    onHit(attacker, defender, damage, moveName) {

        // Logique de réduction des PV
        const victim = defender; 
        victim.currentHealth = Math.max(0, victim.currentHealth - damage);

        eventBus.emit('hit:landed', { strength: 'light' });

        // On notifie les abonnés
        this.onHealthChanged.notifyObservers({
            player: defender,
            newHp: victim.currentHealth,
            percentage: (victim.currentHealth / victim.maxHealth)
        });


    }

}
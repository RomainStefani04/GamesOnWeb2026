import * as BABYLON from '@babylonjs/core';
import { eventBus } from './../core/EventBus';

export class CombatSystem {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;

        this.onHealthChanged = new BABYLON.Observable();

        this.player1.onHit.add(({attacker, defender, moveData}) => this.onHit(attacker, defender, moveData));
        this.player2.onHit.add(({attacker, defender, moveData}) => this.onHit(attacker, defender, moveData));
    }

    onHit(attacker, defender, moveData) {

        // On fait tomber tout le temps ?
        if (attacker.stateMachine.currentState.name === "Leg Sweep") {
            console.log("Leg Sweep touché !");
            const sm = defender.stateMachine;
            sm.changeState(sm.states.sweep_fall,{ duration: moveData.stunDuration });
        }
        else if (!(defender.stateMachine.currentState.name == "Block" && defender.stateMachine.currentState.active)) {
            const sm = defender.stateMachine;
            sm.changeState(sm.states.stun, { duration: moveData.stunDuration });
        }
        
        if (defender.physicsBody) {
            console.log(`Appliquer une impulsion de ${moveData.knockback} à ${defender.name}`);
            defender.physicsBody.applyImpulse(
                new BABYLON.Vector3(0, 0, attacker.facingDirection * moveData.knockback),
                defender.mesh.position
            );
        }


        defender.currentHealth = Math.max(0, defender.currentHealth - moveData.damage);

        switch (moveData.name) {
            case "Jab":
                eventBus.emit('hit:landed', { strength: 'light' });
                break;
            case "Cross":
                eventBus.emit('hit:landed', { strength: 'heavy' });
                break;
            case "Light Kick":
                eventBus.emit('hit:landed', { strength: 'light' });
                break;
            case "Heavy Kick":
                eventBus.emit('hit:landed', { strength: 'heavy' });
                break;
            case "Leg Sweep":
                eventBus.emit('hit:landed', { strength: 'heavy' });
                break;
            case "Fireball":
                eventBus.emit('hit:landed', { strength: 'heavy' });
                break;
        }

        // On notifie les abonnés
        this.onHealthChanged.notifyObservers({
            player: defender,
            newHp: defender.currentHealth,
            percentage: (defender.currentHealth / defender.maxHealth)
        });


    }

}
import * as BABYLON from '@babylonjs/core';

export class CombatSystem {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;

        this.onHealthChanged = new BABYLON.Observable();

        this.player1.onHit.add(({attacker, defender, moveData}) => this.onHit(attacker, defender, moveData));
        this.player2.onHit.add(({attacker, defender, moveData}) => this.onHit(attacker, defender, moveData));
    }

    onHit(attacker, defender, moveData) {
        if (!(defender.stateMachine.currentState.name == "Block" && defender.stateMachine.currentState.active)) {
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

        // On notifie les abonnés
        this.onHealthChanged.notifyObservers({
            player: defender,
            newHp: defender.currentHealth,
            percentage: (defender.currentHealth / defender.maxHealth)
        });

        //console.log("---- Hit ----");
        //console.log(`Attacker: ${attacker.name}`);
        //console.log(`Defender: ${defender.name}`);
        //console.log(`Move: ${moveName}`);
        //console.log(`Damage: ${damage}`);
        //console.log("-------------");
    
    }

}
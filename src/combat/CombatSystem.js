export class CombatSystem {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.player1.onHit.add(({attacker, defender, damage, moveName }) => this.onHit(attacker, defender, damage, moveName));
        this.player2.onHit.add(({attacker, defender, damage, moveName }) => this.onHit(attacker, defender, damage, moveName));
    }

    onHit(attacker, defender, damage, moveName) {
        console.log("---- Hit ----");
        console.log(`Attacker: ${attacker.name}`);
        console.log(`Defender: ${defender.name}`);
        console.log(`Move: ${moveName}`);
        console.log(`Damage: ${damage}`);
        console.log("-------------");
    
    }

}
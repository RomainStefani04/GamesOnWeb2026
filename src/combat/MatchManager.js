import { CombatSystem } from './CombatSystem.js';
import { UIManager } from './../ui/UIManager.js';

export class MatchManager {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;

        this.combatSystem = new CombatSystem(this.player1, this.player2);
        this.uiManager = new UIManager(this.player1, this.player2);

        this.currentTime = 99;
        this.timerAccumulator = 0;
        this.isMatchOver = false;

        this.combatSystem.onHealthChanged.add((data) => {
            this.uiManager.updateHealth(data.player, data.newHp);

            // Si un joueur tombe à 0 HP
            if (data.newHp <= 0 && !this.isMatchOver) {
                this.handleKO(data.player);
            }
        });
    }

    updateMatchTimer(deltaTime) {
        if (this.currentTime <= 0) return;

        // deltaTime est en millisecondes
        this.timerAccumulator += deltaTime;

        if (this.timerAccumulator >= 1) { // Chaque seconde
            this.currentTime--;
            this.timerAccumulator = 0;
            this.uiManager.updateTimer(this.currentTime);
            
            if (this.currentTime === 0) {
                this.handleTimeOut();
            }
        }
    }

    // Cas 1 : Quelqu'un n'a plus de vie
    handleKO(loser) {
        this.isMatchOver = true;
        const winner = (loser === this.player1) ? this.player2 : this.player1;
        this.endMatch(winner, loser, "K.O.");
    }

    // Cas 2 : Le temps est fini
    handleTimeOut() {
        if (this.isMatchOver) return;
        this.isMatchOver = true;

        let winner, loser;
        if (this.player1.currentHealth > this.player2.currentHealth) {
            winner = this.player1; loser = this.player2;
        } else if (this.player2.currentHealth > this.player1.currentHealth) {
            winner = this.player2; loser = this.player1;
        } else {
            // Cas d'égalité (Draw)
            return this.endMatch(null, null, "DRAW");
        }

        this.endMatch(winner, loser, "TIME UP");
    }

    endMatch(winner, loser, reason) {
        //changer les états des joueurs pour les animations de victoire/défaite
        if (winner && loser) {
            winner.isReadOnly = true;
            loser.isReadOnly = true;
            winner.stateMachine.changeState(winner.stateMachine.states.walkforward,{loop: true}); 
            loser.stateMachine.changeState(loser.stateMachine.states.walkforward,{loop: true});
        }

        const isWinnerLeft = (winner === this.player1);
        this.uiManager.showEndScreen(winner, reason, isWinnerLeft);
        
    }

}
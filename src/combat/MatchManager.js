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

        this.combatSystem.onHealthChanged.add((data) => {
            this.uiManager.updateHealth(data.player, data.newHp);
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

    handleTimeOut() {
        //console.log("FIN DU TEMPS !");
        // Logique de victoire aux points ici
    }
}
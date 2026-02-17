// UIManager.js
import { HealthBar } from './HealthBar.js';
import { Timer } from './Timer.js';
import * as GUI from '@babylonjs/gui';

export class UIManager {
    constructor(player1, player2) {
        this.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        // On crée une instance de HealthBar pour chaque joueur
        this.healthBars = {
            p1: new HealthBar(player1, this.advancedTexture, true),
            p2: new HealthBar(player2, this.advancedTexture, false)
        };

        this.timer = new Timer(this.advancedTexture, 99);
    }

    // Méthode pour mettre à jour le temps depuis le MatchManager
    updateTimer(seconds) {
        this.timer.updateTime(seconds);
    }

    updateHealth(player, newValue) {
        // On détermine quelle barre mettre à jour
        if (player.name === "player1") {
            this.healthBars.p1.update(newValue);
        } else {
            this.healthBars.p2.update(newValue);
        }
    }
}
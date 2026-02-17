import * as GUI from '@babylonjs/gui';

export class Timer {
    constructor(advancedTexture, initialTime = 99) {
        this.timeLeft = initialTime;
        this.textBlock = null;
        this._createUI(advancedTexture);
    }

    _createUI(advancedTexture) {
        // Création du texte du compteur
        this.textBlock = new GUI.TextBlock();
        this.textBlock.text = this.timeLeft.toString();
        this.textBlock.color = "white";
        this.textBlock.fontSize = 45;
        this.textBlock.fontFamily = "Impact"; // Style Arcade
        
        this.textBlock.height = "160px";
        this.textBlock.width = "5%";
        
        // Positionnement en haut au milieu
        this.textBlock.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.textBlock.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.textBlock.top = "10px";
        
        // Optionnel : Ombre pour la lisibilité
        this.textBlock.shadowBlur = 3;
        this.textBlock.shadowColor = "black";
        this.textBlock.shadowOffsetX = 2;
        this.textBlock.shadowOffsetY = 2;

        advancedTexture.addControl(this.textBlock);
    }

    updateTime(newTime) {
        this.timeLeft = Math.max(0, newTime);
        this.textBlock.text = this.timeLeft.toString();
        
        // Alerte visuelle quand il reste peu de temps
        if (this.timeLeft <= 10) {
            this.textBlock.color = "red";
        }
    }
}   
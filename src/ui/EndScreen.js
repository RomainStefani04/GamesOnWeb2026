import * as GUI from '@babylonjs/gui';

export class EndScreen {
    constructor(advancedTexture, isLeft) {
        this.container = null;
        this.mainText = null;
        this.reasonText = null;
        this.centerLine = null;

        this._createUI(advancedTexture);
    }

    _createUI(advancedTexture) {
        this.container = new GUI.Rectangle("endScreenContainer");
        this.container.width = "100%";
        this.container.height = "100%";
        this.container.background = "rgba(0, 0, 0, 0.7)";
        this.container.thickness = 0;
        this.container.isVisible = false; // Caché par défaut
        this.container.alpha = 0;
        advancedTexture.addControl(this.container);

        this.centerLine = new GUI.Rectangle();
        this.centerLine.width = "100%";
        this.centerLine.height = "150px";
        this.centerLine.background = "rgba(26, 26, 46, 0.9)";
        this.centerLine.thickness = 4;
        this.container.addControl(this.centerLine);

        this.reasonText = new GUI.TextBlock();
        this.reasonText.color = "#ffffff";
        this.reasonText.fontSize = 24;
        this.reasonText.fontFamily = "'Orbitron', sans-serif";
        this.reasonText.top = "-90px";
        this.container.addControl(this.reasonText);

        this.mainText = new GUI.TextBlock();
        this.mainText.fontSize = 72;
        this.mainText.fontWeight = "bold";
        this.mainText.fontFamily = "'Orbitron', sans-serif";
        this.container.addControl(this.mainText);

        // Bouton RESTART
        const btn = GUI.Button.CreateSimpleButton("btn", "RESTART");
        btn.width = "200px";
        btn.height = "50px";
        btn.color = "white";
        btn.top = "120px";
        btn.onPointerUpObservable.add(() => window.location.reload());
        this.container.addControl(btn);
    }

    show(winner, reason, isLeft) {
        this.reasonText.text = reason;
        
        if (winner) {
            // On reprend exactement tes codes couleurs de HealthBar.js
            const primaryColor = isLeft ? "#8b5cf6" : "#ef4444";
            const glowColor = isLeft ? "#a78bfa" : "#f87171";

            this.mainText.text = `${winner.name.toUpperCase()} WINS`;
            this.mainText.color = glowColor;
            this.mainText.shadowColor = primaryColor;
            this.centerLine.color = primaryColor;
        } else {
            this.mainText.text = "DRAW MATCH";
            this.mainText.color = "#e8d5f2";
            this.centerLine.color = "#e8d5f2";
        }

        this.container.isVisible = true;
        this._animateEntry();
    }

    _animateEntry() {
        // Logique d'animation (fondu et scale)
        let frame = 0;
        const animationInterval = setInterval(() => {
            frame++;
            this.container.alpha = frame / 30;
            if (frame >= 30) clearInterval(animationInterval);
        }, 16);
    }
}
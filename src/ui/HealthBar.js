import * as GUI from '@babylonjs/gui';

export class HealthBar {
    constructor(player, advancedTexture, isLeft) {
        this.player = player;
        this.container = null;
        this.mainBar = null;
        this.ghostBar = null;
        this.nameText = null;
        this.healthText = null;
        this.isLeft = isLeft;

        this._createUI(advancedTexture, isLeft);
    }

    _createUI(advancedTexture, isLeft) {
        // Couleurs selon le côté (comme dans CharactersSelectionScene)
        const primaryColor = isLeft ? "#8b5cf6" : "#ef4444";
        const glowColor = isLeft ? "#a78bfa" : "#f87171";

        // 1. Conteneur principal avec style moderne
        this.container = new GUI.Rectangle();
        this.container.width = "40%";
        this.container.height = "160px";
        this.container.thickness = 0;
        this.container.horizontalAlignment = isLeft ? 
            GUI.Control.HORIZONTAL_ALIGNMENT_LEFT : 
            GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.container.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.container.top = "20px";
        this.container.left = isLeft ? "20px" : "-20px";
        advancedTexture.addControl(this.container);

        // 2. Panneau décoratif avec bordure
        const panel = new GUI.Rectangle("healthPanel");
        panel.width = "100%";
        panel.height = "100%";  
        panel.thickness = 0;
        this.container.addControl(panel);

        // 3. Avatar du joueur
        const avatarContainer = new GUI.Rectangle();
        avatarContainer.width = "120px";
        avatarContainer.height = "120px";
        avatarContainer.cornerRadius = 10;
        avatarContainer.thickness = 3;
        avatarContainer.color = primaryColor;
        avatarContainer.background = `${primaryColor}20`;
        avatarContainer.horizontalAlignment = isLeft ? 
            GUI.Control.HORIZONTAL_ALIGNMENT_LEFT : 
            GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        avatarContainer.left = isLeft ? "10px" : "-10px";
        avatarContainer.top = "0px";
        panel.addControl(avatarContainer);

        const avatarName = this.player.meshName.toLowerCase();
        const avatar = new GUI.Image("avatar", `assets/images/characters/${avatarName}.png`);
        avatar.width = "120px";
        avatar.height = "120px";
        avatar.stretch = GUI.Image.STRETCH_UNIFORM;
        avatarContainer.addControl(avatar);

        // Fallback si l'image ne charge pas
        const fallbackText = new GUI.TextBlock();
        fallbackText.text = this.player.name.charAt(0);
        fallbackText.color = `${primaryColor}60`;
        fallbackText.fontSize = 48;
        fallbackText.fontFamily = "'Noto Serif JP', serif";
        avatarContainer.addControl(fallbackText);

        avatar.onImageLoadedObservable.add(() => {
            fallbackText.isVisible = false;
        });

        // 4. Nom du joueur avec style japonais
        this.nameText = new GUI.TextBlock();
        this.nameText.text = this.player.name.toUpperCase();
        this.nameText.color = "#e8d5f2";
        this.nameText.fontSize = 20;
        this.nameText.fontWeight = "bold";
        this.nameText.fontFamily = "'Orbitron', sans-serif";
        this.nameText.textHorizontalAlignment = isLeft ? 
            GUI.Control.HORIZONTAL_ALIGNMENT_LEFT : 
            GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.nameText.top = "-48px";
        this.nameText.left = isLeft ? "145px" : "-145px";
        this.nameText.shadowColor = primaryColor;
        this.nameText.shadowBlur = 10;
        panel.addControl(this.nameText);

        // 5. Label "HP" avec style japonais
        const hpLabel = new GUI.TextBlock();
        hpLabel.text = "HP";
        hpLabel.color = glowColor;
        hpLabel.fontSize = 14;
        hpLabel.fontFamily = "'Orbitron', sans-serif";
        hpLabel.textHorizontalAlignment = isLeft ? 
            GUI.Control.HORIZONTAL_ALIGNMENT_LEFT : 
            GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        hpLabel.top = "-20px";
        hpLabel.left = isLeft ? "145px" : "-145px";
        panel.addControl(hpLabel);

        // 6. Conteneur de la barre de vie
        const barContainer = new GUI.Rectangle();
        barContainer.width = "450px";
        barContainer.height = "28px";
        barContainer.cornerRadius = 6;
        barContainer.thickness = 2;
        barContainer.color = "black";
        barContainer.background = "#1a1a2e";
        barContainer.horizontalAlignment = isLeft ? 
            GUI.Control.HORIZONTAL_ALIGNMENT_LEFT : 
            GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        barContainer.top = "10px";
        barContainer.left = isLeft ? "145px" : "-145px";
        panel.addControl(barContainer);

        // 7. Barre Ghost (dégâts différés)
        this.ghostBar = new GUI.Rectangle();
        this.ghostBar.width = "100%";
        this.ghostBar.height = "100%";
        this.ghostBar.background = "#ef4444";
        this.ghostBar.thickness = 0;
        this.ghostBar.cornerRadius = 4;
        this.ghostBar.horizontalAlignment = isLeft ? 
            GUI.Control.HORIZONTAL_ALIGNMENT_LEFT : 
            GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        barContainer.addControl(this.ghostBar);

        // 8. Barre principale avec dégradé
        this.mainBar = new GUI.Rectangle();
        this.mainBar.width = "100%";
        this.mainBar.height = "100%";
        this.mainBar.background = this._getHealthGradient(1.0, primaryColor);
        this.mainBar.thickness = 0;
        this.mainBar.cornerRadius = 4;
        this.mainBar.horizontalAlignment = isLeft ? 
            GUI.Control.HORIZONTAL_ALIGNMENT_LEFT : 
            GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        barContainer.addControl(this.mainBar);

        // Animation d'entrée
        this._animateEntry();
    }

    _getHealthGradient(percentage, baseColor) {
        // Change la couleur selon le pourcentage de vie
        if (percentage > 0.6) {
            return baseColor; // Violet ou rouge selon le joueur
        } else if (percentage > 0.3) {
            return "#f59e0b"; // Orange
        } else {
            return "#dc2626"; // Rouge danger
        }
    }

    update(currentHealth) {
        const percentage = Math.max(0, currentHealth / this.player.maxHealth);
        
        // Animation de la barre principale
        this.mainBar.width = `${percentage * 100}%`;
        this.mainBar.background = this._getHealthGradient(percentage, 
            this.isLeft ? "#8b5cf6" : "#ef4444");

        // Animation de la barre ghost (délai de 400ms)
        setTimeout(() => {
            if (this.ghostBar) {
                this.ghostBar.width = `${percentage * 100}%`;
            }
        }, 400);

        // Effet de flash si santé critique
        if (percentage < 0.2 && percentage > 0) {
            this._flashCritical();
        }
    }

    _flashCritical() {
        if (!this._isFlashing) {
            this._isFlashing = true;
            let flashCount = 0;
            const maxFlashes = 3;

            const flashInterval = setInterval(() => {
                this.mainBar.alpha = this.mainBar.alpha === 1 ? 0.5 : 1;
                flashCount++;

                if (flashCount >= maxFlashes * 2) {
                    clearInterval(flashInterval);
                    this.mainBar.alpha = 1;
                    this._isFlashing = false;
                }
            }, 200);
        }
    }

    _animateEntry() {
        this.container.alpha = 0;
        this.container.scaleX = 0.9;
        this.container.scaleY = 0.9;

        let frame = 0;
        const duration = 25;

        const animationInterval = setInterval(() => {
            frame++;
            const progress = frame / duration;
            const eased = 1 - Math.pow(1 - progress, 3);

            this.container.alpha = eased;
            this.container.scaleX = 0.9 + (0.1 * eased);
            this.container.scaleY = 0.9 + (0.1 * eased);

            if (frame >= duration) {
                clearInterval(animationInterval);
            }
        }, 16);
    }

    dispose() {
        if (this.container) {
            this.container.dispose();
        }
    }
}
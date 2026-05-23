import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { eventBus } from '../core/EventBus';

export class CharactersSelectionScene {
    constructor(engine, sceneManager, assetManager, city, gameMode) {
        this.engine = engine;
        this.sceneManager = sceneManager;
        this.assetManager = assetManager;
        this.city = city;
        this.gameMode = gameMode; // "solo" ou "pvp"

        this.scene = null;
        this.advancedTexture = null;
        this.particleSystem = null;

        // Sélection des joueurs
        this.player1Selection = null;
        this.player2Selection = null;

        // Modèles 3D preview
        this.player1Preview = null;
        this.player2Preview = null;

        this.availableCharacters = new Set(["akaza"]);

        // Qui est en train de choisir : 1 ou 2
        this.activePlayer = 1;

        // Références UI pour highlights
        this.characterCards = {};
        this.player1NameText = null;
        this.player2NameText = null;
        this.confirmButton = null;

        this.initScene();
    }

    initScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0.04, 0.04, 0.06, 1);
    }

    setup() {
        this.setupCameras();
        this.setupLighting();
        this.createBackground();
        this.createUI();
        this.createCursedEnergyParticles();

        // En mode solo, le joueur 2 est auto-sélectionné (IA choisit un perso aléatoire)
        if (this.gameMode === "solo") {
            this.autoSelectPlayer2();
        }
    }

    // ==========================================
    // CAMERAS
    // ==========================================
    setupCameras() {
        // Caméra principale qui regarde la scène de face, centrée entre les deux joueurs
        this.mainCamera = new BABYLON.ArcRotateCamera(
            "selectionCamera",
            -Math.PI / 2,   // alpha : face à la scène
            Math.PI / 2,  // beta : légèrement en hauteur
            10,              // radius : distance
            new BABYLON.Vector3(0, 1, 0), // target : centre de la scène
            this.scene
        );
        this.mainCamera.inputs.clear(); // Empêcher l'utilisateur de bouger la caméra
        this.mainCamera.lowerRadiusLimit = 10;
        this.mainCamera.upperRadiusLimit = 10;
        this.scene.activeCamera = this.mainCamera;
    }

    // ==========================================
    // ÉCLAIRAGE
    // ==========================================
    setupLighting() {
        const hemiLight = new BABYLON.HemisphericLight(
            "selHemiLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        hemiLight.intensity = 0.6;
        hemiLight.diffuse = new BABYLON.Color3(0.6, 0.5, 0.8);
    }

    // ==========================================
    // FOND
    // ==========================================
    createBackground() {
    }

    // ==========================================
    // INTERFACE UTILISATEUR
    // ==========================================
    createUI() {
        this.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("SelectionUI");

        // ---- TITRE ----
        const titleText = new GUI.TextBlock("selTitle");
        titleText.text = "キャラクター選択";
        titleText.color = "#e8d5f2";
        titleText.fontSize = 40;
        titleText.fontFamily = "'Noto Serif JP', serif";
        titleText.top = "-42%";
        titleText.shadowColor = "#8b5cf6";
        titleText.shadowBlur = 20;
        this.advancedTexture.addControl(titleText);

        const subtitleText = new GUI.TextBlock("selSubtitle");
        subtitleText.text = "CHARACTER SELECT";
        subtitleText.color = "#a78bfa";
        subtitleText.fontSize = 18;
        subtitleText.fontFamily = "'Orbitron', sans-serif";
        subtitleText.top = "-37%";
        this.advancedTexture.addControl(subtitleText);

        // ---- PANNEAU JOUEUR 1 (gauche) ----
        this.createPlayerPanel("left", 1);

        // ---- PANNEAU JOUEUR 2 (droite) ----
        this.createPlayerPanel("right", 2);

        // ---- INDICATEUR DU JOUEUR ACTIF ----
        this.turnIndicator = new GUI.TextBlock("turnIndicator");
        this.turnIndicator.color = "#8b5cf6";
        this.turnIndicator.fontSize = 16;
        this.turnIndicator.fontFamily = "'Orbitron', sans-serif";
        this.turnIndicator.top = "-30%";
        this.advancedTexture.addControl(this.turnIndicator);
        this.updateTurnIndicator();

        // ---- GRILLE DE PERSONNAGES (centre) ----
        this.createCharacterGrid();

        // ---- BOUTON CONFIRMER ----
        this.confirmButton = this.createStyledButton("CONFIRMER", "#8b5cf6", () => {
            eventBus.emit('ui:confirm');
            this.confirmSelection();
        });
        this.confirmButton.top = "42%";
        this.confirmButton.isVisible = false;
        this.advancedTexture.addControl(this.confirmButton);

        // ---- BOUTON RETOUR ----
        const backButton = this.createStyledButton("RETOUR", "#4c1d95", () => {
            eventBus.emit('ui:back');
            this.sceneManager.switchTo('MenuScene');
        });
        backButton.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        backButton.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        backButton.top = "20px";
        backButton.left = "20px";
        this.advancedTexture.addControl(backButton);

        // ---- KEYBOARD ----
        this.setupKeyboard();
    }

    createPlayerPanel(side, playerNum) {
        const isLeft = side === "left";
        const xPos = isLeft ? "-38%" : "38%";
        const color = isLeft ? "#8b5cf6" : "#ef4444";
        const label = isLeft ? "JOUEUR 1" : (this.gameMode === "solo" ? "IA" : "JOUEUR 2");
        const jpLabel = isLeft ? "プレイヤー1" : (this.gameMode === "solo" ? "AI" : "プレイヤー2");

        // Conteneur du panneau
        const panel = new GUI.Rectangle(`p${playerNum}Panel`);
        panel.width = "320px";
        panel.height = "620px";
        panel.left = xPos;
        panel.top = "30px";
        panel.cornerRadius = 15;
        panel.thickness = 3;
        panel.color = color;
        panel.background = `${color}10`;
        this.advancedTexture.addControl(panel);

        // Label joueur
        const playerLabel = new GUI.TextBlock(`p${playerNum}Label`);
        playerLabel.text = label;
        playerLabel.color = color;
        playerLabel.fontSize = 18;
        playerLabel.fontFamily = "'Orbitron', sans-serif";
        playerLabel.fontWeight = "bold";
        playerLabel.top = "-275px";
        panel.addControl(playerLabel);

        // Sous-label japonais
        const jpLabelText = new GUI.TextBlock(`p${playerNum}JpLabel`);
        jpLabelText.text = jpLabel;
        jpLabelText.color = "#a78bfa";
        jpLabelText.fontSize = 14;
        jpLabelText.fontFamily = "'Noto Serif JP', serif";
        jpLabelText.top = "-250px";
        panel.addControl(jpLabelText);

        // Nom du personnage sélectionné
        const nameText = new GUI.TextBlock(`p${playerNum}CharName`);
        nameText.text = "";
        nameText.color = "#e8d5f2";
        nameText.fontSize = 16;
        nameText.fontWeight = "bold";
        nameText.fontFamily = "'Noto Serif JP', serif";
        nameText.top = "270px";
        panel.addControl(nameText);

        if (playerNum === 1) {
            this.player1NameText = nameText;
        } else {
            this.player2NameText = nameText;
        }
    }

    createCharacterGrid() {
        const characters = this.assetManager.getCharacterList();

        const gridContainer = new GUI.Rectangle("charGridContainer");
        gridContainer.width = "460px";
        gridContainer.height = "320px";
        gridContainer.top = "30px";
        gridContainer.thickness = 0;
        gridContainer.background = "transparent";
        this.advancedTexture.addControl(gridContainer);

        const grid = new GUI.Grid("charGrid");
        grid.width = "100%";
        grid.height = "100%";

        // Calculer la disposition : 3 colonnes
        const cols = 3;
        const rows = Math.ceil(characters.length / cols);

        for (let r = 0; r < rows; r++) {
            grid.addRowDefinition(1 / rows);
        }
        for (let c = 0; c < cols; c++) {
            grid.addColumnDefinition(1 / cols);
        }

        gridContainer.addControl(grid);

        characters.forEach((char, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const card = this.createCharacterCard(char, this.isCharacterAvailable(char.key));
            grid.addControl(card, row, col);
            this.characterCards[char.key] = card;
        });

        this.animateMenuEntry(gridContainer);
    }

    createCharacterCard(charData, available) {
        const card = new GUI.Rectangle(`card_${charData.key}`);
        card.width = "130px";
        card.height = "140px";
        card.cornerRadius = 10;
        card.thickness = 3;
        card.color = "#8b5cf6";
        card.background = "rgba(139, 92, 246, 0.08)";
        card.paddingTop = "5px";
        card.paddingBottom = "5px";

        // Portrait du personnage (image)
        const portrait = new GUI.Image(`portrait_${charData.key}`, charData.portrait);
        portrait.width = "130px";
        portrait.height = "140px";
        portrait.stretch = GUI.Image.STRETCH_UNIFORM;
        card.addControl(portrait);

        // Fallback si image non trouvée : afficher initiale
        portrait.onImageLoadedObservable.add(() => { });
        const fallbackText = new GUI.TextBlock(`fallback_${charData.key}`);
        fallbackText.text = charData.name.charAt(0);
        fallbackText.color = "#8b5cf650";
        fallbackText.fontSize = 40;
        fallbackText.fontFamily = "'Noto Serif JP', serif";
        fallbackText.top = "-15px";
        fallbackText.isVisible = true;
        card.addControl(fallbackText);

        // Quand l'image charge, masquer le fallback
        portrait.onImageLoadedObservable.add(() => {
            fallbackText.isVisible = false;
        });

        // Indicateurs de sélection (P1 / P2)
        const p1Indicator = new GUI.TextBlock(`p1Ind_${charData.key}`);
        p1Indicator.text = "P1";
        p1Indicator.color = "#8b5cf6";
        p1Indicator.fontSize = 11;
        p1Indicator.fontWeight = "bold";
        p1Indicator.fontFamily = "'Orbitron', sans-serif";
        p1Indicator.top = "-50px";
        p1Indicator.left = "-45px";
        p1Indicator.isVisible = false;
        card.addControl(p1Indicator);

        const p2Indicator = new GUI.TextBlock(`p2Ind_${charData.key}`);
        p2Indicator.text = "P2";
        p2Indicator.color = "#ef4444";
        p2Indicator.fontSize = 11;
        p2Indicator.fontWeight = "bold";
        p2Indicator.fontFamily = "'Orbitron', sans-serif";
        p2Indicator.top = "-50px";
        p2Indicator.left = "45px";
        p2Indicator.isVisible = false;
        card.addControl(p2Indicator);

        // Stockage des références
        card.metadata = {
            charKey: charData.key,
            charData: charData,
            available,
            p1Indicator,
            p2Indicator
        };

        if (available) {
            // Hover
            card.onPointerEnterObservable.add(() => {
                eventBus.emit('ui:hoover');
                card.background = "rgba(139, 92, 246, 0.25)";
                card.scaleX = 1.08;
                card.scaleY = 1.08;
                card.thickness = 4;
                card.color = "#a78bfa";
            });

            card.onPointerOutObservable.add(() => {
                this.updateCardVisual(card);
            });

            // Click
            card.onPointerClickObservable.add(() => {
                eventBus.emit('ui:select');
                this.selectCharacter(charData.key);
            });
            return card;
        }

        card.color = "#6b7280";
        card.background = "rgba(75, 85, 99, 0.18)";
        portrait.alpha = 0.45;
        fallbackText.color = "#94a3b8";

        const overlay = new GUI.Rectangle(`locked_${charData.key}`);
        overlay.thickness = 0;
        overlay.background = "rgba(17, 24, 39, 0.55)";
        const overlayText = new GUI.TextBlock();
        overlayText.text = "INDISPONIBLE";
        overlayText.color = "#cbd5e1";
        overlayText.fontSize = 14;
        overlayText.fontFamily = "'Orbitron', sans-serif";
        overlayText.fontWeight = "bold";
        overlayText.top = "48px";
        overlay.addControl(overlayText);
        card.addControl(overlay);

        return card;
    }

    updateCardVisual(card) {
        const key = card.metadata.charKey;
        const isP1 = this.player1Selection === key;
        const isP2 = this.player2Selection === key;

        card.scaleX = 1;
        card.scaleY = 1;

        if (isP1 && isP2) {
            card.background = "rgba(200, 120, 255, 0.3)";
            card.thickness = 4;
            card.color = "#c878ff";
        } else if (isP1) {
            card.background = "rgba(139, 92, 246, 0.3)";
            card.thickness = 4;
            card.color = "#8b5cf6";
        } else if (isP2) {
            card.background = "rgba(239, 68, 68, 0.3)";
            card.thickness = 4;
            card.color = "#ef4444";
        } else {
            card.background = "rgba(139, 92, 246, 0.08)";
            card.thickness = 3;
            card.color = "#8b5cf6";
            card.scaleX = 1;
            card.scaleY = 1;
        }
    }

    // ==========================================
    // LOGIQUE DE SÉLECTION
    // ==========================================
    selectCharacter(charKey) {
        if (this.activePlayer === 1) {
            this.setPlayer1Selection(charKey);

            if (this.gameMode === "pvp") {
                this.activePlayer = 2;
                this.updateTurnIndicator();
            } else {
                // Solo : on peut directement confirmer
                this.checkConfirmReady();
            }
        } else if (this.activePlayer === 2 && this.gameMode === "pvp") {
            this.setPlayer2Selection(charKey);
            this.checkConfirmReady();
        }
    }

    setPlayer1Selection(charKey) {
        // Reset ancien
        if (this.player1Selection && this.characterCards[this.player1Selection]) {
            const oldCard = this.characterCards[this.player1Selection];
            oldCard.metadata.p1Indicator.isVisible = false;
            this.player1Selection = null;
            this.updateCardVisual(oldCard);
        }

        this.player1Selection = charKey;

        //eventBus.emit('voice:entry', { character: charKey });

        // Mettre à jour la carte
        const card = this.characterCards[charKey];
        if (card) {
            card.metadata.p1Indicator.isVisible = true;
            this.updateCardVisual(card);
        }

        // Mettre à jour le panneau gauche
        const charData = card.metadata.charData;
        this.player1NameText.text = charData.name;

        // Charger le modèle 3D preview
        this.loadPreviewModel(1, charKey);
    }

    setPlayer2Selection(charKey) {
        // Reset ancien
        if (this.player2Selection && this.characterCards[this.player2Selection]) {
            const oldCard = this.characterCards[this.player2Selection];
            oldCard.metadata.p2Indicator.isVisible = false;
            this.player2Selection = null;
            this.updateCardVisual(oldCard);
            this.player2Selection = null;
        }

        this.player2Selection = charKey;

        // Mettre à jour la carte
        const card = this.characterCards[charKey];
        if (card) {
            card.metadata.p2Indicator.isVisible = true;
            this.updateCardVisual(card);
        }

        // Mettre à jour le panneau droit
        const charData = card.metadata.charData;
        this.player2NameText.text = charData.name;

        // Charger le modèle 3D preview
        this.loadPreviewModel(2, charKey);
    }

    autoSelectPlayer2() {
        const characters = this.assetManager.getCharacterList().filter(char => this.isCharacterAvailable(char.key));
        if (characters.length === 0) {
            console.warn("Aucun personnage disponible pour l'auto-sélection de l'IA.");
            return;
        }
        const randomIndex = Math.floor(Math.random() * characters.length);
        const randomChar = characters[randomIndex];
        this.setPlayer2Selection(randomChar.key);
    }

    loadPreviewModel(playerNum, charKey) {
        // Supprimer l'ancien preview
        if (playerNum === 1 && this.player1Preview) {
            this.player1Preview.mesh.dispose();
            this.player1Preview.animationGroups?.forEach(a => a.dispose());
            this.player1Preview = null;
        }
        if (playerNum === 2 && this.player2Preview) {
            this.player2Preview.mesh.dispose();
            this.player2Preview.animationGroups?.forEach(a => a.dispose());
            this.player2Preview = null;
        }

        try {
            const clone = this.assetManager.cloneCharacterByKey(charKey);
            const mesh = clone.mesh;

            if (playerNum === 1) {
                mesh.position = new BABYLON.Vector3(-2.3, 0, -6);
                mesh.rotation = new BABYLON.Vector3(0, -Math.PI/6, 0);
                this.player1Preview = clone;
            } else {
                mesh.position = new BABYLON.Vector3(2.45, 0, -6);
                mesh.rotation = new BABYLON.Vector3(0, Math.PI/6, 0);
                this.player2Preview = clone;
            }

            // Jouer l'animation idle si disponible
            if (clone.animationGroups && clone.animationGroups.length > 0) {
                const idle = clone.animationGroups.find(
                    ag => ag.name.toLowerCase().includes("idle")
                ) || clone.animationGroups[0];
                idle.start(true);
            }
        } catch (e) {
            console.warn(`Impossible de charger le preview pour ${charKey}:`, e);
        }
    }

    checkConfirmReady() {
        if (this.player1Selection && this.player2Selection) {
            this.confirmButton.isVisible = true;
            this.turnIndicator.text = "PRÊT ! | 準備完了！";
            this.turnIndicator.color = "#22c55e";
        }
    }

    updateTurnIndicator() {
        if (this.activePlayer === 1) {
            this.turnIndicator.text = "▶ JOUEUR 1 - CHOISISSEZ VOTRE PERSONNAGE";
            this.turnIndicator.color = "#8b5cf6";
        } else {
            this.turnIndicator.text = "▶ JOUEUR 2 - CHOISISSEZ VOTRE PERSONNAGE";
            this.turnIndicator.color = "#ef4444";
        }
    }

    confirmSelection() {
        if (!this.player1Selection || !this.player2Selection) return;

        this.sceneManager.switchTo('FightScene', {
            city: this.city,
            characters: {
                player1: this.player1Selection,
                player2: this.player2Selection
            }
        });
    }

    // ==========================================
    // UTILITAIRES
    // ==========================================
    createStyledButton(text, baseColor, onClick) {
        const button = new GUI.Rectangle(`btn_${text}`);
        button.width = "220px";
        button.height = "50px";
        button.cornerRadius = 8;
        button.thickness = 2;
        button.color = baseColor;
        button.background = `${baseColor}20`;

        const buttonText = new GUI.TextBlock();
        buttonText.text = text;
        buttonText.color = "#e8d5f2";
        buttonText.fontSize = 18;
        buttonText.fontFamily = "'Orbitron', sans-serif";
        button.addControl(buttonText);

        button.onPointerEnterObservable.add(() => {
            button.background = `${baseColor}50`;
            button.thickness = 3;
            button.scaleX = 1.05;
            button.scaleY = 1.05;
            buttonText.color = "#ffffff";
        });

        button.onPointerOutObservable.add(() => {
            button.background = `${baseColor}20`;
            button.thickness = 2;
            button.scaleX = 1;
            button.scaleY = 1;
            buttonText.color = "#e8d5f2";
        });

        button.onPointerClickObservable.add(() => {
            button.scaleX = 0.95;
            button.scaleY = 0.95;
            setTimeout(() => {
                button.scaleX = 1.05;
                button.scaleY = 1.05;
                onClick();
            }, 100);
        });

        return button;
    }

    isCharacterAvailable(charKey) {
        return this.availableCharacters.has(charKey);
    }

    createCursedEnergyParticles() {
        this.particleSystem = new BABYLON.ParticleSystem("selCursedEnergy", 200, this.scene);
        this.particleSystem.particleTexture = new BABYLON.Texture(
            "https://playground.babylonjs.com/textures/flare.png",
            this.scene
        );

        this.particleSystem.emitter = new BABYLON.Vector3(0, 0, 0);
        this.particleSystem.minEmitBox = new BABYLON.Vector3(-15, -10, 2);
        this.particleSystem.maxEmitBox = new BABYLON.Vector3(15, 10, 2);

        this.particleSystem.color1 = new BABYLON.Color4(0.55, 0.36, 0.96, 0.6);
        this.particleSystem.color2 = new BABYLON.Color4(0.39, 0.40, 0.95, 0.4);
        this.particleSystem.colorDead = new BABYLON.Color4(0.1, 0.05, 0.2, 0);

        this.particleSystem.minSize = 0.02;
        this.particleSystem.maxSize = 0.1;
        this.particleSystem.minLifeTime = 2;
        this.particleSystem.maxLifeTime = 4;
        this.particleSystem.emitRate = 60;

        this.particleSystem.direction1 = new BABYLON.Vector3(-0.2, 0.3, 0);
        this.particleSystem.direction2 = new BABYLON.Vector3(0.2, 0.8, 0);
        this.particleSystem.minEmitPower = 0.2;
        this.particleSystem.maxEmitPower = 0.6;

        this.particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        this.particleSystem.start();
    }

    animateMenuEntry(element) {
        element.alpha = 0;
        element.scaleX = 0.8;
        element.scaleY = 0.8;

        let frame = 0;
        const duration = 30;

        const animationInterval = setInterval(() => {
            frame++;
            const progress = frame / duration;
            const eased = 1 - Math.pow(1 - progress, 3);

            element.alpha = eased;
            element.scaleX = 0.8 + (0.2 * eased);
            element.scaleY = 0.8 + (0.2 * eased);

            if (frame >= duration) {
                clearInterval(animationInterval);
            }
        }, 16);
    }

    setupKeyboard() {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                switch (kbInfo.event.key) {
                    case "Escape":
                        this.sceneManager.switchTo('MenuScene');
                        break;
                }
            }
        });
    }

    // ==========================================
    // CYCLE DE VIE
    // ==========================================
    onDispose() {
        if (this.player1Preview) {
            this.player1Preview.mesh?.dispose();
            this.player1Preview.animationGroups?.forEach(a => a.dispose());
        }
        if (this.player2Preview) {
            this.player2Preview.mesh?.dispose();
            this.player2Preview.animationGroups?.forEach(a => a.dispose());
        }
        if (this.particleSystem) {
            this.particleSystem.dispose();
        }
        if (this.advancedTexture) {
            this.advancedTexture.dispose();
        }
        if (this.scene) {
            this.scene.dispose();
        }
    }

    render() {
        if (this.scene) {
            this.scene.render();
        }
    }
}
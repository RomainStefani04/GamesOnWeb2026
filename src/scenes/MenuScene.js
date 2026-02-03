import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { InputManager } from '../core/InputManager';
import { InputMapper } from '../core/InputMapper';

export class MenuScene {
    constructor(engine, sceneManager) {
        this.engine = engine;
        this.sceneManager = sceneManager;
        this.scene = null;
        this.advancedTexture = null;
        this.mainContainer = null;
        this.currentPanel = "main";
        this.particleSystem = null;
        this.selectedLevel = 1;
        
        this.init();
    }

    init() {
        this.scene = new BABYLON.Scene(this.engine);
        this.inputManager = new InputManager(this.scene);
        this.inputMapper = new InputMapper(this.inputManager, "MenuScene");
        
        this.setupCamera();
        this.setupLighting();
        this.createBackground();
        this.createUI();
        this.createCursedEnergyParticles();
        this.setupKeyboardNavigation();
    }

    setupCamera() {
        const camera = new BABYLON.FreeCamera(
            "menuCamera", 
            new BABYLON.Vector3(0, 0, -10), 
            this.scene
        );
        camera.setTarget(BABYLON.Vector3.Zero());
    }

    setupLighting() {
        const light = new BABYLON.HemisphericLight(
            "menuLight", 
            new BABYLON.Vector3(0, 1, 0), 
            this.scene
        );
        light.intensity = 0.7;
        light.diffuse = new BABYLON.Color3(0.6, 0.5, 0.8);
    }

    createBackground() {
        const background = BABYLON.MeshBuilder.CreatePlane(
            "background", 
            { width: 30, height: 20 }, 
            this.scene
        );
        background.position.z = 5;

        const backgroundMaterial = new BABYLON.StandardMaterial("bgMat", this.scene);
        const bgTexture = new BABYLON.DynamicTexture(
            "bgTexture", 
            { width: 512, height: 512 }, 
            this.scene
        );
        
        const ctx = bgTexture.getContext();
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, "#0a0a0f");
        gradient.addColorStop(0.5, "#1a1025");
        gradient.addColorStop(1, "#2d1b3d");
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        bgTexture.update();
        
        backgroundMaterial.diffuseTexture = bgTexture;
        backgroundMaterial.emissiveTexture = bgTexture;
        backgroundMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.2, 0.4);
        background.material = backgroundMaterial;
    }

    createUI() {
        this.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("MenuUI");
        
        this.mainContainer = new GUI.Rectangle("mainContainer");
        this.mainContainer.width = "100%";
        this.mainContainer.height = "100%";
        this.mainContainer.thickness = 0;
        this.mainContainer.background = "transparent";
        this.advancedTexture.addControl(this.mainContainer);

        this.showMainMenu();
    }

    clearContainer() {
        if (this.mainContainer) {
            this.mainContainer.clearControls();
        }
    }

    // ==========================================
    // MENU PRINCIPAL
    // ==========================================
    showMainMenu() {
        this.clearContainer();
        this.currentPanel = "main";

        // Titre principal
        const titleContainer = new GUI.Rectangle("titleContainer");
        titleContainer.width = "600px";
        titleContainer.height = "200px";
        titleContainer.top = "-200px";
        titleContainer.thickness = 0;
        titleContainer.background = "transparent";
        this.mainContainer.addControl(titleContainer);

        const title = new GUI.TextBlock("title");
        title.text = "呪術廻戦";
        title.color = "#e8d5f2";
        title.fontSize = 80;
        title.fontFamily = "'Noto Serif JP', serif";
        title.shadowColor = "#8b5cf6";
        title.shadowBlur = 20;
        titleContainer.addControl(title);

        const subtitle = new GUI.TextBlock("subtitle");
        subtitle.text = "CURSED IMPACT";
        subtitle.color = "#a78bfa";
        subtitle.fontSize = 28;
        subtitle.fontFamily = "'Orbitron', sans-serif";
        subtitle.top = "80px";
        titleContainer.addControl(subtitle);

        // Boutons
        const buttonContainer = new GUI.StackPanel("buttonStack");
        buttonContainer.top = "80px";
        buttonContainer.spacing = 20;
        this.mainContainer.addControl(buttonContainer);

        const playButton = this.createButton("JOUER", "#8b5cf6", () => {
            this.showLevelSelect();
        });
        
        const creditsButton = this.createButton("CRÉDITS", "#6366f1", () => {
            this.showCredits();
        });
        
        const quitButton = this.createButton("QUITTER", "#4c1d95", () => {
            window.close();
        });

        buttonContainer.addControl(playButton);
        buttonContainer.addControl(creditsButton);
        buttonContainer.addControl(quitButton);

        this.animateMenuEntry(buttonContainer);
    }

    showLevelSelect() {
        this.clearContainer();
        this.currentPanel = "levels";

        // Titre
        const levelTitle = new GUI.TextBlock("levelTitle");
        levelTitle.text = "SÉLECTION DU NIVEAU";
        levelTitle.color = "#e8d5f2";
        levelTitle.fontSize = 42;
        levelTitle.fontFamily = "'Orbitron', sans-serif";
        levelTitle.top = "-250px";
        levelTitle.shadowColor = "#8b5cf6";
        levelTitle.shadowBlur = 15;
        this.mainContainer.addControl(levelTitle);

        const levelSubtitle = new GUI.TextBlock("levelSubtitle");
        levelSubtitle.text = "レベル選択";
        levelSubtitle.color = "#a78bfa";
        levelSubtitle.fontSize = 24;
        levelSubtitle.fontFamily = "'Noto Serif JP', serif";
        levelSubtitle.top = "-200px";
        this.mainContainer.addControl(levelSubtitle);

        // Grille de niveaux
        const levelGrid = new GUI.Grid("levelGrid");
        levelGrid.width = "700px";
        levelGrid.height = "300px";
        levelGrid.top = "20px";
        
        levelGrid.addRowDefinition(0.5);
        levelGrid.addRowDefinition(0.5);
        levelGrid.addColumnDefinition(0.33);
        levelGrid.addColumnDefinition(0.33);
        levelGrid.addColumnDefinition(0.33);
        
        this.mainContainer.addControl(levelGrid);

        const levels = [
            { num: 1, name: "渋谷", sub: "Shibuya" },
            { num: 2, name: "京都", sub: "Kyoto" },
            { num: 3, name: "東京", sub: "Tokyo" },
            { num: 4, name: "仙台", sub: "Sendai" },
            { num: 5, name: "地獄", sub: "Jigoku" }
        ];

        levels.forEach((level, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const levelBtn = this.createLevelButton(level.num, level.name, level.sub);
            levelGrid.addControl(levelBtn, row, col);
        });

        // Bouton retour
        const backButton = this.createButton("RETOUR", "#4c1d95", () => {
            this.showMainMenu();
        });
        backButton.top = "220px";
        this.mainContainer.addControl(backButton);

        this.animateMenuEntry(levelGrid);
    }

    createLevelButton(number, japaneseName, romajiName) {
        const container = new GUI.Rectangle(`level${number}Container`);
        container.width = "180px";
        container.height = "120px";
        container.cornerRadius = 10;
        container.thickness = 3;
        container.color = "#8b5cf6";
        container.background = "rgba(139, 92, 246, 0.1)";

        const levelNum = new GUI.TextBlock(`levelNum${number}`);
        levelNum.text = `${number}`;
        levelNum.color = "#8b5cf6";
        levelNum.fontSize = 36;
        levelNum.fontWeight = "bold";
        levelNum.top = "-25px";
        container.addControl(levelNum);

        const jpName = new GUI.TextBlock(`jpName${number}`);
        jpName.text = japaneseName;
        jpName.color = "#e8d5f2";
        jpName.fontSize = 24;
        jpName.fontFamily = "'Noto Serif JP', serif";
        jpName.top = "15px";
        container.addControl(jpName);

        const rmName = new GUI.TextBlock(`rmName${number}`);
        rmName.text = romajiName;
        rmName.color = "#a78bfa";
        rmName.fontSize = 12;
        rmName.top = "40px";
        container.addControl(rmName);

        // Hover effects
        container.onPointerEnterObservable.add(() => {
            container.background = "rgba(139, 92, 246, 0.3)";
            container.scaleX = 1.05;
            container.scaleY = 1.05;
            container.thickness = 4;
            container.color = "#a78bfa";
        });

        container.onPointerOutObservable.add(() => {
            container.background = "rgba(139, 92, 246, 0.1)";
            container.scaleX = 1;
            container.scaleY = 1;
            container.thickness = 3;
            container.color = "#8b5cf6";
        });

        container.onPointerClickObservable.add(() => {
            this.startLevel(number,romajiName);
        });

        return container;
    }


    showCredits() {
        this.clearContainer();
        this.currentPanel = "credits";

        const creditsTitle = new GUI.TextBlock("creditsTitle");
        creditsTitle.text = "CRÉDITS";
        creditsTitle.color = "#e8d5f2";
        creditsTitle.fontSize = 48;
        creditsTitle.fontFamily = "'Orbitron', sans-serif";
        creditsTitle.top = "-220px";
        creditsTitle.shadowColor = "#8b5cf6";
        creditsTitle.shadowBlur = 15;
        this.mainContainer.addControl(creditsTitle);

        const creditsPanel = new GUI.Rectangle("creditsPanel");
        creditsPanel.width = "500px";
        creditsPanel.height = "400px";
        creditsPanel.cornerRadius = 15;
        creditsPanel.thickness = 2;
        creditsPanel.color = "#8b5cf6";
        creditsPanel.background = "rgba(26, 16, 37, 0.9)";
        creditsPanel.top = "20px";
        this.mainContainer.addControl(creditsPanel);

        const creditsStack = new GUI.StackPanel("creditsStack");
        creditsStack.spacing = 25;
        creditsPanel.addControl(creditsStack);

        const credits = [
            { role: "DÉVELOPPEURS", name: "Romain/Guillaume" },
            { role: "GAME DESIGNERS", name: "Guillaume/Romain" },
            { role: "ARTWORK", name: "Style Jujutsu Kaisen" },
            { role: "ENGINE", name: "BabylonJS" },
            { role: "INSPIRATION", name: "芥見下々 (Gege Akutami)" }
        ];

        credits.forEach(credit => {
            const creditItem = this.createCreditItem(credit.role, credit.name);
            creditsStack.addControl(creditItem);
        });

        const backButton = this.createButton("RETOUR", "#4c1d95", () => {
            this.showMainMenu();
        });
        backButton.top = "260px";
        this.mainContainer.addControl(backButton);

        this.animateMenuEntry(creditsPanel);
    }

    createCreditItem(role, name) {
        const container = new GUI.StackPanel();
        container.height = "50px";
        container.spacing = 5;

        const roleText = new GUI.TextBlock();
        roleText.text = role;
        roleText.color = "#a78bfa";
        roleText.fontSize = 14;
        roleText.height = "20px";
        container.addControl(roleText);

        const nameText = new GUI.TextBlock();
        nameText.text = name;
        nameText.color = "#e8d5f2";
        nameText.fontSize = 20;
        nameText.fontWeight = "bold";
        nameText.height = "25px";
        container.addControl(nameText);

        return container;
    }

    createButton(text, baseColor, onClick) {
        const button = new GUI.Rectangle(`btn_${text}`);
        button.width = "280px";
        button.height = "60px";
        button.cornerRadius = 8;
        button.thickness = 2;
        button.color = baseColor;
        button.background = `${baseColor}20`;

        const buttonText = new GUI.TextBlock();
        buttonText.text = text;
        buttonText.color = "#e8d5f2";
        buttonText.fontSize = 22;
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

    createCursedEnergyParticles() {
        this.particleSystem = new BABYLON.ParticleSystem("cursedEnergy", 300, this.scene);
        this.particleSystem.particleTexture = new BABYLON.Texture(
            "https://playground.babylonjs.com/textures/flare.png", 
            this.scene
        );
        
        this.particleSystem.emitter = new BABYLON.Vector3(0, 0, 0);
        this.particleSystem.minEmitBox = new BABYLON.Vector3(-15, -10, 2);
        this.particleSystem.maxEmitBox = new BABYLON.Vector3(15, 10, 2);
        
        this.particleSystem.color1 = new BABYLON.Color4(0.55, 0.36, 0.96, 0.8);
        this.particleSystem.color2 = new BABYLON.Color4(0.39, 0.40, 0.95, 0.6);
        this.particleSystem.colorDead = new BABYLON.Color4(0.1, 0.05, 0.2, 0);
        
        this.particleSystem.minSize = 0.02;
        this.particleSystem.maxSize = 0.15;
        this.particleSystem.minLifeTime = 2;
        this.particleSystem.maxLifeTime = 5;
        this.particleSystem.emitRate = 100;
        
        this.particleSystem.direction1 = new BABYLON.Vector3(-0.2, 0.5, 0);
        this.particleSystem.direction2 = new BABYLON.Vector3(0.2, 1, 0);
        this.particleSystem.minEmitPower = 0.3;
        this.particleSystem.maxEmitPower = 0.8;
        
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


    setupKeyboardNavigation() {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                switch (kbInfo.event.key) {
                    case "Escape":
                        if (this.currentPanel !== "main") {
                            this.showMainMenu();
                        }
                        break;
                }
            }
        });
    }


    startLevel(levelNumber, romajiName) {
        console.log(`Démarrage du niveau ${levelNumber} dans la ville de ${romajiName}...`);
        this.selectedLevel = levelNumber;
        
        // Utiliser le SceneManager pour changer de scène
        if (this.sceneManager) {
            this.sceneManager.switchTo('FightScene', { level: levelNumber, city: romajiName });
        }
    }

    onDispose() {
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
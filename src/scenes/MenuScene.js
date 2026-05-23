import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { InputManager } from '../core/InputManager';
import { InputMapper }  from '../core/InputMapper';
import { SettingsUI }   from '../ui/SettingsUI';
import { eventBus }     from '../core/EventBus';

export class MenuScene {
    constructor(engine, sceneManager) {
        this.engine       = engine;
        this.sceneManager = sceneManager;
        this.scene        = null;
        this.advancedTexture = null;
        this.mainContainer   = null;
        this.currentPanel    = "main";
        this.particleSystem  = null;
        this.selectedLevel   = 1;
        this.gameMode        = null;
        this.settingsUI      = null;   // ← instance partagée
        this.availableModes  = { solo: false, pvp: true };
        this.availableLevels = { 1: false, 2: false, 3: true, 4: false, 5: false };

        this.init();
    }

    init() {
        this.scene        = new BABYLON.Scene(this.engine);
        this.inputManager = new InputManager(this.scene);
        this.inputMapper  = new InputMapper(this.inputManager, "menu");

        this.setupCamera();
        this.setupLighting();
        this.createBackground();
        this.createUI();
        this.createCursedEnergyParticles();
        this.setupKeyboardNavigation();
    }

    setupCamera() {
        const camera = new BABYLON.FreeCamera("menuCamera", new BABYLON.Vector3(0, 0, -10), this.scene);
        camera.setTarget(BABYLON.Vector3.Zero());
    }

    setupLighting() {
        const light       = new BABYLON.HemisphericLight("menuLight", new BABYLON.Vector3(0, 1, 0), this.scene);
        light.intensity   = 0.7;
        light.diffuse     = new BABYLON.Color3(0.6, 0.5, 0.8);
    }

    createBackground() {
        const background  = BABYLON.MeshBuilder.CreatePlane("background", { width: 30, height: 20 }, this.scene);
        background.position.z = 5;

        const backgroundMaterial = new BABYLON.StandardMaterial("bgMat", this.scene);
        const bgTexture  = new BABYLON.DynamicTexture("bgTexture", { width: 512, height: 512 }, this.scene);

        const ctx        = bgTexture.getContext();
        const gradient   = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0,   "#0a0a0f");
        gradient.addColorStop(0.5, "#1a1025");
        gradient.addColorStop(1,   "#2d1b3d");
        ctx.fillStyle    = gradient;
        ctx.fillRect(0, 0, 512, 512);
        bgTexture.update();

        backgroundMaterial.diffuseTexture  = bgTexture;
        backgroundMaterial.emissiveTexture = bgTexture;
        backgroundMaterial.emissiveColor   = new BABYLON.Color3(0.3, 0.2, 0.4);
        background.material                = backgroundMaterial;
    }

    createUI() {
        this.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("MenuUI");

        this.mainContainer            = new GUI.Rectangle("mainContainer");
        this.mainContainer.width      = "100%";
        this.mainContainer.height     = "100%";
        this.mainContainer.thickness  = 0;
        this.mainContainer.background = "transparent";
        this.advancedTexture.addControl(this.mainContainer);

        // ── SettingsUI instanciée une fois ici, partagée par tous les panels ──
        // onQuit du menu = retour au menu principal
        this.settingsUI = new SettingsUI(
            this.advancedTexture,
            this.inputManager,
            () => this.settingsUI.close()   // "Quitter" = fermer le panneau
        );

        this.showMainMenu();
    }

    clearContainer() {
        if (this.mainContainer) this.mainContainer.clearControls();
    }

    // ══════════════════════════════════════════════════════════════════════
    //  MENU PRINCIPAL
    // ══════════════════════════════════════════════════════════════════════
    showMainMenu() {
        this.clearContainer();
        this.currentPanel = "main";

        // ── Titre ─────────────────────────────────────────────────────────
        const titleContainer          = new GUI.Rectangle("titleContainer");
        titleContainer.width          = "600px";
        titleContainer.height         = "200px";
        titleContainer.top            = "-200px";
        titleContainer.thickness      = 0;
        titleContainer.background     = "transparent";
        this.mainContainer.addControl(titleContainer);

        const title           = new GUI.TextBlock("title");
        title.text            = "呪術廻戦";
        title.color           = "#e8d5f2";
        title.fontSize        = 80;
        title.fontFamily      = "'Noto Serif JP', serif";
        title.shadowColor     = "#8b5cf6";
        title.shadowBlur      = 20;
        titleContainer.addControl(title);

        const subtitle        = new GUI.TextBlock("subtitle");
        subtitle.text         = "CURSED IMPACT";
        subtitle.color        = "#a78bfa";
        subtitle.fontSize     = 28;
        subtitle.fontFamily   = "'Orbitron', sans-serif";
        subtitle.top          = "80px";
        titleContainer.addControl(subtitle);

        // ── Boutons ───────────────────────────────────────────────────────
        const buttonContainer = new GUI.StackPanel("buttonStack");
        buttonContainer.top   = "80px";
        buttonContainer.spacing = 20;
        this.mainContainer.addControl(buttonContainer);

        const playButton = this.createButton("JOUER", "#8b5cf6", () => {
            eventBus.emit('ui:select');
            this.showModeSelect();
        });
        
        const settingsButton = this.createButton("PARAMÈTRES", "#6366f1", () => {
            eventBus.emit('ui:select');
            this.settingsUI.open();
        });

        const creditsButton = this.createButton("CRÉDITS", "#6366f1", () => {
            eventBus.emit('ui:select');
            this.showCredits();
        });

        const quitButton = this.createButton("QUITTER", "#4c1d95", () => {
            eventBus.emit('ui:select');
            window.close();
        });

        buttonContainer.addControl(playButton);
        buttonContainer.addControl(settingsButton);
        buttonContainer.addControl(creditsButton);
        buttonContainer.addControl(quitButton);

        this.animateMenuEntry(buttonContainer);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  MODE SELECT
    // ══════════════════════════════════════════════════════════════════════
    showModeSelect() {
        this.clearContainer();
        this.currentPanel = "modeSelect";

        const modeTitle           = new GUI.TextBlock("modeTitle");
        modeTitle.text            = "MODE DE JEU";
        modeTitle.color           = "#e8d5f2";
        modeTitle.fontSize        = 42;
        modeTitle.fontFamily      = "'Orbitron', sans-serif";
        modeTitle.top             = "-220px";
        modeTitle.shadowColor     = "#8b5cf6";
        modeTitle.shadowBlur      = 15;
        this.mainContainer.addControl(modeTitle);

        const modeSubtitle        = new GUI.TextBlock("modeSubtitle");
        modeSubtitle.text         = "ゲームモード";
        modeSubtitle.color        = "#a78bfa";
        modeSubtitle.fontSize     = 24;
        modeSubtitle.fontFamily   = "'Noto Serif JP', serif";
        modeSubtitle.top          = "-170px";
        this.mainContainer.addControl(modeSubtitle);

        const modeContainer       = new GUI.StackPanel("modeContainer");
        modeContainer.isVertical  = false;
        modeContainer.spacing     = 40;
        modeContainer.top         = "10px";
        modeContainer.clipChildren = false;
        modeContainer.clipContent  = false;
        this.mainContainer.addControl(modeContainer);

        const soloCard = this.createModeCard(
            "solo", "JOUEUR VS IA", "対 AI",
            "Affrontez une intelligence\nartificielle redoutable", "",
            "#8b5cf6", this.isModeAvailable("solo"), () => { this.gameMode = "solo"; eventBus.emit('ui:select'); this.showLevelSelect(); }
        );
        const pvpCard = this.createModeCard(
            "pvp", "JOUEUR VS JOUEUR", "対 プレイヤー",
            "Défiez un ami en\ncombat local", "",
            "#6366f1", this.isModeAvailable("pvp"), () => { this.gameMode = "pvp"; eventBus.emit('ui:select'); this.showLevelSelect(); }
        );
        modeContainer.addControl(soloCard);
        modeContainer.addControl(pvpCard);

        const backButton  = this.createButton("RETOUR", "#4c1d95", () => { eventBus.emit('ui:back'); this.showMainMenu(); });
        backButton.top    = "220px";
        this.mainContainer.addControl(backButton);

        this.animateMenuEntry(modeContainer);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  LEVEL SELECT
    // ══════════════════════════════════════════════════════════════════════
    showLevelSelect() {
        this.clearContainer();
        this.currentPanel = "levels";

        const levelTitle        = new GUI.TextBlock("levelTitle");
        levelTitle.text         = "SÉLECTION DU NIVEAU";
        levelTitle.color        = "#e8d5f2";
        levelTitle.fontSize     = 42;
        levelTitle.fontFamily   = "'Orbitron', sans-serif";
        levelTitle.top          = "-250px";
        levelTitle.shadowColor  = "#8b5cf6";
        levelTitle.shadowBlur   = 15;
        this.mainContainer.addControl(levelTitle);

        const levelSubtitle     = new GUI.TextBlock("levelSubtitle");
        levelSubtitle.text      = "レベル選択";
        levelSubtitle.color     = "#a78bfa";
        levelSubtitle.fontSize  = 24;
        levelSubtitle.fontFamily = "'Noto Serif JP', serif";
        levelSubtitle.top       = "-200px";
        this.mainContainer.addControl(levelSubtitle);

        const levelGrid         = new GUI.Grid("levelGrid");
        levelGrid.width         = "700px";
        levelGrid.height        = "300px";
        levelGrid.top           = "20px";
        levelGrid.addRowDefinition(0.5);
        levelGrid.addRowDefinition(0.5);
        levelGrid.addColumnDefinition(0.33);
        levelGrid.addColumnDefinition(0.33);
        levelGrid.addColumnDefinition(0.33);
        this.mainContainer.addControl(levelGrid);

        const levels = [
            { num: 1, name: "渋谷", sub: "Shibuya" },
            { num: 2, name: "京都", sub: "Kyoto"   },
            { num: 3, name: "東京", sub: "Tokyo"   },
            { num: 4, name: "仙台", sub: "Sendai"  },
            { num: 5, name: "地獄", sub: "Jigoku"  },
        ];
        levels.forEach((level, index) => {
            const row    = Math.floor(index / 3);
            const col    = index % 3;
            const btn    = this.createLevelButton(level.num, level.name, level.sub, this.isLevelAvailable(level.num));
            levelGrid.addControl(btn, row, col);
        });

        const backButton = this.createButton("RETOUR", "#4c1d95", () => { eventBus.emit('ui:back'); this.showMainMenu(); });
        backButton.top   = "220px";
        this.mainContainer.addControl(backButton);

        this.animateMenuEntry(levelGrid);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  CRÉDITS
    // ══════════════════════════════════════════════════════════════════════
    showCredits() {
        this.clearContainer();
        this.currentPanel = "credits";

        const creditsTitle       = new GUI.TextBlock("creditsTitle");
        creditsTitle.text        = "CRÉDITS";
        creditsTitle.color       = "#e8d5f2";
        creditsTitle.fontSize    = 48;
        creditsTitle.fontFamily  = "'Orbitron', sans-serif";
        creditsTitle.top         = "-220px";
        creditsTitle.shadowColor = "#8b5cf6";
        creditsTitle.shadowBlur  = 15;
        this.mainContainer.addControl(creditsTitle);

        const creditsPanel          = new GUI.Rectangle("creditsPanel");
        creditsPanel.width          = "500px";
        creditsPanel.height         = "400px";
        creditsPanel.cornerRadius   = 15;
        creditsPanel.thickness      = 2;
        creditsPanel.color          = "#8b5cf6";
        creditsPanel.background     = "rgba(26, 16, 37, 0.9)";
        creditsPanel.top            = "20px";
        this.mainContainer.addControl(creditsPanel);

        const creditsStack  = new GUI.StackPanel("creditsStack");
        creditsStack.spacing = 25;
        creditsPanel.addControl(creditsStack);

        [
            { role: "DÉVELOPPEURS",  name: "Romain / Guillaume"       },
            { role: "GAME DESIGNERS", name: "Guillaume / Romain"       },
            { role: "ARTWORK",        name: "Style Jujutsu Kaisen"     },
            { role: "ENGINE",         name: "BabylonJS"                },
            { role: "INSPIRATION",    name: "芥見下々 (Gege Akutami)"  },
        ].forEach(c => creditsStack.addControl(this.createCreditItem(c.role, c.name)));

        const backButton = this.createButton("RETOUR", "#4c1d95", () => { eventBus.emit('ui:back'); this.showMainMenu(); });
        backButton.top   = "260px";
        this.mainContainer.addControl(backButton);

        this.animateMenuEntry(creditsPanel);
    }

    // ══════════════════════════════════════════════════════════════════════
    //  COMPOSANTS RÉUTILISABLES  (style identique à l'original)
    // ══════════════════════════════════════════════════════════════════════
    createButton(text, baseColor, onClick) {
        const button          = new GUI.Rectangle(`btn_${text}`);
        button.width          = "280px";
        button.height         = "60px";
        button.cornerRadius   = 8;
        button.thickness      = 2;
        button.color          = baseColor;
        button.background     = `${baseColor}20`;

        const buttonText      = new GUI.TextBlock();
        buttonText.text       = text;
        buttonText.color      = "#e8d5f2";
        buttonText.fontSize   = 22;
        buttonText.fontFamily = "'Orbitron', sans-serif";
        button.addControl(buttonText);

        button.onPointerEnterObservable.add(() => {
            eventBus.emit('ui:hoover');
            button.background  = `${baseColor}50`;
            button.thickness   = 3;
            button.scaleX      = 1.05;
            button.scaleY      = 1.05;
            buttonText.color   = "#ffffff";
        });
        button.onPointerOutObservable.add(() => {
            button.background = `${baseColor}20`;
            button.thickness  = 2;
            button.scaleX     = 1;
            button.scaleY     = 1;
            buttonText.color  = "#e8d5f2";
        });
        button.onPointerClickObservable.add(() => {
            button.scaleX = 0.95; button.scaleY = 0.95;
            setTimeout(() => { button.scaleX = 1.05; button.scaleY = 1.05; onClick(); }, 100);
        });

        return button;
    }

    createModeCard(id, title, japaneseTitle, description, icon, baseColor, available, onClick) {
        const card          = new GUI.Rectangle(`modeCard_${id}`);
        card.width          = "260px";
        card.height         = "300px";
        card.cornerRadius   = 15;
        card.thickness      = 3;
        card.color          = baseColor;
        card.background     = `${baseColor}15`;

        const iconText      = new GUI.TextBlock(`modeIcon_${id}`);
        iconText.text       = icon;
        iconText.fontSize   = 60;
        iconText.top        = "-90px";
        card.addControl(iconText);

        const jpTitle       = new GUI.TextBlock(`modeJpTitle_${id}`);
        jpTitle.text        = japaneseTitle;
        jpTitle.color       = "#a78bfa";
        jpTitle.fontSize    = 18;
        jpTitle.fontFamily  = "'Noto Serif JP', serif";
        jpTitle.top         = "-30px";
        card.addControl(jpTitle);

        const mainTitle     = new GUI.TextBlock(`modeMainTitle_${id}`);
        mainTitle.text      = title;
        mainTitle.color     = "#e8d5f2";
        mainTitle.fontSize  = 18;
        mainTitle.fontWeight = "bold";
        mainTitle.fontFamily = "'Orbitron', sans-serif";
        mainTitle.top       = "10px";
        card.addControl(mainTitle);

        const desc          = new GUI.TextBlock(`modeDesc_${id}`);
        desc.text           = description;
        desc.color          = "#9ca3af";
        desc.fontSize       = 13;
        desc.top            = "70px";
        desc.textWrapping   = true;
        desc.lineSpacing    = "4px";
        card.addControl(desc);

        if (available) {
            card.onPointerEnterObservable.add(() => {
                eventBus.emit('ui:hoover');
                card.background = `${baseColor}35`; card.scaleX = 1.05; card.scaleY = 1.05;
                card.thickness  = 4; card.color = "#a78bfa";
            });
            card.onPointerOutObservable.add(() => {
                card.background = `${baseColor}15`; card.scaleX = 1; card.scaleY = 1;
                card.thickness  = 3; card.color = baseColor;
            });
            card.onPointerClickObservable.add(() => {
                card.scaleX = 0.95; card.scaleY = 0.95;
                setTimeout(() => { card.scaleX = 1.05; card.scaleY = 1.05; onClick(); }, 100);
            });
            return card;
        }

        card.color = "#6b7280";
        card.background = "rgba(75, 85, 99, 0.18)";
        iconText.color = "#9ca3af";
        jpTitle.color = "#9ca3af";
        mainTitle.color = "#d1d5db";
        desc.color = "#9ca3af";

        const overlay = new GUI.Rectangle(`modeOverlay_${id}`);
        overlay.thickness = 0;
        overlay.background = "rgba(17, 24, 39, 0.55)";
        const overlayText = new GUI.TextBlock();
        overlayText.text = "INDISPONIBLE";
        overlayText.color = "#cbd5e1";
        overlayText.fontSize = 18;
        overlayText.fontFamily = "'Orbitron', sans-serif";
        overlayText.fontWeight = "bold";
        overlayText.top = "95px";
        overlay.addControl(overlayText);
        card.addControl(overlay);

        return card;
    }

    createLevelButton(number, japaneseName, romajiName, available) {
        const container       = new GUI.Rectangle(`level${number}Container`);
        container.width       = "180px";
        container.height      = "120px";
        container.cornerRadius = 10;
        container.thickness   = 3;
        container.color       = "#8b5cf6";
        container.background  = "rgba(139, 92, 246, 0.1)";

        const levelNum        = new GUI.TextBlock(`levelNum${number}`);
        levelNum.text         = `${number}`;
        levelNum.color        = "#8b5cf6";
        levelNum.fontSize     = 36;
        levelNum.fontWeight   = "bold";
        levelNum.top          = "-25px";
        container.addControl(levelNum);

        const jpName          = new GUI.TextBlock(`jpName${number}`);
        jpName.text           = japaneseName;
        jpName.color          = "#e8d5f2";
        jpName.fontSize       = 24;
        jpName.fontFamily     = "'Noto Serif JP', serif";
        jpName.top            = "15px";
        container.addControl(jpName);

        const rmName          = new GUI.TextBlock(`rmName${number}`);
        rmName.text           = romajiName;
        rmName.color          = "#a78bfa";
        rmName.fontSize       = 12;
        rmName.top            = "40px";
        container.addControl(rmName);

        if (available) {
            container.onPointerEnterObservable.add(() => {
                eventBus.emit('ui:hoover');
                container.background = "rgba(139, 92, 246, 0.3)";
                container.scaleX = 1.05; container.scaleY = 1.05;
                container.thickness = 4; container.color = "#a78bfa";
            });
            container.onPointerOutObservable.add(() => {
                container.background = "rgba(139, 92, 246, 0.1)";
                container.scaleX = 1; container.scaleY = 1;
                container.thickness = 3; container.color = "#8b5cf6";
            });
            container.onPointerClickObservable.add(() => {
                eventBus.emit('ui:confirm');
                this.startLevel(number, romajiName);
            });
            return container;
        }

        container.color = "#6b7280";
        container.background = "rgba(75, 85, 99, 0.18)";
        levelNum.color = "#9ca3af";
        jpName.color = "#d1d5db";
        rmName.color = "#9ca3af";

        const overlay = new GUI.Rectangle(`levelOverlay${number}`);
        overlay.thickness = 0;
        overlay.background = "rgba(17, 24, 39, 0.55)";
        const overlayText = new GUI.TextBlock();
        overlayText.text = "INDISPONIBLE";
        overlayText.color = "#cbd5e1";
        overlayText.fontSize = 12;
        overlayText.fontFamily = "'Orbitron', sans-serif";
        overlayText.fontWeight = "bold";
        overlayText.top = "18px";
        overlay.addControl(overlayText);
        container.addControl(overlay);

        return container;
    }

    createCreditItem(role, name) {
        const container  = new GUI.StackPanel();
        container.height = "50px";
        container.spacing = 5;

        const roleText      = new GUI.TextBlock();
        roleText.text       = role;
        roleText.color      = "#a78bfa";
        roleText.fontSize   = 14;
        roleText.height     = "20px";
        container.addControl(roleText);

        const nameText      = new GUI.TextBlock();
        nameText.text       = name;
        nameText.color      = "#e8d5f2";
        nameText.fontSize   = 20;
        nameText.fontWeight = "bold";
        nameText.height     = "25px";
        container.addControl(nameText);

        return container;
    }

    // ══════════════════════════════════════════════════════════════════════
    //  PARTICULES / ANIMATION
    // ══════════════════════════════════════════════════════════════════════
    createCursedEnergyParticles() {
        this.particleSystem = new BABYLON.ParticleSystem("cursedEnergy", 300, this.scene);
        this.particleSystem.particleTexture = new BABYLON.Texture(
            "https://playground.babylonjs.com/textures/flare.png", this.scene
        );
        this.particleSystem.emitter        = new BABYLON.Vector3(0, 0, 0);
        this.particleSystem.minEmitBox     = new BABYLON.Vector3(-15, -10, 2);
        this.particleSystem.maxEmitBox     = new BABYLON.Vector3(15, 10, 2);
        this.particleSystem.color1         = new BABYLON.Color4(0.55, 0.36, 0.96, 0.8);
        this.particleSystem.color2         = new BABYLON.Color4(0.39, 0.40, 0.95, 0.6);
        this.particleSystem.colorDead      = new BABYLON.Color4(0.1, 0.05, 0.2, 0);
        this.particleSystem.minSize        = 0.02;
        this.particleSystem.maxSize        = 0.15;
        this.particleSystem.minLifeTime    = 2;
        this.particleSystem.maxLifeTime    = 5;
        this.particleSystem.emitRate       = 100;
        this.particleSystem.direction1     = new BABYLON.Vector3(-0.2, 0.5, 0);
        this.particleSystem.direction2     = new BABYLON.Vector3(0.2, 1, 0);
        this.particleSystem.minEmitPower   = 0.3;
        this.particleSystem.maxEmitPower   = 0.8;
        this.particleSystem.blendMode      = BABYLON.ParticleSystem.BLENDMODE_ADD;
        this.particleSystem.start();
    }

    animateMenuEntry(element) {
        element.alpha  = 0;
        element.scaleX = 0.8;
        element.scaleY = 0.8;
        let frame = 0;
        const anim = setInterval(() => {
            frame++;
            const t = 1 - Math.pow(1 - frame / 30, 3);
            element.alpha  = t;
            element.scaleX = 0.8 + 0.2 * t;
            element.scaleY = 0.8 + 0.2 * t;
            if (frame >= 30) clearInterval(anim);
        }, 16);
    }

    setupKeyboardNavigation() {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                if (kbInfo.event.key === "Escape") {
                    // Si le panneau settings est ouvert, le fermer en priorité
                    if (this.settingsUI?.panel?.isVisible) {
                        this.settingsUI.close();
                        return;
                    }
                    if (this.currentPanel !== "main") this.showMainMenu();
                }
            }
        });
    }

    startLevel(levelNumber, romajiName) {
        this.selectedLevel = levelNumber;
        if (this.sceneManager) {
            this.sceneManager.switchTo('CharactersSelectionScene', { city: romajiName, gameMode: this.gameMode });
        }
    }

    isModeAvailable(mode) {
        return this.availableModes[mode] !== false;
    }

    isLevelAvailable(levelNumber) {
        return this.availableLevels[levelNumber] !== false;
    }

    onDispose() {
        this.particleSystem?.dispose();
        this.advancedTexture?.dispose();
        this.scene?.dispose();
    }

    render() {
        this.scene?.render();
    }
}
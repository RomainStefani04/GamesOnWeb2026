import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

const CURSED_COLORS = {
    primary: "#8b5cf6",     // violet énergie
    secondary: "#ef4444",   // rouge impact
    accent: "#22d3ee",      // bleu électrique
    text: "#f5f3ff",
    textDim: "#a78bfa",
    dark: "#0a0614"
};

export class LoadingScene {
    constructor(engine, sceneManager, params = {}) {
        this.engine = engine;
        this.sceneManager = sceneManager;
        
        // Paramètres de la scène à charger
        this.targetScene = params.targetScene || 'FightScene';
        this.targetParams = params.targetParams || {};
        
        // État du chargement
        this.progress = 0;
        this.loadingTasks = [];
        this.currentTaskIndex = 0;
        this.isLoading = false;
        this.particleSystem = null;
        
        this.init();
    }

    init() {
        // Créer une scène légère pour le loading
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0.04, 0.02, 0.06, 1);
        
        // Caméra simple
        this.camera = new BABYLON.FreeCamera(
            "loadingCamera",
            new BABYLON.Vector3(0, 0, -10),
            this.scene
        );
        
        // Lighting
        this.setupLighting();
        
        // Background
        this.createBackground();
        
        // Créer l'UI
        this.createUI();
        
        // Démarrer le chargement
        this.startLoading();
    }

    setupLighting() {
        const light = new BABYLON.HemisphericLight(
            "loadingLight", 
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
        // GUI plein écran
        this.gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("loadingUI", true, this.scene);

        // Container principal
        const container = new GUI.Rectangle("container");
        container.width = "100%";
        container.height = "100%";
        container.thickness = 0;
        container.background = "transparent";
        this.gui.addControl(container);

        // Titre japonais
        const titleJp = new GUI.TextBlock("titleJp");
        titleJp.text = "読み込み中";
        titleJp.color = "#e8d5f2";
        titleJp.fontSize = 64;
        titleJp.fontFamily = "'Noto Serif JP', serif";
        titleJp.top = "-200px";
        titleJp.shadowColor = CURSED_COLORS.primary;
        titleJp.shadowBlur = 20;
        container.addControl(titleJp);

        // Traduction française du titre
        const titleFr = new GUI.TextBlock("titleFr");
        titleFr.text = "Chargement en cours";
        titleFr.color = CURSED_COLORS.textDim;
        titleFr.fontSize = 18;
        titleFr.fontFamily = "'Orbitron', sans-serif";
        titleFr.top = "-150px";
        container.addControl(titleFr);

        // Sous-titre
        const subtitle = new GUI.TextBlock("subtitle");
        subtitle.text = "LOADING";
        subtitle.color = CURSED_COLORS.textDim;
        subtitle.fontSize = 24;
        subtitle.fontFamily = "'Orbitron', sans-serif";
        subtitle.top = "-110px";
        container.addControl(subtitle);

        // Symbole rotatif (cercle d'énergie)
        this.createRotatingSymbol(container);
        
        // Texte de progression (japonais + français)
        this.progressText = new GUI.TextBlock("progressText");
        this.progressText.text = "準備中... | Préparation...";
        this.progressText.color = CURSED_COLORS.textDim;
        this.progressText.fontSize = 18;
        this.progressText.fontFamily = "'Orbitron', sans-serif";
        this.progressText.top = "80px";
        container.addControl(this.progressText);
        
        // Container barre de progression
        const progressContainer = new GUI.Rectangle("progressContainer");
        progressContainer.width = "450px";
        progressContainer.height = "30px";
        progressContainer.top = "130px";
        progressContainer.thickness = 0;
        progressContainer.background = "transparent";
        container.addControl(progressContainer);

        // Barre de progression - Background
        const progressBarBg = new GUI.Rectangle("progressBarBg");
        progressBarBg.width = "400px";
        progressBarBg.height = "8px";
        progressBarBg.cornerRadius = 4;
        progressBarBg.thickness = 2;
        progressBarBg.color = CURSED_COLORS.primary;
        progressBarBg.background = "rgba(139, 92, 246, 0.1)";
        progressContainer.addControl(progressBarBg);
        
        // Barre de progression - Remplissage (CORRIGÉ)
        this.progressBarFill = new GUI.Rectangle("progressBarFill");
        this.progressBarFill.width = "0px";
        this.progressBarFill.height = "4px";
        this.progressBarFill.cornerRadius = 2;
        this.progressBarFill.background = CURSED_COLORS.primary;
        this.progressBarFill.shadowColor = CURSED_COLORS.primary;
        this.progressBarFill.shadowBlur = 10;
        this.progressBarFill.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.progressBarFill.left = "0px";
        progressBarBg.addControl(this.progressBarFill);

        // Décorations aux extrémités de la barre
        const leftDeco = this.createBarDecoration();
        leftDeco.left = "-210px";
        progressContainer.addControl(leftDeco);

        const rightDeco = this.createBarDecoration();
        rightDeco.left = "210px";
        progressContainer.addControl(rightDeco);
        
        // Pourcentage
        this.percentText = new GUI.TextBlock("percentText");
        this.percentText.text = "0%";
        this.percentText.color = "#e8d5f2";
        this.percentText.fontSize = 32;
        this.percentText.fontFamily = "'Orbitron', sans-serif";
        this.percentText.fontWeight = "bold";
        this.percentText.top = "180px";
        this.percentText.shadowColor = CURSED_COLORS.primary;
        this.percentText.shadowBlur = 10;
        container.addControl(this.percentText);

        // Conseils de jeu (japonais + français)
        const tips = [
            { jp: "ジャブで素早いコンボを！", fr: "Enchaînez des combos rapides avec le jab !" },
            { jp: "クロスは強力だが遅い", fr: "Le cross est puissant mais lent" },
            { jp: "ガードのタイミングが重要", fr: "Le timing de la garde est crucial" }
        ];
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        // Conseil japonais
        const tipTextJp = new GUI.TextBlock("tipJp");
        tipTextJp.text = `ヒント: ${randomTip.jp}`;
        tipTextJp.color = CURSED_COLORS.textDim;
        tipTextJp.fontSize = 16;
        tipTextJp.fontFamily = "'Noto Serif JP', serif";
        tipTextJp.fontStyle = "italic";
        tipTextJp.top = "260px";
        tipTextJp.alpha = 0.8;
        container.addControl(tipTextJp);

        // Conseil français
        const tipTextFr = new GUI.TextBlock("tipFr");
        tipTextFr.text = `Astuce : ${randomTip.fr}`;
        tipTextFr.color = CURSED_COLORS.text;
        tipTextFr.fontSize = 14;
        tipTextFr.fontFamily = "'Orbitron', sans-serif";
        tipTextFr.top = "290px";
        tipTextFr.alpha = 0.9;
        container.addControl(tipTextFr);

        // Animation d'entrée
        this.animateEntry(container);
    }

    createRotatingSymbol(parent) {
        // Container pour les cercles
        const symbolContainer = new GUI.Rectangle("symbolContainer");
        symbolContainer.width = "100px";
        symbolContainer.height = "100px";
        symbolContainer.thickness = 0;
        symbolContainer.background = "transparent";
        symbolContainer.top = "0px";
        parent.addControl(symbolContainer);

        // Cercle externe avec arc (pas complet = visible en rotation)
        const outerCircle = new GUI.Ellipse("outerCircle");
        outerCircle.width = "80px";
        outerCircle.height = "80px";
        outerCircle.thickness = 3;
        outerCircle.color = CURSED_COLORS.primary;
        outerCircle.background = "transparent";
        outerCircle.shadowColor = CURSED_COLORS.primary;
        outerCircle.shadowBlur = 15;
        symbolContainer.addControl(outerCircle);

        // Points/marqueurs sur le cercle externe pour montrer la rotation
        const markers = [];
        for (let i = 0; i < 4; i++) {
            const marker = new GUI.Ellipse(`marker${i}`);
            marker.width = "8px";
            marker.height = "8px";
            marker.thickness = 0;
            marker.background = i % 2 === 0 ? CURSED_COLORS.primary : CURSED_COLORS.accent;
            marker.shadowColor = marker.background;
            marker.shadowBlur = 10;
            markers.push(marker);
            symbolContainer.addControl(marker);
        }

        // Cercle interne
        const innerCircle = new GUI.Ellipse("innerCircle");
        innerCircle.width = "50px";
        innerCircle.height = "50px";
        innerCircle.thickness = 2;
        innerCircle.color = CURSED_COLORS.textDim;
        innerCircle.background = "transparent";
        symbolContainer.addControl(innerCircle);

        // Points sur cercle interne
        const innerMarkers = [];
        for (let i = 0; i < 3; i++) {
            const marker = new GUI.Ellipse(`innerMarker${i}`);
            marker.width = "6px";
            marker.height = "6px";
            marker.thickness = 0;
            marker.background = CURSED_COLORS.textDim;
            marker.shadowColor = CURSED_COLORS.primary;
            marker.shadowBlur = 8;
            innerMarkers.push(marker);
            symbolContainer.addControl(marker);
        }

        // Animation de rotation avec positionnement des marqueurs
        let angle = 0;
        const outerRadius = 36; // rayon pour placer les marqueurs externes
        const innerRadius = 21; // rayon pour placer les marqueurs internes

        this.scene.registerBeforeRender(() => {
            angle += 0.02;

            // Positionner les marqueurs externes en rotation
            markers.forEach((marker, i) => {
                const markerAngle = angle + (i * Math.PI / 2);
                marker.left = `${Math.cos(markerAngle) * outerRadius}px`;
                marker.top = `${Math.sin(markerAngle) * outerRadius}px`;
            });

            // Positionner les marqueurs internes en rotation inverse
            innerMarkers.forEach((marker, i) => {
                const markerAngle = -angle * 1.5 + (i * Math.PI * 2 / 3);
                marker.left = `${Math.cos(markerAngle) * innerRadius}px`;
                marker.top = `${Math.sin(markerAngle) * innerRadius}px`;
            });
        });
    }

    createBarDecoration() {
        const deco = new GUI.Ellipse("deco");
        deco.width = "12px";
        deco.height = "12px";
        deco.thickness = 2;
        deco.color = CURSED_COLORS.primary;
        deco.background = "rgba(139, 92, 246, 0.3)";
        deco.shadowColor = CURSED_COLORS.primary;
        deco.shadowBlur = 8;
        return deco;
    }

    animateEntry(element) {
        element.alpha = 0;
        element.scaleX = 0.9;
        element.scaleY = 0.9;

        let frame = 0;
        const duration = 30;
        
        const animationInterval = setInterval(() => {
            frame++;
            const progress = frame / duration;
            const eased = 1 - Math.pow(1 - progress, 3);
            
            element.alpha = eased;
            element.scaleX = 0.9 + (0.1 * eased);
            element.scaleY = 0.9 + (0.1 * eased);
            
            if (frame >= duration) {
                clearInterval(animationInterval);
            }
        }, 16);
    }

    async startLoading() {
        this.isLoading = true;
        
        try {
 
            // Créer la scène cible
            const targetSceneInstance = await this.loadTargetScene();

            await this.delay(500);
            
            // Transition vers la scène chargée
            this.sceneManager.switchToPreloaded(targetSceneInstance);
            
        } catch (error) {
            console.error("Erreur de chargement:", error);
            this.progressText.text = "Erreur !";
            this.progressText.color = CURSED_COLORS.secondary;
        }
    }

    updateProgress(progress, message) {
        this.progress = Math.min(100, Math.max(0, progress));
        
        this.progressText.text = message;
        
        this.percentText.text = `${Math.round(this.progress)}%`;
        
        const maxWidth = 396;
        this.progressBarFill.width = `${(this.progress / 100) * maxWidth}px`;
        
        if (this.progress > 80) {
            this.progressBarFill.shadowBlur = 20;
        }
    }

    async loadTargetScene() {
        // Importer dynamiquement la scène
        let SceneClass;
        
        switch (this.targetScene) {
            case 'FightScene':
                const module = await import('./FightScene.js');
                SceneClass = module.FightScene;
                break;
            default:
                throw new Error(`Scène inconnue: ${this.targetScene}`);
        }
        
        // Créer l'instance avec un callback de progression
        const sceneInstance = new SceneClass(
            this.engine,
            this.sceneManager,
            {
                ...this.targetParams,
                onLoadProgress: (progress, message) => {
                    this.updateProgress(progress, message);
                }
            }
        );
        
        // Attendre que la scène soit prête
        await sceneInstance.waitForReady();
        
        return sceneInstance;
    }


    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    render() {
        this.scene.render();
    }

    onDispose() {
        if (this.particleSystem) {
            this.particleSystem.dispose();
        }
        this.gui?.dispose();
        this.scene?.dispose();
    }
}
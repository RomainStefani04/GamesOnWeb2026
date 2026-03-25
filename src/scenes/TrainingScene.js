import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import { AIPlayer } from '../character/AIPlayer.js';
import { Arena } from '../arena/Arena.js';
import { FightCamera } from '../arena/FightCamera.js';
import { CombatSystem } from '../combat/CombatSystem.js';
import { TrainingManager } from '../ai/TrainingManager.js';

/**
 * TrainingScene — Scène d'entraînement avec panneaux rétractables.
 * 
 * 3 panneaux empilés dans un ScrollViewer à droite.
 * Chaque panneau a un header cliquable ▼/▶ pour ouvrir/fermer.
 * Tout est construit avec des StackPanels imbriqués (pas de positionnement absolu)
 * pour garantir que les clics fonctionnent correctement.
 */
export class TrainingScene {
    constructor(engine, sceneManager, assetManager, havokInstance, city, characterKey) {
        this.engine = engine;
        this.sceneManager = sceneManager;
        this.assetManager = assetManager;
        this.havokInstance = havokInstance;
        this.city = city;
        this.characterKey = characterKey;

        this.scene = null;
        this.advancedTexture = null;
        this.trainingManager = null;
        this.combatSystem = null;
        this.learner = null;
        this.sparring = null;

        this.statsTexts = {};
        this.rewardTexts = {};
        this.currentSpeed = 1;
        this.speedLabel = null;

        this.initScene();
    }

    initScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.havokPlugin = new BABYLON.HavokPlugin(true, this.havokInstance);
        this.scene.enablePhysics(
            new BABYLON.Vector3(0, -9.81, 0),
            this.havokPlugin
        );
    }

    setup() {
        this.fightCamera = new FightCamera(this.scene);
        this.arena = new Arena(this.scene, this.assetManager, this.city);
        this.createPlayers();

        this.combatSystem = new CombatSystem(this.learner, this.sparring);
        this.connectRewards();

        this.trainingManager = new TrainingManager({
            stepsPerFrame: 1,
            maxEpisodeTime: 30,
            sparringSyncFreq: 20,
            simulationDt: 1 / 60
        });

        const fakeMatchManager = { currentTime: 30, timerAccumulator: 0 };
        this.trainingManager.init(this.learner, this.sparring, fakeMatchManager);
        this.learner.initAI(this.sparring, fakeMatchManager);
        this.sparring.initAI(this.learner, fakeMatchManager);

        this.createUI();
        window.trainingManager = this.trainingManager;
        this.trainingManager.start();
    }

    createPlayers() {
        const clone1 = this.assetManager.cloneCharacterByKey(this.characterKey);
        this.learner = new AIPlayer(
            this.scene, "learner", this.characterKey,
            clone1?.mesh, clone1?.animationGroups,
            {
                epsilon: 1.0, epsilonMin: 0.05, epsilonDecay: 0.9995,
                decisionInterval: 0.1, batchSize: 32,
                targetUpdateFreq: 1000, trainFreq: 4,
                bufferCapacity: 50000, gamma: 0.99, learningRate: 0.001
            }
        );
        this.learner.setPosition(new BABYLON.Vector3(0, 0, -2));

        const clone2 = this.assetManager.cloneCharacterByKey(this.characterKey);
        this.sparring = new AIPlayer(
            this.scene, "sparring", this.characterKey,
            clone2?.mesh, clone2?.animationGroups,
            {
                epsilon: 0.3, epsilonMin: 0.1, epsilonDecay: 0.9999,
                decisionInterval: 0.1
            }
        );
        this.sparring.setPosition(new BABYLON.Vector3(0, 0, 2));
    }

    connectRewards() {
        const learnerReward = this.learner.getRewardCalculator();
        const sparringReward = this.sparring.getRewardCalculator();

        this.combatSystem.onCombatEvent.add((event) => {
            switch (event.type) {
                case 'hit':
                    if (event.attacker.name === "learner") {
                        learnerReward.onDealDamage(event.damage, event.defender.maxHealth);
                        sparringReward.onTakeDamage(event.damage, event.defender.maxHealth);
                    } else {
                        sparringReward.onDealDamage(event.damage, event.defender.maxHealth);
                        learnerReward.onTakeDamage(event.damage, this.learner.maxHealth);
                    }
                    break;
                case 'block':
                    if (event.defender.name === "learner") learnerReward.onSuccessfulBlock();
                    else sparringReward.onSuccessfulBlock();
                    break;
                case 'ko':
                    if (event.attacker.name === "learner") {
                        learnerReward.onKnockoutOpponent();
                        sparringReward.onGetKnockedOut();
                    } else {
                        sparringReward.onKnockoutOpponent();
                        learnerReward.onGetKnockedOut();
                    }
                    break;
            }
        });
    }

    // ==========================================
    // UI
    // ==========================================

    createUI() {
        this.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("TrainingUI");

        // ScrollViewer pour tout le panneau droit
        const scroll = new GUI.ScrollViewer("scroll");
        scroll.width = "290px";
        scroll.height = "100%";
        scroll.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        scroll.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        scroll.thickness = 0;
        scroll.background = "transparent";
        scroll.barSize = 5;
        scroll.barColor = "#8b5cf680";
        scroll.barBackground = "transparent";
        this.advancedTexture.addControl(scroll);

        // Colonne empilée
        const column = new GUI.StackPanel("col");
        column.isVertical = true;
        column.width = "278px";
        column.spacing = 6;
        column.paddingTop = "8px";
        column.paddingBottom = "8px";
        scroll.addControl(column);

        this._buildStatsPanel(column);
        this._buildControlPanel(column);
        this._buildRewardPanel(column);
    }

    // ==========================================
    // PANNEAU STATS
    // ==========================================

    _buildStatsPanel(parent) {
        const body = this._collapsible(parent, "TRAINING STATS", true);

        const stats = [
            "episode", "epsilon", "avgReward", "lastReward",
            "winRate", "drawRate", "loss", "buffer", "steps", "speed"
        ];
        const labels = [
            "Épisode", "Epsilon", "Reward (moy)", "Reward (épisode)",
            "Win Rate", "Draw Rate", "Loss", "Buffer", "Steps total", "Vitesse"
        ];

        stats.forEach((key, i) => {
            this.statsTexts[key] = this._kvRow(body, labels[i], "—", "#e8d5f2");
        });
    }

    // ==========================================
    // PANNEAU CONTRÔLES
    // ==========================================

    _buildControlPanel(parent) {
        const body = this._collapsible(parent, "CONTRÔLES", true);

        // Play / Pause
        const row1 = this._hStack(body);
        row1.addControl(this._btn("▶ Play", "#22c55e", 115, () => this.trainingManager.resume()));
        row1.addControl(this._btn("⏸ Pause", "#ef4444", 115, () => this.trainingManager.pause()));

        this._sep(body);
        this._smallTitle(body, "VITESSE");

        const row2 = this._hStack(body);
        [1, 5, 10, 25].forEach(s => {
            row2.addControl(this._btn(`${s}x`, "#6366f1", 53, () => {
                this.currentSpeed = s;
                this.trainingManager.setSpeed(s);
            }));
        });

        this._sep(body);
        this._smallTitle(body, "MODÈLE");

        const row3 = this._hStack(body);
        row3.addControl(this._btn("Save", "#8b5cf6", 72, async () => {
            await this.trainingManager.saveModel();
            console.log("Modèle sauvegardé !");
        }));
        row3.addControl(this._btn("Load", "#8b5cf6", 72, async () => {
            const ok = await this.trainingManager.loadModel();
            console.log(ok ? "Modèle chargé !" : "Aucun modèle trouvé");
        }));
        row3.addControl(this._btn("Export", "#4c1d95", 72, async () => {
            await this.trainingManager.downloadModel();
        }));

        this._sep(body);

        const row4 = this._hStack(body);
        row4.addControl(this._btn("Retour Menu", "#4c1d95", 240, () => {
            this.trainingManager.stop();
            this.sceneManager.switchTo('MenuScene');
        }));
    }

    // ==========================================
    // PANNEAU REWARDS
    // ==========================================

    _buildRewardPanel(parent) {
        const body = this._collapsible(parent, "REWARD CONFIG", false);

        const keys = [
            ["dealDamageMultiplier", "Deal Damage"],
            ["takeDamageMultiplier", "Take Damage"],
            ["knockoutOpponent", "KO Opponent"],
            ["getKnockedOut", "Get KO'd"],
            ["draw", "Draw (égalité)"],
            ["winByHp", "Win by HP"],
            ["loseByHp", "Lose by HP"],
            ["successfulBlock", "Block Success"],
            ["stepPenalty", "Step Penalty"],
            ["proximityBonus", "Proximity Bonus"],
        ];

        keys.forEach(([key, label]) => {
            this.rewardTexts[key] = this._kvRow(body, label, "—", "#fbbf24");
        });

        this._sep(body);

        const note = new GUI.TextBlock();
        note.text = "Console: trainingManager.setRewardConfig({...})";
        note.color = "#6b7280";
        note.fontSize = 9;
        note.height = "18px";
        body.addControl(note);
    }

    // ==========================================
    // COMPOSANTS UI
    // ==========================================

    /**
     * Crée un panneau rétractable. Retourne le body (StackPanel).
     */
    _collapsible(parent, title, startOpen) {
        // Header
        const header = new GUI.Rectangle();
        header.width = "270px";
        header.height = "32px";
        header.cornerRadius = 6;
        header.thickness = 2;
        header.color = "#8b5cf6";
        header.background = "rgba(139, 92, 246, 0.25)";
        parent.addControl(header);

        const label = new GUI.TextBlock();
        label.text = `${startOpen ? '▼' : '▶'} ${title}`;
        label.color = "#e8d5f2";
        label.fontSize = 11;
        label.fontFamily = "'Orbitron', sans-serif";
        label.fontWeight = "bold";
        label.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        label.paddingLeft = "10px";
        header.addControl(label);

        // Body wrapper (Rectangle pour le fond)
        const wrapper = new GUI.Rectangle();
        wrapper.width = "270px";
        wrapper.adaptHeightToChildren = true;
        wrapper.cornerRadius = 6;
        wrapper.thickness = 1;
        wrapper.color = "#4c1d95";
        wrapper.background = "rgba(10, 6, 20, 0.85)";
        wrapper.isVisible = startOpen;
        parent.addControl(wrapper);

        // Body content (StackPanel)
        const body = new GUI.StackPanel();
        body.isVertical = true;
        body.width = "260px";
        body.spacing = 2;
        body.paddingTop = "8px";
        body.paddingBottom = "8px";
        wrapper.addControl(body);

        // Toggle
        let isOpen = startOpen;
        header.onPointerEnterObservable.add(() => { header.background = "rgba(139, 92, 246, 0.45)"; });
        header.onPointerOutObservable.add(() => { header.background = "rgba(139, 92, 246, 0.25)"; });
        header.onPointerClickObservable.add(() => {
            isOpen = !isOpen;
            wrapper.isVisible = isOpen;
            label.text = `${isOpen ? '▼' : '▶'} ${title}`;
        });

        return body;
    }

    /**
     * Ligne clé-valeur. Retourne le TextBlock de la valeur.
     */
    _kvRow(parent, labelStr, defaultVal, valColor) {
        const row = new GUI.StackPanel();
        row.isVertical = false;
        row.height = "20px";
        row.width = "258px";
        parent.addControl(row);

        const lbl = new GUI.TextBlock();
        lbl.text = labelStr;
        lbl.color = "#9ca3af";
        lbl.fontSize = 11;
        lbl.width = "140px";
        lbl.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        lbl.paddingLeft = "6px";
        row.addControl(lbl);

        const val = new GUI.TextBlock();
        val.text = defaultVal;
        val.color = valColor;
        val.fontSize = 11;
        val.fontWeight = "bold";
        val.width = "118px";
        val.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        val.paddingRight = "6px";
        row.addControl(val);

        return val;
    }

    /** Ligne horizontale de boutons */
    _hStack(parent) {
        const row = new GUI.StackPanel();
        row.isVertical = false;
        row.height = "34px";
        row.width = "258px";
        row.spacing = 6;
        parent.addControl(row);
        return row;
    }

    /** Séparateur */
    _sep(parent) {
        const s = new GUI.Rectangle();
        s.width = "240px";
        s.height = "1px";
        s.thickness = 0;
        s.background = "#4c1d9540";
        parent.addControl(s);
    }

    /** Petit titre de section */
    _smallTitle(parent, text) {
        const t = new GUI.TextBlock();
        t.text = text;
        t.color = "#a78bfa";
        t.fontSize = 10;
        t.fontFamily = "'Orbitron', sans-serif";
        t.fontWeight = "bold";
        t.height = "16px";
        t.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        t.paddingLeft = "6px";
        parent.addControl(t);
    }

    /** Bouton */
    _btn(text, color, width, onClick) {
        const btn = new GUI.Rectangle(`b_${Math.random().toString(36).slice(2, 7)}`);
        btn.width = `${width}px`;
        btn.height = "28px";
        btn.cornerRadius = 5;
        btn.thickness = 1;
        btn.color = color;
        btn.background = `${color}20`;

        const lbl = new GUI.TextBlock();
        lbl.text = text;
        lbl.color = "#e8d5f2";
        lbl.fontSize = 10;
        lbl.fontFamily = "'Orbitron', sans-serif";
        btn.addControl(lbl);

        btn.onPointerEnterObservable.add(() => { btn.background = `${color}50`; });
        btn.onPointerOutObservable.add(() => { btn.background = `${color}20`; });
        btn.onPointerClickObservable.add(onClick);

        return btn;
    }

    // ==========================================
    // UPDATE
    // ==========================================

    updateUI() {
        if (!this.trainingManager) return;
        const stats = this.trainingManager.getStats();

        if (this.statsTexts.episode) this.statsTexts.episode.text = `${stats.episodeCount}`;
        if (this.statsTexts.epsilon) this.statsTexts.epsilon.text = `${stats.epsilon.toFixed(4)}`;
        if (this.statsTexts.avgReward) this.statsTexts.avgReward.text = `${stats.avgReward.toFixed(2)}`;
        if (this.statsTexts.lastReward) this.statsTexts.lastReward.text = `${stats.lastReward.toFixed(2)}`;
        if (this.statsTexts.winRate) this.statsTexts.winRate.text = `${(stats.winRate * 100).toFixed(1)}%`;
        if (this.statsTexts.drawRate) this.statsTexts.drawRate.text = `${(stats.drawRate * 100).toFixed(1)}%`;
        if (this.statsTexts.loss) this.statsTexts.loss.text = `${stats.avgLoss.toFixed(6)}`;
        if (this.statsTexts.buffer) this.statsTexts.buffer.text = `${stats.bufferSize}`;
        if (this.statsTexts.steps) this.statsTexts.steps.text = `${stats.totalSteps}`;
        if (this.statsTexts.speed) this.statsTexts.speed.text = `${this.currentSpeed}x`;

        const rc = this.trainingManager.getRewardConfig();
        for (const [key, tb] of Object.entries(this.rewardTexts)) {
            if (rc[key] !== undefined) tb.text = `${rc[key]}`;
        }
    }

    render() {
        if (!this.scene) return;
        this.trainingManager?.update();
        if (this.scene.getFrameId() % 10 === 0) this.updateUI();
        this.scene.render();
    }

    onDispose() {
        this.trainingManager?.dispose();
        this.learner?.dispose();
        this.sparring?.dispose();
        this.advancedTexture?.dispose();
        this.scene?.dispose();
    }
}
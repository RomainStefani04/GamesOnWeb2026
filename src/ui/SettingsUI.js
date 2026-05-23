import * as GUI from '@babylonjs/gui';
import { SettingsManager } from '../core/SettingsManager';
import { eventBus } from '../core/EventBus';
import { GamepadMenuNavigator } from '../core/GamepadMenuNavigator';

const C = {
    bg:        "rgba(10, 10, 15, 0.98)",
    border:    "#8b5cf6",
    borderHov: "#a78bfa",
    text:      "#e8d5f2",
    accent:    "#a78bfa",
    muted:     "#9ca3af",
    btnBg:     "#8b5cf620",
    btnBgHov:  "#8b5cf650",
    danger:    "#ef4444",
    success:   "#10b981"
};

export class SettingsUI {
    constructor(advancedTexture, inputManager, onQuit) {
        this.advancedTexture = advancedTexture;
        this.inputManager    = inputManager;
        this.onQuit          = onQuit;
        this.currentTab      = "main"; // main, audio_video, controls_p1, controls_p2
        this.gamepadNav = new GamepadMenuNavigator(this.inputManager);

        this._createContainers();
        
        // On écoute le changement de mode pour rafraîchir l'UI dynamiquement
        window.addEventListener('inputModeChanged', () => {
            if (this.panel.isVisible) this._build();
        });
    }

    _createContainers() {
        this.overlay = new GUI.Rectangle("settingsOverlay");
        this.overlay.width = "100%"; this.overlay.height = "100%";
        this.overlay.background = "rgba(0,0,0,0.7)";
        this.overlay.thickness = 0; this.overlay.isVisible = false;
        this.advancedTexture.addControl(this.overlay);

        this.panel = new GUI.Rectangle("settingsPanel");
        this.panel.width = "600px"; this.panel.height = "620px";
        this.panel.cornerRadius = 20; this.panel.thickness = 2;
        this.panel.color = C.border; this.panel.background = C.bg;
        this.panel.shadowBlur = 30; this.panel.shadowColor = "black";
        this.panel.isVisible = false;
        this.advancedTexture.addControl(this.panel);
    }

    _build() {
        this.panel.clearControls();
        const stack = new GUI.StackPanel();
        stack.spacing = 15;
        stack.paddingTop = stack.paddingBottom = "30px";
        this.panel.addControl(stack);

        // --- HEADER : ÉTAT DES JOUEURS ---
        this._buildStatusHeader(stack);
        this._addDivider(stack);

        // --- CONTENU DYNAMIQUE SELON L'ONGLET ---
        if (this.currentTab === "main") {
            this._buildMainMenu(stack);
        } else if (this.currentTab === "audio_video") {
            this._buildAudioVideoMenu(stack);
        } else if (this.currentTab.startsWith("controls")) {
            const pId = this.currentTab === "controls_p1" ? "player1" : "player2";
            this._buildControlsMenu(stack, pId);
        }

        // --- BOUTON RETOUR / QUITTER ---
        this._addDivider(stack);
        const footerBtn = (this.currentTab === "main") 
            ? this._makeBtn("FERMER", C.danger, () => { eventBus.emit('ui:back');this.close(); })
            : this._makeBtn("RETOUR", C.muted, () => { eventBus.emit('ui:back'); this.currentTab = "main"; this._build(); });
        
        this._registerGamepadItems(stack);
        stack.addControl(footerBtn);
    }

    _registerGamepadItems(stack) {
        // Récupère les Rectangle enfants du stack (= les boutons)
        const btns = stack.children.filter(c => c instanceof GUI.Rectangle && c.onPointerClickObservable);
        this.gamepadNav.setItems(btns.map(el => ({
            element: el,
            onConfirm: () => el.onPointerClickObservable.notifyObservers(),
            onBack: () => { eventBus.emit('ui:back'); this.currentTab = "main"; this._build(); }
        })));
    }

    tick() { this.gamepadNav.tick(); }

    _buildStatusHeader(stack) {
        const header = new GUI.StackPanel();
        header.isVertical = false;
        header.height = "40px";
        
        const createIndicator = (player, name) => {
            const mode = SettingsManager.controlModes[player];
            const color = mode === "gamepad" ? C.success : C.accent;
            const txt = new GUI.TextBlock();
            txt.text = `${name}: ${mode === "gamepad" ? "MANETTE" : "CLAVIER"}`;
            txt.color = color;
            txt.fontSize = 12;
            txt.width = "250px";
            txt.fontFamily = "Orbitron";
            return txt;
        };

        header.addControl(createIndicator("player1", "P1"));
        header.addControl(createIndicator("player2", "P2"));
        stack.addControl(header);
    }

    _buildMainMenu(stack) {
        this._addJpTitle(stack, "PARAMÈTRES GÉNÉRAUX");
        
        stack.addControl(this._makeBtn("🔊︎ SON & VIDÉO", C.border, () => { eventBus.emit('ui:select'); this.currentTab = "audio_video"; this._build(); }));
        stack.addControl(this._makeBtn("CONTRÔLES JOUEUR 1", C.border, () => { eventBus.emit('ui:select'); this.currentTab = "controls_p1"; this._build(); }));
        stack.addControl(this._makeBtn("CONTRÔLES JOUEUR 2", C.border, () => { eventBus.emit('ui:select'); this.currentTab = "controls_p2"; this._build(); }));
    }

    _buildAudioVideoMenu(stack) {
        this._addJpTitle(stack, "SON & VIDÉO");

        // Volume
        const volLabel = this._makeLabel(`VOLUME GLOBAL : ${Math.round(SettingsManager.volume * 100)}%`);
        stack.addControl(volLabel);
        const slider = new GUI.Slider();
        slider.minimum = 0; slider.maximum = 1; slider.value = SettingsManager.volume;
        slider.height = "20px"; slider.width = "80%";
        slider.color = C.accent; slider.background = "#333";
        slider.onValueChangedObservable.add(v => {
            SettingsManager.volume = v;
            volLabel.text = `VOLUME GLOBAL : ${Math.round(v * 100)}%`;
            SettingsManager.save();
            eventBus.emit('settings:volumeChanged', v);
        });
        stack.addControl(slider);

        // FPS
        stack.addControl(this._makeLabel("PERFORMANCES"));
        const fpsBtn = this._makeBtn(`FPS CIBLE : ${SettingsManager.targetFPS}`, C.accent, () => {
            SettingsManager.targetFPS = SettingsManager.targetFPS === 60 ? 120 : 60;
            fpsBtn.children[0].text = `FPS CIBLE : ${SettingsManager.targetFPS}`;
            SettingsManager.save();
        });
        stack.addControl(fpsBtn);
    }

    _buildControlsMenu(stack, playerId) {
        const isGamepad = SettingsManager.controlModes[playerId] === "gamepad";
        this._addJpTitle(stack, `TOUCHES : ${playerId.toUpperCase()}`);

        if (isGamepad) {
            const info = this._makeLabel("MODE MANETTE ACTIF");
            info.color = C.success;
            stack.addControl(info);
            
            // Affichage du mapping fixe pour la manette
            const grid = new GUI.TextBlock();
            grid.text = "A: Kick Léger | B: Kick Lourd\nX: Jab | Y: Cross\nL2: Balayage | R2: Fireball\nStick/Flèches: Déplacement";
            grid.color = C.muted;
            grid.fontSize = 14;
            grid.height = "150px";
            stack.addControl(grid);
        } else {
            // Liste scrollable des touches clavier (ton code existant)
            const scroll = new GUI.ScrollViewer();
            scroll.width = "90%"; scroll.height = "300px"; scroll.thickness = 0;
            const innerStack = new GUI.StackPanel();
            scroll.addControl(innerStack);
            
            const actions = { moveLeft: "Gauche", moveRight: "Droite", jump: "Saut", block: "Garde", jab: "Jab", cross: "Cross", light_kick: "Kick L.", heavy_kick: "Kick H.", leg_sweep: "Balayage", fireball: "Fireball" };
            
            for (const [action, label] of Object.entries(actions)) {
                this._addRebindRow(innerStack, playerId, action, label);
            }
            stack.addControl(scroll);
        }
    }

    // --- HELPERS (Re-stylisés) ---
    _makeBtn(text, color, onClick) {
        const btn = new GUI.Rectangle();
        btn.width = "320px"; btn.height = "45px";
        btn.cornerRadius = 10; btn.thickness = 2;
        btn.color = color; btn.background = `${color}15`;
        btn.pointerEnterAnimation = () => { btn.background = `${color}40`; btn.scaleX = 1.05; eventBus.emit('ui:hoover'); };
        btn.pointerOutAnimation = () => { btn.background = `${color}15`; btn.scaleX = 1.00; };
        
        const txt = new GUI.TextBlock();
        txt.text = text; txt.color = "white"; txt.fontFamily = "Orbitron"; txt.fontSize = 14;
        btn.addControl(txt);

        btn.onPointerClickObservable.add(onClick);
        btn.onPointerEnterObservable.add(btn.pointerEnterAnimation);
        btn.onPointerOutObservable.add(btn.pointerOutAnimation);
        return btn;
    }

    _addRebindRow(stack, pId, action, label) {
        const row = new GUI.StackPanel(); row.isVertical = false; row.height = "40px";
        const lbl = new GUI.TextBlock(); lbl.text = label; lbl.width = "150px"; lbl.color = C.muted; lbl.textHorizontalAlignment = 0; lbl.fontSize = 12;
        
        const currentKey = SettingsManager.bindings[pId][action];
        const btn = this._makeBtn(currentKey, C.border, async () => {
            btn.children[0].text = "...";
            const newKey = await this.inputManager.captureNextKey();
            SettingsManager.bindings[pId][action] = newKey;
            SettingsManager.save();
            btn.children[0].text = newKey;
        });
        btn.width = "150px"; btn.height = "30px";
        
        row.addControl(lbl); row.addControl(btn);
        stack.addControl(row);
    }

    _addJpTitle(stack, text) {
        const t = new GUI.TextBlock(); t.text = text; t.height = "40px"; t.color = "white"; t.fontSize = 20; t.fontWeight = "bold"; t.fontFamily = "Orbitron";
        stack.addControl(t);
    }

    _addDivider(stack) {
        const rect = new GUI.Rectangle(); rect.height = "2px"; rect.width = "100%"; rect.background = C.border; rect.thickness = 0; rect.alpha = 0.3;
        stack.addControl(rect);
    }

    _makeLabel(text) {
        const t = new GUI.TextBlock(); t.text = text; t.height = "30px"; t.color = C.text; t.fontSize = 14; t.fontFamily = "Orbitron";
        return t;
    }

    open() {
        this.currentTab = "main";
        this._build();
        this.overlay.isVisible = this.panel.isVisible = true;
    }

    close() { this.overlay.isVisible = this.panel.isVisible = false; }
}
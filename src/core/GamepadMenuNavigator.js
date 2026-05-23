export class GamepadMenuNavigator {
    constructor(inputManager) {
        this.inputManager = inputManager;
        this.items = [];       // [{ element: GUIControl, onConfirm: fn, onBack?: fn }]
        this.focusedIndex = 0;
        this._cooldown = 0;
        this.COOLDOWN_FRAMES = 14;
        this.FOCUS_COLOR = "#a78bfa";
        this.FOCUS_SCALE = 1.07;
    }

    // Appeler à chaque changement de panneau pour réinitialiser la liste des items
    setItems(items) {
        // Dé-focus tout
        this.items.forEach(i => this._setFocus(i.element, false));
        this.items = items;
        this.focusedIndex = 0;
        if (this.items.length) this._setFocus(this.items[0].element, true);
    }

    tick() {
        if (!this.items.length) return;
        if (this._cooldown > 0) { this._cooldown--; return; }

        // Prend la première manette connectée (P1 contrôle les menus)
        const gp = this.inputManager.gamepads.find(g => g?.browserGamepad);
        if (!gp) return;

        const btn = gp.browserGamepad.buttons;
        const ax  = gp.browserGamepad.axes;

        const down    = btn[13]?.pressed || ax?.[1] > 0.5;
        const up      = btn[12]?.pressed || ax?.[1] < -0.5;
        const confirm = btn[0]?.pressed;   // A / Cross
        const back    = btn[1]?.pressed;   // B / Circle

        if (down || up) {
            this._setFocus(this.items[this.focusedIndex].element, false);
            this.focusedIndex = down
                ? (this.focusedIndex + 1) % this.items.length
                : (this.focusedIndex - 1 + this.items.length) % this.items.length;
            this._setFocus(this.items[this.focusedIndex].element, true);
            this._cooldown = this.COOLDOWN_FRAMES;
        } else if (confirm) {
            this.items[this.focusedIndex]?.onConfirm();
            this._cooldown = this.COOLDOWN_FRAMES;
        } else if (back) {
            this.items[this.focusedIndex]?.onBack?.();
            this._cooldown = this.COOLDOWN_FRAMES;
        }
    }

    _setFocus(el, focused) {
        if (!el) return;
        el._gamepadFocused = focused;
        if (focused) {
            el._origColor   = el._origColor || el.color;
            el._origBg      = el._origBg    || el.background;
            el.color        = this.FOCUS_COLOR;
            el.scaleX       = this.FOCUS_SCALE;
            el.scaleY       = this.FOCUS_SCALE;
        } else {
            el.color  = el._origColor || el.color;
            el.scaleX = 1;
            el.scaleY = 1;
        }
    }
}
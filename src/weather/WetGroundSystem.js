import * as BABYLON from '@babylonjs/core';

/**
 * WetGroundSystem — Sol mouillé avec ondulations dynamiques.
 *
 * Deux composantes :
 *   1. PBRMaterial        → asphalte mouillé (très faible rugosité, forte réflectivité)
 *   2. DynamicTexture     → utilisée comme bump map, dessinée en canvas 2D chaque frame
 *                           pour simuler des cercles concentriques (ondulations / ripples)
 *
 * Système de ripples :
 *   - Pool de max N ripples simultanés (FIFO si dépassé)
 *   - Chaque ripple : {u, v, age, maxAge, maxRadius}
 *   - Dessin : anneau expandant avec opacité décroissante et double ring déphasé
 *   - Conversion monde → UV : u = (x + halfW) / width
 */
export class WetGroundSystem {
    /**
     * @param {BABYLON.Scene}       scene
     * @param {BABYLON.AbstractMesh} groundMesh       - Mesh du sol à modifier
     * @param {Object}  [options]
     * @param {number}  [options.textureSize=512]     - Résolution de la texture de ripples
     * @param {number}  [options.maxRipples=24]       - Pool max de ripples simultanés
     * @param {number}  [options.groundWidth=20]      - Largeur du sol (m)
     * @param {number}  [options.rippleDuration=0.9]  - Durée d'une ondulation (s)
     * @param {number}  [options.rippleMaxRadius=55]  - Rayon max en pixels texture
     */
    constructor(scene, groundMesh, options = {}) {
        this.scene      = scene;
        this.groundMesh = groundMesh;

        this._texSize      = options.textureSize   ?? 512;
        this._maxRipples   = options.maxRipples    ?? 24;
        this._groundWidth  = options.groundWidth   ?? 20;
        this._rippleDur    = options.rippleDuration ?? 0.9;
        this._rippleRad    = options.rippleMaxRadius ?? 55;
        this._mirrorTexture   = null; // Miroir pour les réflexions dynamiques (personnages + arène)

        // Pool de ripples actifs
        // Chaque entrée : { u, v, age, maxAge, maxRadius }
        this._ripples = [];

        // Heure du dernier dessin (pour le deltaTime interne)
        this._lastRenderTime = performance.now();

        this._initMaterial();
        this._initRippleTexture();
        this._startRenderLoop();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  INITIALISATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * PBRMaterial configuré pour simuler un asphalte mouillé :
     *
     *   Roughness  → 0.04  : surface quasi-miroir (eau stagnante)
     *   Metallic   → 0.0   : non-métallique (asphalte), mais IOR élevé
     *   environmentIntensity → les lumières d'arène se reflètent
     *   subSurface         → léger bleu profond (épaisseur d'eau ~2mm)
     */
    _initMaterial() {
        this._material = new BABYLON.PBRMaterial("wetMat", this.scene);
        this._material.albedoColor = new BABYLON.Color3(0.05, 0.05, 0.05); // Sol très sombre
        this._material.roughness = 0.1;
        this._material.metallic = 0.5;

        // Création du miroir
        this._mirrorTexture = new BABYLON.MirrorTexture("mirror", 512, this.scene, true);
        this._mirrorTexture.mirrorPlane = new BABYLON.Plane(0, -1, 0, 0.01); // Reflète sur l'axe Y
        this._mirrorTexture.blurKernel = 16; // Flou pour simuler l'eau légèrement agitée
        this._mirrorTexture.renderList = []; // On remplira cette liste avec les persos et l'arène
        //console.log("Miroir créé :", this._mirrorTexture);
        
        // On applique le miroir sur la réflexion
        this._material.reflectionTexture = this._mirrorTexture;
        this._material.reflectionFresnelParameters = new BABYLON.FresnelParameters();
        this._material.reflectionFresnelParameters.bias = 0.02;

        // On mixe avec tes ripples (la texture dynamique sert de Bump Map)
        this._material.bumpTexture = this._rippleTex;
        
        this.groundMesh.material = this._material;
    }

    /**
     * Ajoute un mesh ou un tableau de meshes à la liste des reflets
     * @param {BABYLON.AbstractMesh | BABYLON.AbstractMesh[]} meshes 
     */
    addMeshToReflections(meshes) {
        //console.log(this._mirrorTexture);
        if (!this._mirrorTexture || !this._mirrorTexture.renderList) return;

        if (Array.isArray(meshes)) {
            meshes.forEach(m => {
                if (m) this._mirrorTexture.renderList.push(m);
            });
        } else {
            if (meshes) this._mirrorTexture.renderList.push(meshes);
        }

    }

    /**
     * DynamicTexture utilisée comme normal map (bump map) :
     *   - Fond neutre = (128, 128, 255) en RGB → normale verticale parfaite
     *   - Les ripples dessinent des anneaux colorés qui perturbent les normales
     *     → l'éclairage perçu simule des vagues concentriques
     */
    _initRippleTexture() {
        this._rippleTex = new BABYLON.DynamicTexture(
            'rippleTex',
            { width: this._texSize, height: this._texSize },
            this.scene,
            false   // pas de mipmaps : les détails fins d'ondulation doivent rester nets
        );

        // Fond neutre (normale plate, pas de perturbation)
        this._clearCanvas();

        // Branchée en tant que bump map → perturbe les normales de surface
        this._material.bumpTexture = this._rippleTex;
        this._material.bumpTexture.level = 1.8;    // intensité de la perturbation

        // Évite l'inversion Y habituelle des normal maps importées
        this._material.invertNormalMapX = false;
        this._material.invertNormalMapY = false;
    }

    _clearCanvas() {
        const ctx = this._rippleTex.getContext();
        // rgb(128,128,255) = normal map neutre (Nx=0, Ny=0, Nz=1)
        ctx.fillStyle = 'rgb(128, 128, 255)';
        ctx.fillRect(0, 0, this._texSize, this._texSize);
        this._rippleTex.update();
    }


    /**
     * @param {BABYLON.Vector3} worldPos - Point d'impact au sol
     * @param {number} [scale=1]         - Multiplicateur de taille de base
     * @param {number} [speed=0]         - Vitesse d'impact en m/s (0 = comportement par défaut)
     */
    addRipple(worldPos, scale = 1.0, speed = 0) {
        const half = this._groundWidth / 2;

        const u = Math.max(0, Math.min(1, (worldPos.x + half) / this._groundWidth));
        const v = Math.max(0, Math.min(1, (half - worldPos.z) / this._groundWidth));

        // Facteur vitesse : normalisé sur une vitesse de référence (ex: 5 m/s = impact "normal")
        // En dessous de la ref → facteur < 1, au dessus → facteur > 1, plafonné à 3×
        const SPEED_REF = 5.0;        // m/s considérée comme "normale"
        const SPEED_MAX_FACTOR = 3.0; // multiplicateur maximum autorisé
        const speedFactor = speed > 0
            ? Math.min(speed / SPEED_REF, SPEED_MAX_FACTOR)
            : 1.0;

        if (this._ripples.length >= this._maxRipples) {
            this._ripples.shift();
        }

        this._ripples.push({
            u,
            v,
            age:       0,
            maxAge:    this._rippleDur * (0.8 + Math.random() * 0.4) * Math.sqrt(speedFactor), // durée ∝ √vitesse
            maxRadius: this._rippleRad * scale * speedFactor                                    // rayon ∝ vitesse
        });
    }

    /**
     * Ajoute plusieurs ripples autour d'un point (simulation de grosses gouttes).
     * Utile pour l'effet "flaque" sous les pieds des personnages.
     */
    addSplashPattern(worldPos, count = 4, spreadRadius = 0.3) {
        this.addRipple(worldPos, 1.0);
        for (let i = 0; i < count - 1; i++) {
            const angle  = (i / (count - 1)) * Math.PI * 2;
            const offset = new BABYLON.Vector3(
                Math.cos(angle) * spreadRadius,
                0,
                Math.sin(angle) * spreadRadius
            );
            this.addRipple(worldPos.add(offset), 0.6);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  RENDU DES RIPPLES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Mise à jour et dessin des ripples sur la DynamicTexture.
     *
     * Mathématique par ripple :
     *   progress p = age / maxAge                  ∈ [0, 1]
     *   radius   r = maxRadius × p                 → croissance linéaire
     *   alpha    α = (1 - p)²                      → décroissance quadratique (smooth)
     *
     * Deux anneaux concentriques déphasés :
     *   Ring 1 : r  (bord externe, plus opaque)
     *   Ring 2 : r × 0.55 (bord interne, retardé → onde secondaire)
     *
     * La couleur des anneaux décale légèrement les canaux R/G pour
     * simuler une perturbation des normales X/Y de la surface.
     *
     * @param {number} deltaTime - Temps écoulé depuis la dernière frame (s)
     */
    _updateRipples(deltaTime) {
        if (this._ripples.length === 0) return;

        const ctx  = this._rippleTex.getContext();
        const size = this._texSize;

        // ── Réinitialisation du canvas ──────────────────────────────────────
        ctx.fillStyle = 'rgb(128, 128, 255)';
        ctx.fillRect(0, 0, size, size);

        // ── Dessin de chaque ripple actif ───────────────────────────────────
        this._ripples = this._ripples.filter(r => {
            r.age += deltaTime;
            if (r.age >= r.maxAge) return false;  // ripple expiré → supprimé

            const p      = r.age / r.maxAge;          // progression ∈ [0, 1]
            const radius = r.maxRadius * p;            // rayon croissant
            const alpha  = (1 - p) * (1 - p);         // opacité quadratique décroissante

            // Coordonnées pixel dans la texture
            const px = r.u * size;
            const py = r.v * size;

            // Anneau externe — composante "bleue" → normale Z (élévation)
            this._drawRippleRing(ctx, px, py, radius, alpha,
                `rgba(80, 120, 255, ${alpha * 0.7})`, 3.5);

            // Anneau interne déphasé — onde secondaire (réflexion sur le bord)
            if (radius > 12) {
                this._drawRippleRing(ctx, px, py, radius * 0.55, alpha * 0.5,
                    `rgba(100, 150, 255, ${alpha * 0.4})`, 2.0);
            }

            // Speckle central (impact initial) — disparaît vite
            if (p < 0.2) {
                const centerAlpha = (0.2 - p) / 0.2;
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(160, 200, 255, ${centerAlpha * 0.6})`;
                ctx.fill();
            }

            return true;
        });

        this._rippleTex.update();
    }

    /** Dessine un seul anneau circulaire sur le canvas */
    _drawRippleRing(ctx, cx, cy, radius, alpha, color, lineWidth) {
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0.5, radius), 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth   = lineWidth;
        ctx.stroke();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  RENDER LOOP
    // ═══════════════════════════════════════════════════════════════════════

    _startRenderLoop() {
        this._renderObserver = this.scene.onBeforeRenderObservable.add(() => {
            const now       = performance.now();
            const deltaTime = (now - this._lastRenderTime) / 1000;
            this._lastRenderTime = now;
            this._updateRipples(deltaTime);
        });
    }

    // ── Accesseurs ──────────────────────────────────────────────────────────

    /** Ajuste la rugosité pour moduler l'effet mouillé (0 = miroir, 1 = sec) */
    setWetness(factor) {
        const f = Math.max(0, Math.min(1, factor));
        this._material.roughness = 0.04 + f * 0.8;
        this._material.environmentIntensity = 1.8 - f * 1.2;
    }

    dispose() {
        this.scene.onBeforeRenderObservable.remove(this._renderObserver);
        this._rippleTex?.dispose();
        this._material?.dispose();
    }
}

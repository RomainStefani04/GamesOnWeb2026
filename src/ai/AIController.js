import { MoveRegistry } from '../combat/MoveRegistry';

export class AIController {
    constructor(fightScene) {
        this.fightScene = fightScene;
        this.self = null;       // injecté après création via setPlayers()
        this.opponent = null;

        // Commandes virtuelles : mêmes clés que celles lues par la state machine.
        this.commands = {
            moveLeft: false, moveRight: false, block: false,
            jab: false, cross: false, light_kick: false,
            heavy_kick: false, leg_sweep: false, fireball: false, jump: false
        };

        // --- Portées ---
        this.PUNCH_RANGE = 1.2;
        this.KICK_RANGE = 1.5;
        this.FIREBALL_RANGE = 4.0;
        this.SPACING_TARGET = 2.2;      // distance que SPACING cherche à maintenir
        this.SPACING_TOLERANCE = 0.4;   // zone morte autour de la distance cible

        // --- Bornes de l'arène ---
        this.ARENA_MIN_Z = -7;
        this.ARENA_MAX_Z = 7;
        this.EDGE_MARGIN = 1.5;         // distance au bord où on évite de reculer

        // --- Saut anti-fireball ---
        this.JUMP_AIRBORNE_WINDOW = 0.4;   // À CALIBRER une fois le saut figé
        this.JUMP_REACTION_BUFFER = 0.08;

        // --- Cadence de décision ---
        this.decisionInterval = 0.12;      // re-décision d'action toutes les 120ms

        // --- Machine d'intentions (modes) ---
        this.MODES = ['AGGRESSIVE', 'SPACING', 'DEFENSIVE'];
        this.currentMode = 'AGGRESSIVE';
        this.modeTimer = 0;                // temps restant dans le mode courant
        this.MODE_MIN_DURATION = 1.5;      // durée min d'un mode (ressenti)
        this.MODE_DURATION_VARIANCE = 2.0; // + jusqu'à 2s aléatoire

        // Actions de déplacement : seules à être "maintenues" dans la durée
        this.MOVEMENT_ACTIONS = ['moveForward', 'moveBack', 'idle'];

        // Mapping action → nom de l'état (pour vérifier les cooldowns)
        this.ACTION_TO_STATE_NAME = {
            jab: 'jab', cross: 'cross', light_kick: 'light_kick',
            heavy_kick: 'heavy_kick', leg_sweep: 'leg_sweep', fireball: 'fireball'
        };

        // --- État interne ---
        this.decisionTimer = 0;
        this.currentAction = 'idle';
        this.actionHoldTimer = 0;
    }

    setPlayers(self, opponent) {
        this.self = self;
        this.opponent = opponent;
    }

    // --- Lecture seule de l'état du jeu ---
    getSelfZ()     { return this.self.mesh.position.z; }
    getOpponentZ() { return this.opponent.mesh.position.z; }

    // L'IA est-elle collée à un bord ? (retourne le signe du bord proche, 0 sinon)
    nearEdge() {
        const z = this.getSelfZ();
        if (z > this.ARENA_MAX_Z - this.EDGE_MARGIN) return 1;
        if (z < this.ARENA_MIN_Z + this.EDGE_MARGIN) return -1;
        return 0;
    }

    // Reculer pousserait-il l'IA vers le bord dont elle est déjà proche ?
    backingIntoEdge() {
        const edge = this.nearEdge();
        if (edge === 0) return false;
        const awayFromOpp = Math.sign(this.getSelfZ() - this.getOpponentZ());
        return awayFromOpp === edge;
    }

    // Une attaque est-elle disponible (cooldown écoulé) ?
    isActionAvailable(action) {
        const stateName = this.ACTION_TO_STATE_NAME[action];
        if (!stateName) return true; // déplacement, block, jump : pas de cooldown
        const cd = this.self.stateMachine.cooldowns?.get(stateName) || 0;
        return cd <= 0;
    }

    update(deltaTime) {
        if (!this.self || !this.opponent) return;

        const ctx = this.buildContext();

        // Saut anti-fireball : priorité absolue, vérifié chaque frame.
        if (ctx.incoming && this.shouldJumpFireball(ctx.incoming)) {
            this.currentAction = 'jump';
            this.applyCommands('jump');
            return;
        }

        // --- Couche mode (lente) ---
        this.modeTimer -= deltaTime;
        if (this.modeTimer <= 0) {
            this.currentMode = this.pickMode(ctx);
            this.modeTimer = this.MODE_MIN_DURATION
                + Math.random() * this.MODE_DURATION_VARIANCE;
        }

        // --- Couche décision (rapide) ---
        this.actionHoldTimer -= deltaTime;
        this.decisionTimer += deltaTime;

        const holding = this.actionHoldTimer > 0
            && this.MOVEMENT_ACTIONS.includes(this.currentAction);

        if (!holding && this.decisionTimer >= this.decisionInterval) {
            this.decisionTimer = 0;
            this.currentAction = this.decide(ctx);

            if (this.MOVEMENT_ACTIONS.includes(this.currentAction)) {
                this.actionHoldTimer = 0.25 + Math.random() * 0.35; // 0.25–0.6s
            }
        }

        this.applyCommands(this.currentAction);
    }

    buildContext() {
        const selfZ = this.getSelfZ();
        const oppZ = this.getOpponentZ();
        const distance = Math.abs(oppZ - selfZ);

        const oppState = this.opponent.stateMachine.currentState.constructor.name;
        const oppAttacking = ['JabState', 'CrossState', 'LightKickState',
                              'HeavyKickState', 'LegSweepState', 'FireballState'].includes(oppState);
        const oppVulnerable = oppState === 'StunState';

        // Projectile entrant : existe et se dirige VERS l'IA.
        let incoming = null;
        const projectiles = this.fightScene.projectiles || [];
        for (const p of projectiles) {
            const pz = p.mesh.position.z;
            const movingTowardSelf = Math.sign(p.velocityZ ?? (selfZ - pz)) === Math.sign(selfZ - pz);
            if (movingTowardSelf) { incoming = p; break; }
        }

        return { distance, oppState, oppAttacking, oppVulnerable, incoming };
    }

    // --- Choix du mode, pondéré par le contexte ---
    pickMode(ctx) {
        const weights = { AGGRESSIVE: 0, SPACING: 0, DEFENSIVE: 0 };

        // SPACING domine, AGGRESSIVE par épisodes, DEFENSIVE rare
        weights.SPACING = 4;
        weights.AGGRESSIVE = 2;
        weights.DEFENSIVE = 0.8;

        // L'adversaire attaque à portée → un peu plus de défense
        if (ctx.oppAttacking && ctx.distance < this.KICK_RANGE) {
            weights.DEFENSIVE += 1.5;
        }
        // Adversaire vulnérable → fenêtre d'agression
        if (ctx.oppVulnerable) {
            weights.AGGRESSIVE += 5;
        }
        // Loin → encore plus de spacing
        if (ctx.distance > this.FIREBALL_RANGE) {
            weights.SPACING += 2;
            weights.DEFENSIVE = 0.3;
        }
        // Acculé → on évite les modes qui reculent
        if (this.nearEdge() !== 0) {
            weights.AGGRESSIVE += 3;
            weights.SPACING *= 0.4;
            weights.DEFENSIVE *= 0.4;
        }

        return this.pickWeightedKey(weights);
    }

    decide(ctx) {
        switch (this.currentMode) {
            case 'AGGRESSIVE': return this.decideAggressive(ctx);
            case 'SPACING':    return this.decideSpacing(ctx);
            case 'DEFENSIVE':  return this.decideDefensive(ctx);
            default:           return this.decideAggressive(ctx);
        }
    }

    // AGGRESSIVE : entre en portée et frappe.
    decideAggressive(ctx) {
        if (ctx.distance > this.KICK_RANGE) {
            return 'moveForward';
        }
        const scores = this.combatScores(ctx);
        scores.jab *= 1.3; scores.cross *= 1.3;
        scores.light_kick *= 1.3; scores.heavy_kick *= 1.3;
        return this.finalizeScores(scores);
    }

    // SPACING : maintient une distance cible, harcèle au pied, recule si trop près.
    decideSpacing(ctx) {
        const tooClose = ctx.distance < this.SPACING_TARGET - this.SPACING_TOLERANCE;
        const tooFar   = ctx.distance > this.SPACING_TARGET + this.SPACING_TOLERANCE;

        if (tooClose) {
            if (this.backingIntoEdge()) {
                // Coincé : on tient et on frappe court plutôt que de se coller au mur.
                return this.finalizeScores(this.combatScores(ctx));
            }
            return 'moveBack';
        }
        if (tooFar) {
            return 'moveForward';
        }
        // Dans la zone cible : harcèlement au pied + un peu d'attente
        const scores = this.combatScores(ctx);
        scores.light_kick *= 1.4; scores.leg_sweep *= 1.2;
        scores.idle += 0.8;
        return this.finalizeScores(scores);
    }

    // DEFENSIVE : block prioritaire, approche molle, punit les ouvertures.
    decideDefensive(ctx) {
        if (ctx.oppVulnerable && ctx.distance < this.KICK_RANGE) {
            return this.finalizeScores(this.combatScores(ctx));
        }
        if (ctx.distance > this.KICK_RANGE) {
            return Math.random() < 0.5 ? 'moveForward' : 'idle';
        }
        const scores = this.combatScores(ctx);
        scores.block *= 1.8;
        return this.finalizeScores(scores);
    }

    // Scores de combat communs (avant biais de mode).
    combatScores(ctx) {
        const scores = {
            block: 0, jab: 0, cross: 0, light_kick: 0,
            heavy_kick: 0, leg_sweep: 0, fireball: 0, idle: 0.1
        };

        if (ctx.oppAttacking && ctx.distance < this.KICK_RANGE) {
            scores.block = 3;
        }
        if (ctx.oppVulnerable && ctx.distance < this.PUNCH_RANGE) {
            scores.cross = 4;
        }
        if (ctx.oppVulnerable && ctx.distance < this.KICK_RANGE) {
            scores.heavy_kick = 3.5;
        }
        if (ctx.distance < this.PUNCH_RANGE && !ctx.oppAttacking) {
            scores.jab = 2; scores.cross = 1.5;
        }
        if (ctx.distance < this.KICK_RANGE && ctx.distance >= this.PUNCH_RANGE && !ctx.oppAttacking) {
            scores.light_kick = 2; scores.leg_sweep = 1.5;
        }
        if (ctx.distance > this.FIREBALL_RANGE && !ctx.oppAttacking) {
            scores.fireball = 2.5;
        }
        return scores;
    }

    // Annule les attaques en cooldown puis tire au sort pondéré.
    finalizeScores(scores) {
        for (const action in scores) {
            if (!this.isActionAvailable(action)) scores[action] = 0;
        }
        return this.pickWeighted(scores);
    }

    shouldJumpFireball(fireball) {
        const selfState = this.self.stateMachine.currentState.constructor.name;
        if (['JumpStraightState', 'JumpForwardState', 'JumpBackwardState'].includes(selfState)) {
            return false;
        }
        const dist = Math.abs(fireball.mesh.position.z - this.getSelfZ());
        const speed = MoveRegistry.fireball.projectileSpeed;
        const timeToImpact = dist / speed;
        return timeToImpact <= this.JUMP_AIRBORNE_WINDOW + this.JUMP_REACTION_BUFFER
            && timeToImpact > this.JUMP_REACTION_BUFFER;
    }

    pickWeighted(scores) {
        const entries = Object.entries(scores).filter(([, v]) => v > 0);
        const total = entries.reduce((sum, [, v]) => sum + v, 0);
        if (total === 0) return 'idle';
        let r = Math.random() * total;
        for (const [action, weight] of entries) {
            r -= weight;
            if (r <= 0) return action;
        }
        return 'idle';
    }

    pickWeightedKey(weights) {
        const entries = Object.entries(weights).filter(([, v]) => v > 0);
        const total = entries.reduce((sum, [, v]) => sum + v, 0);
        if (total === 0) return 'AGGRESSIVE';
        let r = Math.random() * total;
        for (const [key, weight] of entries) {
            r -= weight;
            if (r <= 0) return key;
        }
        return 'AGGRESSIVE';
    }

    resetCommands() {
        for (const key in this.commands) this.commands[key] = false;
    }

    applyCommands(action) {
        this.resetCommands();

        // "Avancer" = la touche que la state machine mappe vers walkforward,
        // selon le facingDirection de CE personnage.
        const forwardKey = this.self.facingDirection === 1 ? 'moveRight' : 'moveLeft';
        const backKey    = this.self.facingDirection === 1 ? 'moveLeft'  : 'moveRight';

        switch (action) {
            case 'moveForward': this.commands[forwardKey] = true; break;
            case 'moveBack':    this.commands[backKey] = true;    break;
            case 'block':       this.commands.block = true;       break;
            case 'jab':         this.commands.jab = true;         break;
            case 'cross':       this.commands.cross = true;       break;
            case 'light_kick':  this.commands.light_kick = true;  break;
            case 'heavy_kick':  this.commands.heavy_kick = true;  break;
            case 'leg_sweep':   this.commands.leg_sweep = true;   break;
            case 'fireball':    this.commands.fireball = true;    break;
            case 'jump':        this.commands.jump = true;        break;
            case 'idle':        break;
        }
    }
}
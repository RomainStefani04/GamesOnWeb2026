/**
 * RewardCalculator — Système de récompenses configurable pour l'IA.
 * 
 * Tous les poids sont exposés dans this.config.
 * Tu peux les modifier à chaud via setConfig() ou directement dans le constructeur.
 */
export class RewardCalculator {
    constructor(config = {}) {
        this.config = {
            // --- Dégâts ---
            dealDamageMultiplier: 10.0,
            takeDamageMultiplier: -10.0,

            // --- KO ---
            knockoutOpponent: 5.0,
            getKnockedOut: -5.0,

            // --- Fin de round ---
            draw: -5.0,                // Pénalité pour une égalité (timeout sans KO)
            winByHp: 2.0,              // Bonus si victoire aux HP (timeout mais plus de vie)
            loseByHp: -2.0,            // Pénalité si défaite aux HP

            // --- Défense ---
            successfulBlock: 0.3,

            // --- Shaping ---
            stepPenalty: -0.005,
            proximityBonus: 0.02,
            proximityThreshold: 3.0,

            // --- Override ---
            ...config
        };

        this.pendingReward = 0;
    }

    // ==========================================
    // CALLBACKS — événements de combat
    // ==========================================

    onDealDamage(damage, opponentMaxHp) {
        const normalized = damage / opponentMaxHp;
        this.pendingReward += this.config.dealDamageMultiplier * normalized;
    }

    onTakeDamage(damage, selfMaxHp) {
        const normalized = damage / selfMaxHp;
        this.pendingReward += this.config.takeDamageMultiplier * normalized;
    }

    onKnockoutOpponent() {
        this.pendingReward += this.config.knockoutOpponent;
    }

    onGetKnockedOut() {
        this.pendingReward += this.config.getKnockedOut;
    }

    onSuccessfulBlock() {
        this.pendingReward += this.config.successfulBlock;
    }

    /**
     * Appelé à la fin d'un épisode pour les résultats non-KO.
     * 
     * @param {'draw'|'win'|'loss'} result - Résultat de l'épisode
     */
    onEpisodeEnd(result) {
        switch (result) {
            case 'draw':
                this.pendingReward += this.config.draw;
                break;
            case 'win':
                this.pendingReward += this.config.winByHp;
                break;
            case 'loss':
                this.pendingReward += this.config.loseByHp;
                break;
        }
    }

    // ==========================================
    // STEP REWARD
    // ==========================================

    computeStepReward(distance) {
        let reward = this.pendingReward;

        reward += this.config.stepPenalty;

        if (distance < this.config.proximityThreshold) {
            reward += this.config.proximityBonus;
        }

        this.pendingReward = 0;
        return reward;
    }

    // ==========================================
    // CONFIGURATION
    // ==========================================

    getConfig() { return { ...this.config }; }

    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    reset() {
        this.pendingReward = 0;
    }
}
import * as BABYLON from '@babylonjs/core';

/**
 * TrainingManager — Gère la boucle d'entraînement en self-play.
 */
export class TrainingManager {
    constructor(config = {}) {
        this.learner = null;
        this.sparring = null;
        this.matchManager = null;

        this.stepsPerFrame = config.stepsPerFrame || 1;
        this.maxEpisodeTime = config.maxEpisodeTime || 30;
        this.sparringSyncFreq = config.sparringSyncFreq || 20;
        this.simulationDt = config.simulationDt || 1 / 60;

        this.spawnP1 = new BABYLON.Vector3(0, 0, -2);
        this.spawnP2 = new BABYLON.Vector3(0, 0, 2);

        this.isTraining = false;
        this.isPaused = false;
        this.episodeCount = 0;
        this.currentEpisodeSteps = 0;
        this.currentEpisodeTimer = 0;

        this.stats = {
            episodeCount: 0,
            totalSteps: 0,
            avgReward: 0,
            lastReward: 0,
            rewardsHistory: [],
            avgLoss: 0,
            winRate: 0,
            drawRate: 0,
            winsHistory: [],        // 1=win, 0=loss, 0.5=draw
            epsilon: 1.0,
            bufferSize: 0,
        };

        this.onStatsUpdated = new BABYLON.Observable();
        this.onEpisodeEnd = new BABYLON.Observable();
    }

    init(learner, sparring, matchManager) {
        this.learner = learner;
        this.sparring = sparring;
        this.matchManager = matchManager;

        this.learner.aiController.setTraining(true);
        this.sparring.aiController.setTraining(false);
        this.sparring.aiController.replayBuffer = this.learner.aiController.replayBuffer;
        this.syncSparringBrain();
    }

    syncSparringBrain() {
        if (!this.learner || !this.sparring) return;
        const learnerBrain = this.learner.aiController.brain;
        const sparringBrain = this.sparring.aiController.brain;
        const weights = learnerBrain.policyNetwork.getWeights();
        const clonedWeights = weights.map(w => w.clone());
        sparringBrain.policyNetwork.setWeights(clonedWeights);
        sparringBrain.updateTargetNetwork();
    }

    start() { this.isTraining = true; this.isPaused = false; this.resetEpisode(); }
    pause() { this.isPaused = true; }
    resume() { this.isPaused = false; }
    stop() { this.isTraining = false; this.isPaused = false; }

    setSpeed(stepsPerFrame) {
        this.stepsPerFrame = Math.max(1, Math.min(50, stepsPerFrame));
    }

    // ==========================================
    // BOUCLE PRINCIPALE
    // ==========================================

    update() {
        if (!this.isTraining || this.isPaused) return;
        for (let i = 0; i < this.stepsPerFrame; i++) {
            this.simulationStep();
            if (this.isEpisodeDone()) {
                this.endEpisode();
                this.resetEpisode();
            }
        }
        this.updateStats();
    }

    simulationStep() {
        const dt = this.simulationDt;
        this.updateFacing();
        this.learner.update(dt);
        this.sparring.update(dt);
        this.currentEpisodeTimer += dt;
        this.currentEpisodeSteps++;
        this.stats.totalSteps++;
        if (this.matchManager) {
            this.matchManager.currentTime = Math.max(0, this.maxEpisodeTime - this.currentEpisodeTimer);
        }
    }

    updateFacing() {
        if (!this.learner?.mesh || !this.sparring?.mesh) return;
        const p1z = this.learner.mesh.position.z;
        const p2z = this.sparring.mesh.position.z;
        this.learner.setFacingDirection(p1z < p2z ? 1 : -1);
        this.sparring.setFacingDirection(p2z < p1z ? 1 : -1);
    }

    // ==========================================
    // ÉPISODES
    // ==========================================

    isEpisodeDone() {
        const learnerDead = (this.learner?.currentHealth || 0) <= 0;
        const sparringDead = (this.sparring?.currentHealth || 0) <= 0;
        const timeout = this.currentEpisodeTimer >= this.maxEpisodeTime;
        return learnerDead || sparringDead || timeout;
    }

    endEpisode() {
        this.episodeCount++;

        const learnerHp = this.learner?.currentHealth || 0;
        const sparringHp = this.sparring?.currentHealth || 0;
        const learnerDead = learnerHp <= 0;
        const sparringDead = sparringHp <= 0;

        // Déterminer le résultat pour le learner
        let learnerResult;
        let historyValue;

        if (sparringDead && !learnerDead) {
            // KO de l'adversaire → victoire (déjà récompensé par onKnockoutOpponent)
            learnerResult = 'win';
            historyValue = 1;
        } else if (learnerDead && !sparringDead) {
            // KO du learner → défaite (déjà pénalisé par onGetKnockedOut)
            learnerResult = 'loss';
            historyValue = 0;
        } else if (learnerHp > sparringHp) {
            // Timeout, learner a plus de vie → victoire aux HP
            learnerResult = 'win';
            historyValue = 1;
        } else if (sparringHp > learnerHp) {
            // Timeout, sparring a plus de vie → défaite aux HP
            learnerResult = 'loss';
            historyValue = 0;
        } else {
            // Même HP (y compris les deux morts en même temps) → égalité
            learnerResult = 'draw';
            historyValue = 0.5;
        }

        // Appliquer le reward de fin d'épisode
        const learnerReward = this.learner.aiController.rewardCalculator;
        const sparringReward = this.sparring.aiController.rewardCalculator;

        learnerReward.onEpisodeEnd(learnerResult);

        // Le résultat opposé pour le sparring
        const sparringResult = learnerResult === 'win' ? 'loss' : 
                               learnerResult === 'loss' ? 'win' : 'draw';
        sparringReward.onEpisodeEnd(sparringResult);

        // Stats
        const episodeReward = this.learner.aiController.stats.episodeReward;

        this.stats.rewardsHistory.push(episodeReward);
        if (this.stats.rewardsHistory.length > 100) this.stats.rewardsHistory.shift();

        this.stats.winsHistory.push(historyValue);
        if (this.stats.winsHistory.length > 100) this.stats.winsHistory.shift();

        // Sync sparring périodiquement
        if (this.episodeCount % this.sparringSyncFreq === 0) {
            this.syncSparringBrain();
            console.log(`[Training] Ep ${this.episodeCount} | ${learnerResult.toUpperCase()} | ε=${this.stats.epsilon.toFixed(4)} | AvgR=${this.stats.avgReward.toFixed(2)} | WR=${(this.stats.winRate * 100).toFixed(1)}% | DR=${(this.stats.drawRate * 100).toFixed(1)}%`);
        }

        this.onEpisodeEnd.notifyObservers({
            episode: this.episodeCount, reward: episodeReward,
            result: learnerResult,
            learnerHp, sparringHp,
            steps: this.currentEpisodeSteps, duration: this.currentEpisodeTimer
        });
    }

    resetEpisode() {
        if (!this.learner || !this.sparring) return;

        this.learner.currentHealth = this.learner.maxHealth;
        this.sparring.currentHealth = this.sparring.maxHealth;

        this.resetPlayerPosition(this.learner, this.spawnP1);
        this.resetPlayerPosition(this.sparring, this.spawnP2);

        this.learner.aiController.resetEpisode();
        this.sparring.aiController.resetEpisode();

        if (this.learner.stateMachine) {
            this.learner.stateMachine.changeState(this.learner.stateMachine.states.idle);
        }
        if (this.sparring.stateMachine) {
            this.sparring.stateMachine.changeState(this.sparring.stateMachine.states.idle);
        }

        this.currentEpisodeTimer = 0;
        this.currentEpisodeSteps = 0;

        if (this.matchManager) {
            this.matchManager.currentTime = this.maxEpisodeTime;
            this.matchManager.timerAccumulator = 0;
        }
    }

    resetPlayerPosition(player, spawnPos) {
        if (player.mesh) player.mesh.position = spawnPos.clone();
        if (player.physicsBody) {
            player.physicsBody.setLinearVelocity(BABYLON.Vector3.Zero());
            player.physicsBody.setAngularVelocity(BABYLON.Vector3.Zero());
        }
    }

    // ==========================================
    // STATS
    // ==========================================

    updateStats() {
        const learnerStats = this.learner?.aiController?.getStats() || {};
        this.stats.episodeCount = this.episodeCount;
        this.stats.epsilon = learnerStats.epsilon || 0;
        this.stats.bufferSize = learnerStats.bufferSize || 0;
        this.stats.lastReward = learnerStats.episodeReward || 0;
        this.stats.avgLoss = learnerStats.lastLoss || 0;

        if (this.stats.rewardsHistory.length > 0) {
            this.stats.avgReward = this.stats.rewardsHistory.reduce((a, b) => a + b, 0) / this.stats.rewardsHistory.length;
        }
        if (this.stats.winsHistory.length > 0) {
            const wins = this.stats.winsHistory.filter(v => v === 1).length;
            const draws = this.stats.winsHistory.filter(v => v === 0.5).length;
            const total = this.stats.winsHistory.length;
            this.stats.winRate = wins / total;
            this.stats.drawRate = draws / total;
        }

        this.onStatsUpdated.notifyObservers(this.stats);
    }

    getStats() { return { ...this.stats }; }

    // ==========================================
    // SAVE / LOAD / REWARD CONFIG
    // ==========================================

    async saveModel(name = 'cursed-impact-brain') {
        await this.learner?.aiController?.brain?.save(name);
    }

    async loadModel(name = 'cursed-impact-brain') {
        const success = await this.learner?.aiController?.brain?.load(name);
        if (success) this.syncSparringBrain();
        return success;
    }

    async downloadModel(name = 'cursed-impact-brain') {
        await this.learner?.aiController?.brain?.saveToFiles(name);
    }

    getRewardConfig() {
        return this.learner?.aiController?.rewardCalculator?.getConfig() || {};
    }

    setRewardConfig(newConfig) {
        this.learner?.aiController?.rewardCalculator?.setConfig(newConfig);
        this.sparring?.aiController?.rewardCalculator?.setConfig(newConfig);
    }

    dispose() {
        this.stop();
        this.onStatsUpdated.clear();
        this.onEpisodeEnd.clear();
    }
}
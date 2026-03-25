import { BrainNetwork } from './BrainNetwork.js';
import { ReplayBuffer } from './ReplayBuffer.js';
import { RewardCalculator } from './RewardCalculator.js';

/**
 * AIController — Cerveau de l'IA.
 * 
 * À chaque step :
 * 1. Observe l'état du combat → vecteur d'observation (21 floats)
 * 2. Choisit une action (epsilon-greedy)
 * 3. Collecte le reward du step précédent
 * 4. Stocke la transition dans le ReplayBuffer
 * 
 * Le flow par frame :
 *   AIPlayer.update(dt) → aiController.step(dt) → aiInputMapper.setAction(action) → stateMachine.update()
 */

// Mapping état → index pour le one-hot encoding
const STATE_NAMES = ['Idle', 'WalkForward', 'WalkBackward', 'Jab', 'Cross', 'Block', 'Stun'];
const STATE_COUNT = STATE_NAMES.length;

// Nombre total de features dans l'observation
const OBSERVATION_SIZE = 1 + 1 + 1 + 1 + 1 + STATE_COUNT + STATE_COUNT + 1 + 1; // = 21

// Nombre d'actions possibles
const ACTION_COUNT = 6;

export class AIController {
    constructor(character, config = {}) {
        this.character = character;
        this.opponent = null;       // Sera set via setOpponent()
        this.matchManager = null;   // Sera set via setMatchManager()

        // Réseau de neurones
        this.brain = new BrainNetwork(OBSERVATION_SIZE, ACTION_COUNT, {
            learningRate: config.learningRate || 0.001,
            gamma: config.gamma || 0.99
        });

        // Replay buffer
        this.replayBuffer = new ReplayBuffer(config.bufferCapacity || 50000);

        // Reward calculator
        this.rewardCalculator = new RewardCalculator(config.rewards || {});

        // Epsilon-greedy
        this.epsilon = config.epsilon || 1.0;           // Taux d'exploration initial
        this.epsilonMin = config.epsilonMin || 0.05;    // Minimum d'exploration
        this.epsilonDecay = config.epsilonDecay || 0.9995; // Decay par step

        // Fréquence de décision (en secondes)
        this.decisionInterval = config.decisionInterval || 0.1; // 100ms = 10 décisions/sec
        this.timeSinceLastDecision = 0;

        // État précédent (pour stocker les transitions)
        this.previousState = null;
        this.previousAction = null;
        this.currentAction = 0;

        // Stats (pour monitoring)
        this.stats = {
            totalSteps: 0,
            totalReward: 0,
            episodeReward: 0,
            lastLoss: 0
        };

        // Training config
        this.trainingEnabled = false;    // Phase 1 : pas d'entraînement
        this.batchSize = config.batchSize || 32;
        this.targetUpdateFreq = config.targetUpdateFreq || 1000;
        this.trainFreq = config.trainFreq || 4; // Train tous les N steps
    }

    /** Connecte l'adversaire (appelé après la création des deux joueurs) */
    setOpponent(opponent) {
        this.opponent = opponent;
    }

    /** Connecte le MatchManager (pour accéder au timer) */
    setMatchManager(matchManager) {
        this.matchManager = matchManager;
    }

    // ==========================================
    // OBSERVATION — Construit le vecteur d'entrée
    // ==========================================

    /**
     * Construit le vecteur d'observation normalisé.
     * 
     * Layout (21 floats) :
     *   [0]    Position Z de l'IA (normalisé /10)
     *   [1]    Position Z de l'adversaire (normalisé /10)
     *   [2]    Distance entre les deux (normalisé /20)
     *   [3]    HP IA (pourcentage 0-1)
     *   [4]    HP adversaire (pourcentage 0-1)
     *   [5-11] État IA (one-hot, 7 valeurs)
     *   [12-18] État adversaire (one-hot, 7 valeurs)
     *   [19]   Facing direction IA (0 ou 1)
     *   [20]   Timer (pourcentage 0-1)
     */
    buildObservation() {
        if (!this.opponent) return new Array(OBSERVATION_SIZE).fill(0);

        const obs = [];

        // Positions
        const selfZ = this.character.mesh?.position.z || 0;
        const oppZ = this.opponent.mesh?.position.z || 0;
        obs.push(selfZ / 10);
        obs.push(oppZ / 10);

        // Distance
        const distance = Math.abs(selfZ - oppZ);
        obs.push(distance / 20);

        // HP
        obs.push((this.character.currentHealth || 0) / (this.character.maxHealth || 100));
        obs.push((this.opponent.currentHealth || 0) / (this.opponent.maxHealth || 100));

        // État courant IA (one-hot)
        const selfStateName = this.character.stateMachine?.currentState?.name || 'Idle';
        for (const s of STATE_NAMES) {
            obs.push(selfStateName === s ? 1.0 : 0.0);
        }

        // État courant adversaire (one-hot)
        const oppStateName = this.opponent.stateMachine?.currentState?.name || 'Idle';
        for (const s of STATE_NAMES) {
            obs.push(oppStateName === s ? 1.0 : 0.0);
        }

        // Facing direction (1 → 1.0, -1 → 0.0)
        obs.push(this.character.facingDirection === 1 ? 1.0 : 0.0);

        // Timer
        const timer = this.matchManager?.currentTime ?? 99;
        obs.push(timer / 99);

        return obs;
    }

    // ==========================================
    // DÉCISION — Epsilon-greedy
    // ==========================================

    /**
     * Choisit une action via epsilon-greedy.
     * Avec probabilité epsilon → action aléatoire (exploration)
     * Sinon → meilleure action du réseau (exploitation)
     */
    chooseAction(observation) {
        if (Math.random() < this.epsilon) {
            return Math.floor(Math.random() * ACTION_COUNT);
        }
        return this.brain.bestAction(observation);
    }

    // ==========================================
    // STEP — Appelé à chaque frame
    // ==========================================

    /**
     * Point d'entrée principal. Appelé par AIPlayer.update(deltaTime).
     * Gère le timing des décisions et la boucle observe → decide → act.
     */
    step(deltaTime) {
        this.timeSinceLastDecision += deltaTime;

        // On ne prend une nouvelle décision que toutes les decisionInterval secondes
        if (this.timeSinceLastDecision < this.decisionInterval) {
            return;
        }

        this.timeSinceLastDecision = 0;

        // 1. Observer l'état actuel
        const currentState = this.buildObservation();

        // 2. Calculer le reward du step précédent
        if (this.previousState !== null) {
            const distance = Math.abs(
                (this.character.mesh?.position.z || 0) -
                (this.opponent?.mesh?.position.z || 0)
            );
            const reward = this.rewardCalculator.computeStepReward(distance);

            // Vérifier si l'épisode est terminé
            const done = this.isEpisodeDone();

            // Stocker la transition
            this.replayBuffer.push(
                this.previousState,
                this.previousAction,
                reward,
                currentState,
                done
            );

            // Stats
            this.stats.totalReward += reward;
            this.stats.episodeReward += reward;
            this.stats.totalSteps++;

            // Entraînement (si activé — Phase 2)
            if (this.trainingEnabled) {
                this.tryTrain();
            }
        }

        // 3. Choisir une nouvelle action
        this.currentAction = this.chooseAction(currentState);

        // 4. Appliquer l'action sur l'InputMapper
        this.character.aiInputMapper.setAction(this.currentAction);

        // 5. Sauvegarder l'état pour le prochain step
        this.previousState = currentState;
        this.previousAction = this.currentAction;

        // 6. Decay epsilon
        if (this.trainingEnabled && this.epsilon > this.epsilonMin) {
            this.epsilon *= this.epsilonDecay;
        }
    }

    // ==========================================
    // TRAINING (préparé pour Phase 2)
    // ==========================================

    tryTrain() {
        if (!this.replayBuffer.canSample(this.batchSize)) return;
        if (this.stats.totalSteps % this.trainFreq !== 0) return;

        const batch = this.replayBuffer.sample(this.batchSize);
        this.stats.lastLoss = this.brain.trainOnBatch(batch);

        // Mise à jour du target network
        if (this.stats.totalSteps % this.targetUpdateFreq === 0) {
            this.brain.updateTargetNetwork();
        }
    }

    /** Active/désactive l'entraînement */
    setTraining(enabled) {
        this.trainingEnabled = enabled;
    }

    // ==========================================
    // UTILITAIRES
    // ==========================================

    /** Vérifie si le round est terminé */
    isEpisodeDone() {
        const selfDead = (this.character.currentHealth || 0) <= 0;
        const oppDead = (this.opponent?.currentHealth || 0) <= 0;
        const timeout = (this.matchManager?.currentTime ?? 99) <= 0;
        return selfDead || oppDead || timeout;
    }

    /** Reset pour un nouvel épisode */
    resetEpisode() {
        this.previousState = null;
        this.previousAction = null;
        this.currentAction = 0;
        this.timeSinceLastDecision = 0;
        this.rewardCalculator.reset();
        this.stats.episodeReward = 0;
    }

    /** Retourne les stats pour le monitoring */
    getStats() {
        return {
            ...this.stats,
            epsilon: this.epsilon,
            bufferSize: this.replayBuffer.size,
        };
    }

    /** Sauvegarde le modèle */
    async saveModel(name) {
        await this.brain.save(name);
    }

    /** Charge un modèle */
    async loadModel(name) {
        return await this.brain.load(name);
    }

    /** Libère la mémoire */
    dispose() {
        this.brain?.dispose();
    }
}

// Exports utiles pour d'autres modules
export { OBSERVATION_SIZE, ACTION_COUNT, STATE_NAMES };
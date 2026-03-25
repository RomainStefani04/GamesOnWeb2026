import * as tf from '@tensorflow/tfjs';

/**
 * BrainNetwork — Double DQN avec TensorFlow.js.
 * 
 * Deux réseaux :
 * - policyNetwork : le réseau principal qui est entraîné
 * - targetNetwork : copie stabilisée, mise à jour périodiquement
 * 
 * Architecture : Input(21) → Dense(128, relu) → Dense(128, relu) → Dense(64, relu) → Output(6, linear)
 */
export class BrainNetwork {
    constructor(inputSize = 21, actionSize = 6, config = {}) {
        this.inputSize = inputSize;
        this.actionSize = actionSize;

        // Hyperparamètres
        this.learningRate = config.learningRate || 0.001;
        this.gamma = config.gamma || 0.99;  // Discount factor

        // Création des deux réseaux
        this.policyNetwork = this._createModel();
        this.targetNetwork = this._createModel();
        this.updateTargetNetwork();

        // Optimizer
        this.optimizer = tf.train.adam(this.learningRate);
    }

    /**
     * Crée un réseau dense pour le DQN.
     */
    _createModel() {
        const model = tf.sequential();

        model.add(tf.layers.dense({
            inputShape: [this.inputSize],
            units: 128,
            activation: 'relu',
            kernelInitializer: 'heNormal'
        }));

        model.add(tf.layers.dense({
            units: 128,
            activation: 'relu',
            kernelInitializer: 'heNormal'
        }));

        model.add(tf.layers.dense({
            units: 64,
            activation: 'relu',
            kernelInitializer: 'heNormal'
        }));

        model.add(tf.layers.dense({
            units: this.actionSize,
            activation: 'linear'    // Q-values brutes, pas de softmax
        }));

        return model;
    }

    /**
     * Prédit les Q-values pour un état donné (utilise le policy network).
     * 
     * @param {number[]} state - Vecteur d'observation (taille inputSize)
     * @returns {number[]} Q-values pour chaque action
     */
    predict(state) {
        return tf.tidy(() => {
            const input = tf.tensor2d([state], [1, this.inputSize]);
            const qValues = this.policyNetwork.predict(input);
            return Array.from(qValues.dataSync());
        });
    }

    /**
     * Choisit la meilleure action (argmax des Q-values).
     * 
     * @param {number[]} state - Vecteur d'observation
     * @returns {number} Index de l'action avec la plus haute Q-value
     */
    bestAction(state) {
        const qValues = this.predict(state);
        return qValues.indexOf(Math.max(...qValues));
    }

    /**
     * Copie les poids du policy network vers le target network.
     * Appelé périodiquement (ex: tous les 1000 steps).
     */
    updateTargetNetwork() {
        const policyWeights = this.policyNetwork.getWeights();
        const clonedWeights = policyWeights.map(w => w.clone());
        this.targetNetwork.setWeights(clonedWeights);
        // Dispose les clones temporaires dans policyWeights (ce sont des refs, pas de dispose nécessaire)
        // Mais les clonedWeights sont maintenant gérés par targetNetwork
    }

    /**
     * Entraîne le policy network sur un mini-batch (Double DQN).
     * 
     * @param {{ states: number[][], actions: number[], rewards: number[], nextStates: number[][], dones: boolean[] }} batch
     * @returns {number} La loss moyenne du batch
     */
    trainOnBatch(batch) {
        const { states, actions, rewards, nextStates, dones } = batch;
        const batchSize = states.length;

        // 1. Calculer les target Q-values (en dehors du gradient)
        const targetValues = tf.tidy(() => {
            const nextStateTensor = tf.tensor2d(nextStates, [batchSize, this.inputSize]);

            // Double DQN : les meilleures actions viennent du policy network
            const nextQPolicy = this.policyNetwork.predict(nextStateTensor);
            const bestActions = nextQPolicy.argMax(1);

            // Mais les Q-values viennent du target network
            const nextQTarget = this.targetNetwork.predict(nextStateTensor);
            const bestActionMask = tf.oneHot(bestActions, this.actionSize);
            const nextQMax = nextQTarget.mul(bestActionMask).sum(1);

            // target = reward + gamma * Q_target(s', argmax_a Q_policy(s', a)) * (1 - done)
            const doneMask = tf.tensor1d(dones.map(d => d ? 0.0 : 1.0));
            const rewardTensor = tf.tensor1d(rewards);

            return rewardTensor.add(tf.scalar(this.gamma).mul(nextQMax).mul(doneMask));
        });

        // 2. Optimiser le policy network
        const trainableVars = this.policyNetwork.trainableWeights.map(w => w.val);

        const lossScalar = this.optimizer.minimize(() => {
            const stateTensor = tf.tensor2d(states, [batchSize, this.inputSize]);
            const qValues = this.policyNetwork.predict(stateTensor);
            const actionMask = tf.oneHot(tf.tensor1d(actions, 'int32'), this.actionSize);
            const qForActions = qValues.mul(actionMask).sum(1);

            return tf.losses.meanSquaredError(targetValues, qForActions);
        }, true, trainableVars);

        const lossValue = lossScalar.dataSync()[0];

        // Cleanup
        lossScalar.dispose();
        targetValues.dispose();

        return lossValue;
    }

    /**
     * Sauvegarde le modèle (policy network) dans le localStorage du navigateur.
     * 
     * @param {string} name - Nom du modèle (ex: "cursed-impact-brain")
     */
    async save(name = 'cursed-impact-brain') {
        await this.policyNetwork.save(`localstorage://${name}`);
        console.log(`Modèle sauvegardé: ${name}`);
    }

    /**
     * Charge un modèle depuis le localStorage.
     * 
     * @param {string} name - Nom du modèle
     */
    async load(name = 'cursed-impact-brain') {
        try {
            this.policyNetwork.dispose();
            this.policyNetwork = await tf.loadLayersModel(`localstorage://${name}`);
            this.updateTargetNetwork();
            console.log(`Modèle chargé: ${name}`);
            return true;
        } catch (e) {
            console.warn(`Impossible de charger le modèle "${name}":`, e);
            return false;
        }
    }

    /**
     * Sauvegarde le modèle en téléchargement (fichiers JSON + bin).
     * Utile pour exporter un modèle entraîné.
     */
    async saveToFiles(name = 'cursed-impact-brain') {
        await this.policyNetwork.save(`downloads://${name}`);
    }

    /**
     * Charge un modèle depuis des fichiers (pour brain-model.json + brain-weights.bin).
     * 
     * @param {string} modelUrl - URL du fichier model.json
     */
    async loadFromUrl(modelUrl) {
        try {
            this.policyNetwork.dispose();
            this.policyNetwork = await tf.loadLayersModel(modelUrl);
            this.updateTargetNetwork();
            console.log(`Modèle chargé depuis: ${modelUrl}`);
            return true;
        } catch (e) {
            console.warn(`Impossible de charger le modèle depuis "${modelUrl}":`, e);
            return false;
        }
    }

    /** Libère la mémoire GPU/CPU */
    dispose() {
        this.policyNetwork?.dispose();
        this.targetNetwork?.dispose();
        this.optimizer?.dispose();
    }
}
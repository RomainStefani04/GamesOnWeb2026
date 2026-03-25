/**
 * ReplayBuffer — Buffer circulaire pour l'Experience Replay du DQN.
 * 
 * Stocke les transitions (state, action, reward, nextState, done)
 * et permet de sampler des mini-batches aléatoires pour l'entraînement.
 */
export class ReplayBuffer {
    constructor(capacity = 50000) {
        this.capacity = capacity;
        this.buffer = [];
        this.position = 0; // Position d'écriture (circulaire)
    }

    /**
     * Ajoute une transition au buffer.
     * 
     * @param {number[]} state - Vecteur d'observation au moment de la décision
     * @param {number} action - Index de l'action choisie (0-5)
     * @param {number} reward - Reward reçu après l'action
     * @param {number[]} nextState - Vecteur d'observation après l'action
     * @param {boolean} done - true si l'épisode est terminé (KO ou timeout)
     */
    push(state, action, reward, nextState, done) {
        const transition = { state, action, reward, nextState, done };

        if (this.buffer.length < this.capacity) {
            this.buffer.push(transition);
        } else {
            this.buffer[this.position] = transition;
        }

        this.position = (this.position + 1) % this.capacity;
    }

    /**
     * Sample un mini-batch aléatoire.
     * 
     * @param {number} batchSize - Taille du batch
     * @returns {{ states: number[][], actions: number[], rewards: number[], nextStates: number[][], dones: boolean[] }}
     */
    sample(batchSize) {
        const batch = {
            states: [],
            actions: [],
            rewards: [],
            nextStates: [],
            dones: []
        };

        const indices = new Set();
        while (indices.size < batchSize) {
            indices.add(Math.floor(Math.random() * this.buffer.length));
        }

        for (const i of indices) {
            const t = this.buffer[i];
            batch.states.push(t.state);
            batch.actions.push(t.action);
            batch.rewards.push(t.reward);
            batch.nextStates.push(t.nextState);
            batch.dones.push(t.done);
        }

        return batch;
    }

    /** Nombre de transitions stockées */
    get size() {
        return this.buffer.length;
    }

    /** Vérifie si on a assez de données pour sampler */
    canSample(batchSize) {
        return this.buffer.length >= batchSize;
    }

    /** Vide le buffer */
    clear() {
        this.buffer = [];
        this.position = 0;
    }
}
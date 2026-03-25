import { Character } from './Character.js';
import { CharacterStateMachine } from './state/CharacterStateMachine.js';
import { AIInputMapper } from '../ai/AIInputMapper.js';
import { AIController } from '../ai/AIController.js';

/**
 * AIPlayer — Personnage contrôlé par l'IA.
 * 
 * Fonctionne exactement comme Player, mais utilise un AIInputMapper
 * (piloté par AIController) au lieu d'un InputMapper clavier.
 * 
 * Flow :
 *   update(dt) → aiController.step(dt)     → décide l'action
 *              → aiInputMapper.setAction()  → traduit en "touches"
 *              → stateMachine.update(dt)    → exécute l'état
 */
export class AIPlayer extends Character {
    constructor(scene, name, meshName, mesh, animationGroups, aiConfig = {}) {
        super(scene, name, mesh, animationGroups);
        this.meshName = meshName;

        // Input mapper IA (remplace le clavier)
        this.aiInputMapper = new AIInputMapper(this);

        // State machine (identique à Player, mais pilotée par l'IA)
        this.stateMachine = new CharacterStateMachine(this, this.aiInputMapper);

        // Contrôleur IA (cerveau)
        this.aiController = new AIController(this, aiConfig);
    }

    /**
     * Initialise les connexions de l'IA avec le reste du jeu.
     * Doit être appelé APRÈS la création des deux joueurs et du MatchManager.
     * 
     * @param {Character} opponent - Le joueur adversaire
     * @param {MatchManager} matchManager - Le gestionnaire du match
     */
    initAI(opponent, matchManager) {
        this.aiController.setOpponent(opponent);
        this.aiController.setMatchManager(matchManager);
    }

    update(deltaTime) {
        // 1. L'IA observe et décide
        this.aiController.step(deltaTime);

        // 2. La state machine exécute (comme Player)
        this.stateMachine.update(deltaTime);
    }

    getCurrentState() {
        return this.stateMachine?.currentState?.name;
    }

    /** Retourne le RewardCalculator pour le connecter aux événements de combat */
    getRewardCalculator() {
        return this.aiController.rewardCalculator;
    }

    /** Retourne les stats de l'IA (pour debug/monitoring) */
    getAIStats() {
        return this.aiController.getStats();
    }

    dispose() {
        this.aiController?.dispose();
        super.dispose();
    }
}
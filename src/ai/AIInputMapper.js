/**
 * AIInputMapper — Pont entre les décisions de l'IA et le CharacterStateMachine.
 * 
 * Implémente la même interface que InputMapper (isKeyPressed, isKeyReleased, etc.)
 * mais au lieu de lire le clavier, retourne l'état basé sur l'action choisie par l'IA.
 * 
 * Actions :
 *   0 = idle (rien)
 *   1 = avancer (vers l'adversaire)
 *   2 = reculer (s'éloigner de l'adversaire)
 *   3 = jab
 *   4 = cross
 *   5 = block
 * 
 * L'avancer/reculer est traduit en moveRight/moveLeft selon le facingDirection,
 * car le CharacterStateMachine remappe déjà ces inputs via updateFacingInput().
 */
export class AIInputMapper {
    constructor(character) {
        this.character = character;
        this.currentAction = 0; // idle par défaut
    }

    /** Appelé par l'AIController à chaque décision */
    setAction(actionIndex) {
        this.currentAction = actionIndex;
    }

    /**
     * Retourne true si l'action correspond à la "touche" demandée par la state machine.
     * 
     * La state machine appelle isKeyPressed('moveRight'), isKeyPressed('jab'), etc.
     * On traduit l'action index en réponses cohérentes.
     */
    isKeyPressed(action) {
        const facing = this.character.facingDirection;

        switch (this.currentAction) {
            case 0: // idle → rien n'est pressé
                return false;

            case 1: // avancer (vers l'adversaire)
                // facing 1 (droite) : avancer = moveRight
                // facing -1 (gauche) : avancer = moveLeft
                if (facing === 1) return action === 'moveRight';
                return action === 'moveLeft';

            case 2: // reculer (s'éloigner)
                if (facing === 1) return action === 'moveLeft';
                return action === 'moveRight';

            case 3: // jab
                return action === 'jab';

            case 4: // cross
                return action === 'cross';

            case 5: // block
                return action === 'block';

            default:
                return false;
        }
    }

    // ==========================================
    // Stubs pour matcher l'interface InputMapper
    // ==========================================

    isKeyReleased(_action) {
        return false;
    }

    isMouseButtonPressed(_action) {
        return false;
    }

    isMouseButtonReleased(_action) {
        return false;
    }
}
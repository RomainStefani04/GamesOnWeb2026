/**
 * Classe abstraite pour les états du personnage.
 * 
 * Chaque état définit ses paramètres d'animation dans this.animation.
 * Utiliser playStateAnimation() pour lancer l'animation avec ces paramètres.
 */
export class CharacterState {
    constructor(stateMachine) {
        this.stateMachine = stateMachine;
        this.character = stateMachine.character;
        this.name = "BaseState";
        this.isBlocking = false;

        /**
         * Config d'animation — à override dans les sous-classes.
         * Mettre name à null si l'état ne joue pas d'animation.
         */
        this.animation = {
            name: null,
            loop: true,
            speed: 1.0,
            blending: 0.1,
            from: null,     // null = début par défaut du groupe
            to: null        // null = fin par défaut du groupe
        };
    }

    /**
     * Lance l'animation configurée dans this.animation.
     * @returns {AnimationGroup|null}
     */
    playStateAnimation() {
        const { name, loop, speed, blending, from, to } = this.animation;
        if (!name) return null;
        return this.character.playAnimation(name, loop, speed, blending, from, to);
    }

    enter(params = {}) {}
    exit() {}
    update(deltaTime) {}
}
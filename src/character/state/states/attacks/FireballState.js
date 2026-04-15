import { AttackState } from './AttackState';
import { MoveRegistry } from '../../../../combat/MoveRegistry';
import { Projectile } from './Projectile';
import { eventBus } from '../../../../core/EventBus';

export class FireballState extends AttackState {
    constructor(stateMachine) {
        super(stateMachine);
        this.name = "Fireball";
        this.moveData = MoveRegistry.fireball;
        this.animation = {
            name: 'fireball',
            loop: false,
            speed: 2.0,
            blending: 0.1,
            from: 40,
            to: 140
        };

        this.projectileLaunched = false;
        this.spawnObserver = null;
    }

    // On surcharge enter() pour NE PAS appeler this.createHitbox()
    enter() {
        eventBus.emit('attack:fireball');
        this.isBlocking = true;
        this.elapsedTime = 0;
        this.projectileLaunched = false;
        this.character.stop();

        const anim = this.playStateAnimation();
        if (anim) {
            anim.onAnimationGroupEndObservable.addOnce(() => this.onAttackEnd());
        }

        // On crée un observateur JUSTE pour tracker la frame de lancement
        this.spawnObserver = this.character.scene.onBeforeRenderObservable.add(() => {
            const currentFrame = this.elapsedTime * this.animation.speed * 60;

            if (!this.projectileLaunched && currentFrame >= this.moveData.hitbox.activeFrame) {
                this.projectileLaunched = true;
                
                // Lancement de l'entité indépendante !
                new Projectile(this.character, this.moveData);
            }
        });
    }

    exit() {
        // On nettoie juste l'observateur de lancement
        if (this.spawnObserver) {
            this.character.scene.onBeforeRenderObservable.remove(this.spawnObserver);
            this.spawnObserver = null;
        }
        
        // Important : si ton AttackState de base fait des trucs spécifiques dans exit(), 
        // tu peux appeler super.exit(). Sinon, ne l'appelle pas car il va chercher destroyHitbox().
    }

    // On s'assure que ces méthodes ne font rien ici
    createHitbox() {} 
    destroyHitbox() {}
}
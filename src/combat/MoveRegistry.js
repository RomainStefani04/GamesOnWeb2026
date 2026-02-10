/**
 * MoveRegistry — Données statiques de tous les coups.
 * 
 * Chaque coup définit :
 * - damage      : dégâts infligés
 * - hitbox      : zone d'attaque (offset relatif au perso, taille, frames actives)
 * - totalFrames : durée totale du coup en frames (à 60fps)
 * 
 * Les offsets sont relatifs au personnage :
 * - offset.z est multiplié par facingDirection dans AttackState
 * - offset.y est absolu (hauteur)
 * 
 * Ajuster les valeurs selon les animations de ton modèle.
 */
export const MoveRegistry = {
    jab: {
        damage: 8,
        totalFrames: 20,
        hitbox: {
            offset: { x: 0, y: 0.9, z: 0.5 },
            size: { x: 0.3, y: 0.3, z: 0.4 },
            activeFrame: 3,
            endFrame: 7
        }
    },

    cross: {
        damage: 14,
        totalFrames: 35,
        hitbox: {
            offset: { x: 0, y: 0.9, z: 0.6 },
            size: { x: 0.3, y: 0.3, z: 0.5 },
            activeFrame: 8,
            endFrame: 14
        }
    }
};
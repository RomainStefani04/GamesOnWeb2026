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
        totalFrames: 60,
        hitbox: {
            offset: { x: 0, y: 1.4, z: 0.825 },
            size: { x: 0.5, y: 0.3, z: 0.5 }, // Surement z a reduire
            activeFrame: 18,
            endFrame: 30
            // activeFrame: 0,
            // endFrame: 60
        }
    },

    cross: {
        damage: 14,
        totalFrames: 121,
        hitbox: {
            offset: { x: 0, y: 1.4, z: 0.775 },
            size: { x: 0.5, y: 0.3, z: 0.45 }, // Surement z a reduire
            activeFrame: 61,
            endFrame: 73
            // activeFrame: 0,
            // endFrame: 121
        }
    }
};
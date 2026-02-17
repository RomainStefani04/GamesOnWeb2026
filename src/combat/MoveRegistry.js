/**
 * MoveRegistry — Données statiques de tous les coups.
 * 
 * La hitbox est parentée directement au bone — plus besoin d'offsets.
 * Le knockback est appliqué via Havok impulse dans la direction du facing.
 */
export const MoveRegistry = {
    jab: {
        damage: 8,
        totalFrames: 60,
        boneName: "LeftHand",
        knockback: 150,       // N·s — à tuner selon le feeling
        stunDuration: 0.3,
        hitbox: {
            radius: 0.15,
            activeFrame: 18,
            endFrame: 30
        }
    },

    cross: {
        damage: 14,
        totalFrames: 121,
        boneName: "RightHand",
        knockback: 280,
    stunDuration: 0.6,
        hitbox: {
            radius: 0.15,
            activeFrame: 61,
            endFrame: 73
        }
    }
};
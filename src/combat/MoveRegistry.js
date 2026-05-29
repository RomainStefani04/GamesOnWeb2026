export const MoveRegistry = {
    jab: {
        name: "Jab",
        damage: 8,
        totalFrames: 60,
        boneName: "LeftHand",
        knockback: 150,
        stunDuration: 0.3, // en secondes
        cooldown: 0, // en secondes
        isSweep: false,
        hitbox: { radius: 0.15, activeFrame: 18, endFrame: 30 }
    },
    cross: {
        name: "Cross",
        damage: 14,
        totalFrames: 121,
        boneName: "RightHand",
        knockback: 280,
        stunDuration: 0.6,
        cooldown: 0,
        isSweep: false,
        hitbox: { radius: 0.15, activeFrame: 61, endFrame: 73 }
    },
    light_kick: {
        name: "Light Kick",
        damage: 10,
        totalFrames: 80,
        boneName: "RightFoot",
        knockback: 200,
        stunDuration: 0.4,
        cooldown: 0,
        isSweep: false,
        hitbox: { radius: 0.2, activeFrame: 30, endFrame: 80 }
    },
    heavy_kick: {
        name: "Heavy Kick",
        damage: 18,
        totalFrames: 90,
        boneName: "LeftFoot",
        knockback: 300,
        stunDuration: 0.7,
        cooldown: 0,
        isSweep: false,
        hitbox: { radius: 0.2, activeFrame: 30, endFrame: 60 }
    },
    leg_sweep: {
        name: "Leg Sweep",
        damage: 12,
        totalFrames: 180,
        boneName: "RightFoot",
        knockback: 250,
        stunDuration: 1.3,
        cooldown: 0.5,
        isSweep: true,
        hitbox: { radius: 0.2, activeFrame: 40, endFrame: 120 }
    },
    fireball: {
        name: "Fireball",
        damage: 20,
        totalFrames: 100,
        boneName: "RightHand",
        knockback: 250,
        stunDuration: 0.8,
        cooldown: 2.0, // exemple de cooldown de 2 secondes
        isSweep: false,
        projectileSpeed: 3,
        projectileLifetime: 7,
        hitbox: { radius: 0.3, activeFrame: 50, endFrame: 9999 }
    },
    jump: {
        name: "Jump",
        damage: 0,
        totalFrames: 150,
        boneName: null,
        knockback: 0,
        stunDuration: 0,
        isSweep: false,
        hitbox: null
    }
};
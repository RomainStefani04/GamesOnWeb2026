# Architecture du Jeu de Combat IA

## Vue d'ensemble

Jeu de combat 2.5D (gameplay 2D, rendu 3D) avec une IA qui simule une progression de difficulté à travers 3 niveaux.

---

## Technologies

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Moteur de rendu | **Babylon.js** | Imposé par la compétition |
| Langage | **JavaScript (ES6+)** | Choix de l'équipe |
| IA / ML | **TensorFlow.js** | Maturité, accélération GPU, export depuis Python |
| Bundler | **Vite** | Rapide, configuration minimale, HMR |
| Tests | **Vitest** | Compatible Vite, API Jest-like |

---

## Principes d'architecture

### 3 couches d'abstraction

```
┌─────────────────────────────────────────────────────┐
│                   VISUAL LAYER                       │
│    Composants Babylon.js (meshes, animations)        │
│    "Bêtes" - transmettent les inputs, affichent      │
└─────────────────────┬───────────────────────────────┘
                      │ communique uniquement avec ↓
┌─────────────────────▼───────────────────────────────┐
│                 GAME LOGIC LAYER                     │
│  ┌────────────────────┐  ┌────────────────────────┐ │
│  │ Visual Game Logic  │  │   Pure Game Logic      │ │
│  │ (State Machines)   │  │   (Repositories)       │ │
│  │ État d'un fighter  │  │   Règles du combat     │ │
│  └────────────────────┘  └────────────────────────┘ │
└─────────────────────┬───────────────────────────────┘
                      │ communique uniquement avec ↓
┌─────────────────────▼───────────────────────────────┐
│                   DATA LAYER                         │
│         Persistence locale (scores, settings)        │
└─────────────────────────────────────────────────────┘
```

### Règles de couplage

1. Une couche ne communique qu'avec la couche directement en dessous
2. Communication ascendante via événements (EventBus) pour le couplage faible
3. Features isolées, communication via interfaces (traits)

---

## Structure des fichiers

```
project/
├── index.html
├── package.json
├── vite.config.js
│
├── src/
│   ├── main.js                        # Point d'entrée
│   │
│   ├── core/                          # Infrastructure partagée
│   │   ├── Game.js                    # Boucle principale, orchestration
│   │   ├── InputManager.js            # Clavier/manette → événements
│   │   ├── AssetLoader.js             # Chargement modèles 3D
│   │   └── EventBus.js                # Communication inter-features
│   │
│   ├── combat/                        # Feature: système de combat
│   │   ├── CombatRepository.js        # Règles: dégâts, hitboxes, priorités
│   │   ├── MoveRegistry.js            # Définition des coups
│   │   └── MatchState.js              # État du match (rounds, timer)
│   │
│   ├── fighter/                       # Feature: personnage générique
│   │   ├── Fighter.js                 # Composant visuel (mesh, animations)
│   │   ├── state/
│   │   │   ├── FighterStateMachine.js # Machine à états
│   │   │   └── states/
│   │   │       ├── IdleState.js
│   │   │       ├── WalkState.js
│   │   │       ├── JumpState.js
│   │   │       ├── AttackState.js
│   │   │       ├── HitStunState.js
│   │   │       └── BlockState.js
│   │   └── hitbox/
│   │       └── HitboxSystem.js        # Gestion des hitboxes
│   │
│   ├── player/                        # Feature: contrôle humain
│   │   ├── PlayerController.js        # Inputs → commandes fighter
│   │   └── PlayerFighter.js           # Fighter + contrôle humain
│   │
│   ├── ai/                            # Feature: intelligence artificielle
│   │   ├── AIController.js            # Interface IA ↔ jeu
│   │   ├── AIFighter.js               # Fighter + contrôle IA
│   │   ├── network/
│   │   │   ├── BrainNetwork.js        # Wrapper TensorFlow.js
│   │   │   └── models/                # Modèles pré-entraînés
│   │   │       ├── fighter-model.json
│   │   │       └── fighter-weights.bin
│   │   └── degradation/
│   │       ├── DegradationLayer.js    # Orchestration des limitations
│   │       ├── ReactionDelay.js       # Délai de réaction artificiel
│   │       └── DecisionNoise.js       # Erreurs probabilistes
│   │
│   ├── arena/                         # Feature: environnement
│   │   ├── Arena.js                   # Scène, sol, limites
│   │   └── Camera.js                  # Caméra de combat
│   │
│   ├── ui/                            # Feature: interface utilisateur
│   │   ├── HealthBar.js
│   │   ├── RoundIndicator.js
│   │   ├── DifficultySelector.js
│   │   └── MenuScene.js
│   │
│   └── traits/                        # Interfaces partagées
│       ├── IDamageable.js             # Peut recevoir des dégâts
│       ├── IFighterController.js      # Contrôle un fighter
│       └── IHitboxOwner.js            # Possède des hitboxes
│
├── assets/
│   ├── models/                        # Modèles 3D (.glb, .gltf)
│   ├── textures/
│   ├── animations/
│   └── audio/
│
├── tests/
│   ├── combat/
│   │   └── CombatRepository.test.js
│   ├── fighter/
│   │   └── FighterStateMachine.test.js
│   └── ai/
│       └── DegradationLayer.test.js
│
└── docs/
    └── ARCHITECTURE.md                # Ce fichier
```

---

## Système d'IA

### Approche : Modèle compétent + Dégradation contrôlée

```
┌─────────────────────────────────────────────────────┐
│              MODÈLE IA COMPÉTENT                     │
│         (Pré-entraîné, niveau expert)               │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│            DEGRADATION LAYER                         │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────────┐  │
│  │ Reaction    │ │ Decision    │ │ Information   │  │
│  │ Delay       │ │ Noise       │ │ Restriction   │  │
│  └─────────────┘ └─────────────┘ └───────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
              Actions exécutées
```

### Niveaux de difficulté

| Niveau | Délai réaction | Bruit décision | Info disponible |
|--------|----------------|----------------|-----------------|
| 1 (Facile) | 300-500ms | 40% erreurs | Position uniquement |
| 2 (Moyen) | 150-250ms | 20% erreurs | Position + état |
| 3 (Difficile) | 50-100ms | 5% erreurs | Tout + prédiction |

### Inputs du réseau de neurones

```javascript
// Vecteur d'entrée normalisé
[
  // Position relative
  distanceX,           // -1 à 1
  distanceY,           // -1 à 1
  
  // État du joueur
  playerHealth,        // 0 à 1
  playerState,         // One-hot encoded
  playerVelocityX,
  playerVelocityY,
  
  // État de l'IA
  aiHealth,            // 0 à 1
  aiState,             // One-hot encoded
  
  // Contexte
  timeRemaining,       // 0 à 1
  roundNumber          // Normalisé
]
```

### Outputs du réseau

```javascript
// Vecteur de sortie (probabilités d'actions)
[
  moveLeft,
  moveRight,
  jump,
  crouch,
  lightAttack,
  heavyAttack,
  special,
  block,
  idle
]
```

---

## Machine à états du Fighter

```
                    ┌──────────┐
                    │   IDLE   │◄─────────────────┐
                    └────┬─────┘                  │
                         │                        │
         ┌───────────────┼───────────────┐        │
         │               │               │        │
         ▼               ▼               ▼        │
    ┌─────────┐    ┌──────────┐    ┌─────────┐   │
    │  WALK   │    │   JUMP   │    │  BLOCK  │   │
    └────┬────┘    └────┬─────┘    └────┬────┘   │
         │              │               │        │
         │              ▼               │        │
         │         ┌─────────┐          │        │
         │         │  FALL   │          │        │
         │         └────┬────┘          │        │
         │              │               │        │
         └──────────────┴───────────────┴────────┘
                        │
                        ▼
                  ┌──────────┐
         ┌───────│  ATTACK  │───────┐
         │       └────┬─────┘       │
         │            │             │
         │            ▼             │
         │      ┌──────────┐        │
         └─────►│ HIT_STUN │◄───────┘
                └────┬─────┘
                     │
                     ▼
                ┌──────────┐
                │ KNOCKED  │ (si dégâts critiques)
                │  DOWN    │
                └──────────┘
```

---

## Communication entre composants

### Flux de données typique (attaque réussie)

```
1. InputManager détecte touche "attaque"
         │
         ▼
2. PlayerController reçoit l'input
         │
         ▼
3. FighterStateMachine.transition('ATTACK')
         │
         ▼
4. AttackState active hitbox
         │
         ▼
5. HitboxSystem détecte collision
         │
         ▼
6. CombatRepository.processHit(attacker, defender, move)
         │
         ├──► Calcule dégâts
         ├──► Applique dégâts via IDamageable
         └──► Émet événement 'hit' via EventBus
                    │
                    ▼
7. Defender.FighterStateMachine.transition('HIT_STUN')
         │
         ▼
8. UI.HealthBar réagit à l'événement
```

---

## Conventions de code

### Nommage

- **Classes** : PascalCase (`FighterStateMachine`)
- **Fichiers** : PascalCase pour les classes (`FighterStateMachine.js`)
- **Méthodes/fonctions** : camelCase (`processHit()`)
- **Constantes** : SCREAMING_SNAKE_CASE (`MAX_HEALTH`)
- **Événements** : kebab-case (`'fighter-hit'`, `'round-end'`)

### Structure d'une classe

```javascript
// Fighter.js
export class Fighter {
  // 1. Propriétés statiques
  static MAX_HEALTH = 100;
  
  // 2. Propriétés d'instance
  #mesh;
  #stateMachine;
  #health;
  
  // 3. Constructeur
  constructor(scene, config) {
    this.#health = Fighter.MAX_HEALTH;
    // ...
  }
  
  // 4. Getters/Setters
  get health() { return this.#health; }
  
  // 5. Méthodes publiques
  takeDamage(amount) { /* ... */ }
  
  // 6. Méthodes privées
  #playAnimation(name) { /* ... */ }
  
  // 7. Cleanup
  dispose() { /* ... */ }
}
```

---

## Dépendances npm

```json
{
  "dependencies": {
    "@babylonjs/core": "^7.x",
    "@babylonjs/loaders": "^7.x",
    "@tensorflow/tfjs": "^4.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "vitest": "^1.x"
  }
}
```

---

## Prochaines étapes

1. [ ] Setup projet (Vite + Babylon.js)
2. [ ] Core: Game loop, InputManager
3. [ ] Fighter: Mesh basique + StateMachine
4. [ ] Combat: Système de hitbox
5. [ ] Player: Contrôles humain
6. [ ] AI: Intégration TensorFlow.js
7. [ ] AI: Système de dégradation
8. [ ] UI: Barres de vie, menus
9. [ ] Polish: Animations, effets, sons

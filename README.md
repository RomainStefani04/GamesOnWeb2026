# Games on web 2026 - Cursed Battle

Jeu de combat 2.5D développé avec Babylon.js. Le jeu se joue actuellement à
deux joueurs en local.

---

## Lancer le jeu

Le jeu est dispo sur ce lien : https://games-on-web2026.vercel.app/

### Sinon pour le lancer localement :

Le projet utilise [Node.js](https://nodejs.org/) et [Vite](https://vitejs.dev/).

Une fois le git cloner :

1. Installer les dépendances :
   ```bash
   npm install
   ```
2. Lancer le jeu en mode développement :
   ```bash
   npm run dev
   ```
3. Ouvrir dans le navigateur l'adresse affichée dans le terminal
   (par défaut http://localhost:5173).

---

## Comment jouer

Le but est de mettre KO l'adversaire avant la fin du temps.
 Chaque joueur peut se déplacer, sauter (vertical, avant,
arrière), attaquer (jab, cross, coups de pied
léger et lourd, balayage, boule de feu) et bloquer.

### Contrôles

Le jeu se joue **au clavier ou à la manette**, à deux joueurs sur le même
poste. **Les touches sont paramétrables** depuis le menu des
paramètres

>Par défaut :
>
> Joueur 1 :
>   - Aller à droite (D en QWERTY et AZERTY)
>   - Aller à gauche (A en QWERTY et AZERTY)
>   - Bloquer (S en QWERTY et AZERTY)
>   - Jab (Q en QWERTY, A en AZERTY)
>   - Cross (E en QWERTY, Z en AZERTY)
>   - Coup de pied léger (F en QWERTY et AZERTY)
>   - Coup de pied lourd (G en QWERTY et AZERTY)
>   - Balayage de jambe (H en QWERTY et AZERTY)
>   - Fireball (R en QWERTY et AZERTY)
>   - Saut (W en QWERTY, Z en AZERTY)
>
>Joueur 2 :
>    - Aller à droite (Flèche droite)
>    - Aller à gauche (Flèche gauche)
>    - Bloquer (Flèche bas)
>    - Jab (Numpad1)
>    - Cross (Numpad2)
>    - Coup de pied léger (Numpad3)
>    - Coup de pied lourd (Numpad4)
>    - Balayage de jambe (Numpad5)
>    - Fireball (Numpad6)
>    - Saut (Flèche haut)

---

## Contenu actuel

Le jeu est jouable, mais encore en cours de développement (pas forcement à jour) :

- **Une seule map** est disponible pour le moment — d'autres arènes arrivent.
- **Un seul personnage** est jouable actuellement — d'autres personnages
  arrivent.
- Le mode contre l'**intelligence artificielle** n'est pas encore disponible :
  nous prévoyons d'ajouter un adversaire contrôlé par l'ordinateur.

---

## Auteurs

- Guillaume FAURE
- Romain STEFANI

---

## Documentation

Un rapport décrit le jeu de manière plus détaillée et
plus technique (architecture, choix de développement, game design).
import { Game } from './core/Game.js';

document.addEventListener('DOMContentLoaded', (e) => {
    const canvas = document.getElementById('renderCanvas');
    const game = new Game(canvas);
    game.start();
})
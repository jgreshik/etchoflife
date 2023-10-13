
let game = new EtchOfLife();

document.addEventListener('keydown', keyDownCellSizeToggleEvent(game));

game.run();

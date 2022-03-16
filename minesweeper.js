const BOMB_TILE = -1;
const FREE_TILE = 9;

let canvas, ctx;
let gameOver = false;

const createBoard = (numberOfBombs, width, height) => {
  let board = Array.from(Array(height), () => new Array(width));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      board[y][x] = FREE_TILE;
    }
  }

  for (let i = 0; i < numberOfBombs; i++) {
    let randomX = Math.floor(Math.random() * width);
    let randomY = Math.floor(Math.random() * height);

    while (board[randomY][randomX] === BOMB_TILE) {
      randomX = Math.floor(Math.random() * width);
      randomY = Math.floor(Math.random() * height);
    }

    board[randomY][randomX] = BOMB_TILE;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (board[y][x] === BOMB_TILE) continue;

      let numOfBombsAround = 0;

      for (let yy = -1; yy <= 1; yy++) {
        for (let xx = -1; xx <= 1; xx++) {
          const yOutOfBounds = y + yy < 0 || y + yy >= height;
          const xOutOfBounds = x + xx < 0 || x + xx >= width;

          if (yOutOfBounds || xOutOfBounds) continue;

          if (board[y + yy][x + xx] === BOMB_TILE) {
            numOfBombsAround++;
          }
        }
      }

      if (numOfBombsAround > 0) {
        board[y][x] = numOfBombsAround;
      }
    }
  }

  return board;
};

const createBoardMask = (width, height) => {
  let boardMask = Array.from(Array(height), () => new Array(width));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      boardMask[y][x] = false;
    }
  }
  return boardMask;
};

const createFlagMask = (width, height) => {
  let flagMask = Array.from(Array(height), () => new Array(width));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      flagMask[y][x] = false;
    }
  }
  return flagMask;
};

const getColor = (tile) => {
  switch (tile) {
    case 1:
      return "blue";
    case 2:
      return "green";
    case 3:
      return "red";
    case 4:
      return "purple";
    default:
      return "black";
  }
};

const drawBoard = (board, boardMask, flagMask) => {
  const drawOpenTile = (tile, tileSize, padding, y, x, color) => {
    ctx.font = "20px Arial";
    ctx.fillStyle = color;

    ctx.fillText(
      tile,
      x * tileSize + padding + 8,
      y * tileSize + padding + tileSize - 5
    );
  };

  const drawMaskTile = (x, y, tileSize, padding, color) => {
    const size = tileSize - 4;
    ctx.fillStyle = color;
    ctx.fillRect(
      x * tileSize + (tileSize - size) / 2,
      y * tileSize + (tileSize - size) / 2,
      size,
      size
    );
  };

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const width = canvas.width;
  const height = canvas.height;
  const tileSize = canvas.width / board.length;
  const padding = 0;

  for (let x = 0; x <= width; x += tileSize) {
    ctx.moveTo(x + padding, padding);
    ctx.lineTo(x + padding, height + padding);
  }

  for (let x = 0; x <= height; x += tileSize) {
    ctx.moveTo(padding, x + padding);
    ctx.lineTo(width + padding, x + padding);
  }

  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      const boardX = x * tileSize;
      const boardY = y * tileSize;

      if (!boardMask[y][x] && !gameOver) {
        drawMaskTile(x, y, tileSize, padding, "grey");
        if (flagMask[y][x]) {
          drawOpenTile("!!", tileSize, padding, y, x, "red");
        }
        continue;
      }

      if (board[y][x] === BOMB_TILE) {
        ctx.moveTo(boardX + padding, boardY + padding);
        ctx.lineTo(boardX + tileSize + padding, boardY + tileSize + padding);

        ctx.moveTo(boardX + padding + tileSize, boardY + padding);
        ctx.lineTo(boardX + padding, boardY + tileSize + padding);
      } else if (board[y][x] !== FREE_TILE) {
        const tile = board[y][x];
        drawOpenTile(tile, tileSize, padding, y, x, getColor(tile));
      }
    }
  }

  ctx.strokeStyle = "black";
  ctx.stroke();
};

const floodFill = (board, boardMask, x, y) => {
  const yOutOfBounds = y < 0 || y >= board.length;
  const xOutOfBounds = x < 0 || x >= board[0].length;

  if (yOutOfBounds || xOutOfBounds) return;
  if (board[y][x] !== FREE_TILE) {
    boardMask[y][x] = true;
    return;
  }
  if (boardMask[y][x] === true) return;

  boardMask[y][x] = true;

  floodFill(board, boardMask, x + 1, y);
  floodFill(board, boardMask, x - 1, y);
  floodFill(board, boardMask, x, y + 1);
  floodFill(board, boardMask, x, y - 1);
  floodFill(board, boardMask, x + 1, y - 1);
  floodFill(board, boardMask, x - 1, y + 1);
  floodFill(board, boardMask, x + 1, y + 1);
  floodFill(board, boardMask, x - 1, y - 1);
};

const getMousePos = (x, y, board) => {
  const rect = canvas.getBoundingClientRect();
  x = x - rect.left;
  y = y - rect.top;
  x /= rect.width;
  y /= rect.height;
  x *= canvas.width;
  y *= canvas.height;
  const xInt = Math.floor(x / (canvas.width / board[0].length));
  const yInt = Math.floor(y / (canvas.height / board.length));
  return [xInt, yInt];
};

const clickListener = (event, board, boardMask, flagMask) => {
  const x = event.clientX;
  const y = event.clientY;
  const [realX, realY] = getMousePos(x, y, board);

  if (flagMask[realY][realX]) {
    return;
  }

  if (board[realY][realX] === BOMB_TILE) {
    gameOver = true;
  } else {
    floodFill(board, boardMask, realX, realY);
  }

  drawBoard(board, boardMask, flagMask);
};

const rightClickListener = (event, board, boardMask, flagMask) => {
  event.preventDefault();
  const x = event.pageX;
  const y = event.pageY;
  const [realX, realY] = getMousePos(x, y, board);
  flagMask[realY][realX] = !flagMask[realY][realX];
  drawBoard(board, boardMask, flagMask);
};

const init = () => {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  const board = createBoard(40, 16, 16);
  const boardMask = createBoardMask(16, 16);
  const flagMask = createFlagMask(16, 16);
  drawBoard(board, boardMask, flagMask);
  canvas.addEventListener("click", (event) =>
    clickListener(event, board, boardMask, flagMask)
  );
  window.addEventListener("contextmenu", (event) => {
    rightClickListener(event, board, boardMask, flagMask);
  });
};

window.onload = init;

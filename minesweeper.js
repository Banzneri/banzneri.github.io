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

const createBoardMap = (width, height) => {
  let boardMap = Array.from(Array(height), () => new Array(width));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      boardMap[y][x] = false;
    }
  }
  return boardMap;
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

createFlagMap = () => {
  let flagMap = Array.from(Array(height), () => new Array(width));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      boardMap[y][x] = false;
    }
  }
  return flagMap;
};

const drawBoard = (board, boardMap) => {
  const drawTile = (tile, tileSize, padding, y, x, color) => {
    ctx.font = "20px Arial";
    ctx.fillStyle = color;

    ctx.fillText(
      tile,
      x * tileSize + padding + 8,
      y * tileSize + padding + tileSize - 5
    );
  };

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const width = canvas.width;
  const height = canvas.height;
  const tileSize = canvas.width / board.length;
  const padding = 0;

  for (let x = 0; x <= width; x += tileSize) {
    ctx.moveTo(0.5 + x + padding, padding);
    ctx.lineTo(0.5 + x + padding, height + padding);
  }

  for (let x = 0; x <= height; x += tileSize) {
    ctx.moveTo(padding, 0.5 + x + padding);
    ctx.lineTo(width + padding, 0.5 + x + padding);
  }

  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      const boardX = x * tileSize;
      const boardY = y * tileSize;

      if (!boardMap[y][x] && !gameOver) {
        drawTile(0, tileSize, padding, y, x, "black");
        continue;
      }

      if (board[y][x] === BOMB_TILE) {
        ctx.moveTo(boardX + padding, boardY + padding);
        ctx.lineTo(
          boardX + tileSize + 0.5 + padding,
          boardY + tileSize + 0.5 + padding
        );

        ctx.moveTo(boardX + padding + tileSize, boardY + padding);
        ctx.lineTo(boardX + 0.5 + padding, boardY + tileSize + 0.5 + padding);
      } else if (board[y][x] !== FREE_TILE) {
        const tile = board[y][x];
        drawTile(tile, tileSize, padding, y, x, getColor(tile));
      }
    }
  }

  ctx.strokeStyle = "black";
  ctx.stroke();
};

const floodFill = (board, boardMap, x, y) => {
  const yOutOfBounds = y < 0 || y >= board.length;
  const xOutOfBounds = x < 0 || x >= board[0].length;
  console.log(x, y);

  if (yOutOfBounds || xOutOfBounds) return;
  if (board[y][x] !== FREE_TILE) {
    boardMap[y][x] = true;
    return;
  }
  if (boardMap[y][x] === true) return;

  boardMap[y][x] = true;

  console.log(boardMap);

  floodFill(board, boardMap, x + 1, y);
  floodFill(board, boardMap, x - 1, y);
  floodFill(board, boardMap, x, y + 1);
  floodFill(board, boardMap, x, y - 1);
  floodFill(board, boardMap, x + 1, y - 1);
  floodFill(board, boardMap, x - 1, y + 1);
  floodFill(board, boardMap, x + 1, y + 1);
  floodFill(board, boardMap, x - 1, y - 1);
};

const clickListener = (event, board, boardMap) => {
  const translateMousePosition = (x, y) => {
    x /= rect.width;
    y /= rect.height;
    x *= canvas.width;
    y *= canvas.height;
    const xInt = Math.floor(x / (canvas.width / board[0].length));
    const yInt = Math.floor(y / (canvas.height / board.length));
    return [xInt, yInt];
  };

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const [realX, realY] = translateMousePosition(x, y);

  if (board[realY][realX] === BOMB_TILE) {
    gameOver = true;
  } else {
    floodFill(board, boardMap, realX, realY);
  }

  drawBoard(board, boardMap);
};

const init = () => {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  const board = createBoard(40, 16, 16);
  const boardMap = createBoardMap(16, 16);
  drawBoard(board, boardMap);
  canvas.addEventListener("mousedown", (event) =>
    clickListener(event, board, boardMap)
  );
};

window.onload = init;

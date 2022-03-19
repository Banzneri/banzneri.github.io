const BOMB_TILE = -1;
const FREE_TILE = 9;

let canvas, ctx;
let gameOver = false;

const createBoard = (numberOfBombs, width, height) => {
  let board = Array.from(Array(height), () => new Array(width));

  // Initialize board with free tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      board[y][x] = FREE_TILE;
    }
  }

  // Spawn bombs
  for (let i = 0; i < numberOfBombs; i++) {
    let randomX = Math.floor(Math.random() * width);
    let randomY = Math.floor(Math.random() * height);

    while (board[randomY][randomX] === BOMB_TILE) {
      randomX = Math.floor(Math.random() * width);
      randomY = Math.floor(Math.random() * height);
    }

    board[randomY][randomX] = BOMB_TILE;
  }

  // Calculate the number of bombs around each tile
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

const createMask = (width, height) => {
  let mask = Array.from(Array(height), () => new Array(width));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      mask[y][x] = false;
    }
  }
  return mask;
};

const createFlags = (width, height) => {
  let flags = Array.from(Array(height), () => new Array(width));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      flags[y][x] = false;
    }
  }
  return flags;
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

const drawBoard = (board, mask, flags) => {
  const drawOpenTile = (tile, tileSize, padding, y, x, color) => {
    ctx.font = "20px arial";
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

  const drawGrid = (tileSize, padding, height, width) => {
    for (let x = 0; x <= width; x += tileSize) {
      ctx.moveTo(x + padding, padding);
      ctx.lineTo(x + padding, height + padding);
    }

    for (let x = 0; x <= height; x += tileSize) {
      ctx.moveTo(padding, x + padding);
      ctx.lineTo(width + padding, x + padding);
    }

    ctx.strokeStyle = "black";
    ctx.stroke();
  };

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const width = canvas.width;
  const height = canvas.height;
  const tileSize = canvas.width / board.length;
  const padding = 0;

  drawGrid(tileSize, padding, height, width);

  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      if (!mask[y][x] && !gameOver) {
        drawMaskTile(x, y, tileSize, padding, "grey");
        if (flags[y][x]) {
          drawOpenTile("!!", tileSize, padding, y, x, "red");
        }
        continue;
      }

      if (board[y][x] === BOMB_TILE) {
        drawOpenTile("X", tileSize, padding, y, x, "black");
      } else if (board[y][x] !== FREE_TILE) {
        const tile = board[y][x];
        drawOpenTile(tile, tileSize, padding, y, x, getColor(tile));
      }
    }
  }
};

const floodFill = (board, mask, x, y) => {
  const yOutOfBounds = y < 0 || y >= board.length;
  const xOutOfBounds = x < 0 || x >= board[0].length;

  if (yOutOfBounds || xOutOfBounds) return;
  if (board[y][x] !== FREE_TILE) {
    mask[y][x] = true;
    return;
  }
  if (mask[y][x] === true) return;

  mask[y][x] = true;

  floodFill(board, mask, x + 1, y);
  floodFill(board, mask, x - 1, y);
  floodFill(board, mask, x, y + 1);
  floodFill(board, mask, x, y - 1);
  floodFill(board, mask, x + 1, y - 1);
  floodFill(board, mask, x - 1, y + 1);
  floodFill(board, mask, x + 1, y + 1);
  floodFill(board, mask, x - 1, y - 1);
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

const handleTileRevealing = (event, board, mask, flags) => {
  const checkVictory = () => {
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[0].length; x++) {
        if (!mask[y][x] && board[y][x] !== BOMB_TILE) {
          return false;
        }
      }
    }
    return true;
  };

  const x = event.clientX;
  const y = event.clientY;
  const [realX, realY] = getMousePos(x, y, board);

  if (flags[realY][realX]) return;

  if (board[realY][realX] === BOMB_TILE) {
    gameOver = true;
  } else {
    floodFill(board, mask, realX, realY);
  }

  drawBoard(board, mask, flags);

  if (checkVictory()) {
    alert("Victory");
    return;
  }
};

const handleFlags = (event, board, mask, flags) => {
  event.preventDefault();
  const x = event.pageX;
  const y = event.pageY;
  const [realX, realY] = getMousePos(x, y, board);
  flags[realY][realX] = !flags[realY][realX];
  drawBoard(board, mask, flags);
};

const init = () => {
  const width = 16;
  const height = 16;
  const bombs = 40;
  const board = createBoard(bombs, width, height);
  const mask = createMask(width, height);
  const flags = createFlags(width, height);

  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  drawBoard(board, mask, flags);

  canvas.addEventListener("click", (event) =>
    handleTileRevealing(event, board, mask, flags)
  );
  window.addEventListener("contextmenu", (event) => {
    handleFlags(event, board, mask, flags);
  });
};

window.onload = init;

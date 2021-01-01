const express = require("express");
const http = require("http");
const sockets = require("socket.io");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const io = sockets(server);

const port = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use(
  cors({
    origin: "*",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

var lastUser = 0;
var userCount = 0;
var canvas = { width: 800, height: 800 };
var gameOver = true;
var grid = 25;
var snakes = [];

var food = { x: 0, y: 0, color: "yellow" };

server.listen(port, () => {
  generateFood();
  snakes.push({
    headColor: "#3dff47",
    bodyColor: "green",
    direction: "right",
    prevDirection: "right",
    x: 5 * grid,
    y: 5 * grid,
    cells: [
      { x: 5 * grid, y: 5 * grid },
      { x: 5 * grid - grid, y: 5 * grid },
    ],
  });
  snakes.push({
    headColor: "#ff36a8",
    bodyColor: "#75008f",
    direction: "up",
    prevDirection: "up",
    x: canvas.width - 5 * grid,
    y: canvas.height - 5 * grid,
    cells: [
      { x: canvas.width - 5 * grid, y: canvas.height - 5 * grid },
      { x: canvas.width - 5 * grid, y: canvas.height - 5 * grid + grid },
    ],
  });
});

function stopGame() {
  gameOver = true;
  snakes = [];
  snakes.push({
    headColor: "#3dff47",
    bodyColor: "green",
    direction: "right",
    prevDirection: "right",
    x: 5 * grid,
    y: 5 * grid,
    cells: [
      { x: 5 * grid, y: 5 * grid },
      { x: 5 * grid - grid, y: 5 * grid },
    ],
  });
  snakes.push({
    headColor: "#ff36a8",
    bodyColor: "#75008f",
    direction: "up",
    prevDirection: "up",
    x: canvas.width - 5 * grid,
    y: canvas.height - 5 * grid,
    cells: [
      { x: canvas.width - 5 * grid, y: canvas.height - 5 * grid },
      { x: canvas.width - 5 * grid, y: canvas.height - 5 * grid + grid },
    ],
  });
  generateFood();
  io.emit("snakes", snakes);
  io.emit("updatedFood", food);
}

io.on("connection", function (socket) {
  if (userCount < 2) {
    let obj = {
      index: Math.abs(lastUser - 1),
      snakeArray: snakes,
      food: food,
    };
    console.log(obj.index);
    socket.emit("playerConnect", obj);
    userCount++;
    //console.log("User connnected", userCount);
    lastUser = Math.abs(lastUser - 1);
  }
  socket.on("disconnect", () => {
    userCount--;
    //console.log("User disconnnected", userCount);
  });
  socket.on("gameStart", () => {
    if (gameOver) {
      gameOver = false;
      autoMove();
    }
    gameOver = false;
  });
  socket.on("gameOver", () => {
    stopGame();
    socket.broadcast.emit("gameIsOver");
    //io.emit('gameIsOver')
  });
  socket.on("foodChanged", () => {
    generateFood();
    io.emit("updatedFood", food);
  });
  socket.on("directionChange", (direction, index) => {
    snakes[index].direction = direction;
  });
});

function generateRandomCoordinate(min, max) {
  return grid * Math.floor(Math.random() * (max - min) + min);
}

function checkForSnakeBody() {
  for (let i = 0; i < snakes.length; i++) {
    for (let j = 0; j < snakes[i].cells.length; j++) {
      if (snakes[i].cells[j].x == food.x && snakes[i].cells[j].y == food.y) {
        return false;
      }
    }
  }
  return true;
}

function generateFood() {
  food.x = generateRandomCoordinate(0, canvas.width / grid - 1);
  food.y = generateRandomCoordinate(0, canvas.height / grid - 1);

  while (!checkForSnakeBody()) {
    food.x = generateRandomCoordinate(0, canvas.width / grid - 1);
    food.y = generateRandomCoordinate(0, canvas.height / grid - 1);
  }
}

function moveSnake(index) {
  let dx = 0,
    dy = 0;
  switch (snakes[index].direction) {
    case "left":
      dx = -grid;
      break;
    case "up":
      dy = -grid;
      break;
    case "right":
      dx = grid;
      break;
    case "down":
      dy = grid;
      break;
  }

  if (snakes[index].x + dx > canvas.width - grid) snakes[index].x = 0;
  else if (snakes[index].x + dx < 0) snakes[index].x = canvas.width - grid;
  else snakes[index].x += dx;

  if (snakes[index].y + dy > canvas.height - grid) snakes[index].y = 0;
  else if (snakes[index].y + dy < 0) snakes[index].y = canvas.height - grid;
  else snakes[index].y += dy;

  snakes[index].cells.unshift({ x: snakes[index].x, y: snakes[index].y }); // Insert at 0th position
  if (snakes[index].x == food.x && snakes[index].y == food.y) {
    io.emit("updatedFood", food);
  } else snakes[index].cells.pop(); // remove the last element
}

function autoMove() {
  if (gameOver) {
    io.emit("gameOver");
    return;
  }
  for (let i = 0; i < snakes.length; i++) {
    moveSnake(i);
    snakes[i].prevDirection = snakes[i].direction;
  }
  io.emit("snakes", snakes);
  if (!gameOver) setTimeout(autoMove, 200);
}

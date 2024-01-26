const express = require("express");
const app = express();
const server = app.listen(process.env.PORT || 3000);
app.use(express.static("public"));
const socket = require("socket.io");
const io = socket(server);



/////////////////// ----------> INITIALIZATION <--------- /////////////////

let games = [];
let gameId = 0;
let players = [];
let ballState = {
  pos: { x: 20, y: 20 },
  vel: { x: 3, y: 3 },
};
let previousBallState = ballState;
let currentBallState = { ...previousBallState };
let isGameReady = false;
let player1Ready = false;
let player2Ready = false;
let ballDirection = 1;
let w, h, p1x, p1y, p1w, p1h, p2x, p2y, p2w, p2h;
let isIntervalRunning = false;
let p1s = 0;
let p2s = 0;
let startVelX = 3;
let startVelY = 2;
let waitingRoom = [];
let playerNumber;
class Game {
  constructor() {
    this.players = [];
    this.ball = { pos: { x: 20, y: 20 }, vel: { x: startVelX, y: startVelY } };
    this.scores = { p1: 0, p2: 0 };
    this.id = gameId;
    this.recentPaddlePositions = {
      p1x: 0,
      p2x: 0,
    };
  }
}



/////////////  ------------>   GAME LOGIC   <-------------  /////////////////

io.sockets.on("connection", function (socket) {
  players.push(socket.id);

  socket.on("gameVariables", (gameVariables) => {
    w = gameVariables.width;
    h = gameVariables.height;
    p1x = gameVariables.p1x;
    p1y = gameVariables.p1y;
    p1w = gameVariables.p1w;
    p1h = gameVariables.p1h;
    p2x = gameVariables.p2x;
    p2y = gameVariables.p2y;
    p2h = gameVariables.p2h;
    p2w = gameVariables.p2w;
  });

  socket.on("playerReady", () => {
    waitingRoom.push(socket.id);

    if (waitingRoom.length === 1) {
      playerNumber = 1;
      socket.emit("playerNumber", playerNumber);
    } else if (waitingRoom.length === 2) {
      playerNumber = 2;
      gameId++;
      socket.emit("playerNumber", playerNumber);
      let game = new Game();
      game.players = waitingRoom.splice(0, 2); // Move players from room to game
      game.id = gameId;
      game.recentPaddlePositions.x = 200;
      game.recentPaddlePositions.y = 200;
      game.players.forEach((playerId) => {
        io.to(playerId).emit("gameId", { id: gameId });
      });
      games.push(game);

      // Notify players that the game is ready to start (Start Counter)
      game.players.forEach((playerId) => {
        io.to(playerId).emit("gameReady");
      });
      isGameReady = true;
    }
  });

  socket.on("paddlePosition", (data) => {
    const currentGame = games.find((game) => game.players.includes(socket.id));
    if (!currentGame) {
      return; // Player is not associated with any game
    }
    // Update the paddle position for the respective player in the game
    if (data.playerNumber === 1) {
      currentGame.recentPaddlePositions.p1x = data.x;
    } else if (data.playerNumber === 2) {
      currentGame.recentPaddlePositions.p2x = data.x;
    }

    // Emit the updated paddle positions to all players in the game
    currentGame.players.forEach((playerId) => {
      io.to(playerId).emit("otherPlayerPosition", {
        playerNumber: data.playerNumber,
        x: data.x,
      });
    });
  });

  socket.on("disconnect", () => {
    isGameReady = false;
    player1Ready = false;
    player2Ready = false;
    io.emit("onePlayerDisconnect");
    // Find the game the disconnected player is in
    const currentGame = games.find((game) => game.players.includes(socket.id));

    if (currentGame) {
      // Disconnect both players from the game
      currentGame.players.forEach((playerId) => {
        io.to(playerId).emit("opponentDisconnected");
        const playerSocket = io.sockets.sockets.get(playerId);
        playerSocket.disconnect(true);
      });

      // Remove the game from the games array
      const gameIndex = games.indexOf(currentGame);
      if (gameIndex !== -1) {
        games.splice(gameIndex, 1);
      }
    }
  });
});

///////////////////////     Main game loop    ///////////////////////

setInterval(function () {
  if (!isGameReady) {
    return; 
  }
  games.forEach((game) => {
    if (!isIntervalRunning) {
      isIntervalRunning = true;

      // Ball movement logic using the ball property of the game
      game.ball.pos.x += game.ball.vel.x;
      game.ball.pos.y += game.ball.vel.y;

      // Bounce off walls
      if (game.ball.pos.x >= w || game.ball.pos.x <= 0) {
        game.ball.vel.x *= -1;
      }

      // Set speed back to 0 if missed with paddle & Update score
      if (game.ball.pos.y >= h || game.ball.pos.y <= 0) {
        if (Math.sign(game.ball.vel.y) === 1) {
          game.scores.p1 += 1;
          game.ball.pos.y = h - 1;
          game.ball.vel.y = -1 * startVelY;
          if (Math.sign(game.ball.vel.x) === 1) {
            game.ball.vel.x = startVelX;
          } else if (Math.sign(game.ball.vel.x) === -1) {
            game.ball.vel.x = -1 * startVelX;
          }
          game.players.forEach((playerId) => {
            io.to(playerId).emit("p1Scored", game.scores);
          });
        } else if (Math.sign(game.ball.vel.y) === -1) {
          game.scores.p2 += 1;
          game.players.forEach((playerId) => {
            io.to(playerId).emit("p2Scored", game.scores);
          });
          game.ball.pos.y = 1;
          game.ball.vel.y = startVelY;
          if (Math.sign(game.ball.vel.x) === 1) {
            game.ball.vel.x = startVelX;
          } else if (Math.sign(game.ball.vel.x) === -1) {
            game.ball.vel.x = -1 * startVelX;
          }
          game.players.forEach((playerId) => {
            io.to(playerId).emit("p2Scored", game.scores);
          });
        }
      }

      // Bounce off paddles and speed up
      if (game.ball.pos.y <= p1h + p1y && Math.sign(game.ball.vel.y) === -1) {
        if (
          game.ball.pos.x > game.recentPaddlePositions.p1x &&
          game.ball.pos.x < game.recentPaddlePositions.p1x + p1w
        ) {
          game.ball.pos.y = p1h + p1y + 5;
          game.ball.vel.y *= -1.25;
          if (game.ball.pos.x > game.recentPaddlePositions.p1x + p1w * 0.85) {
            if (Math.sign(game.ball.vel.x) === -1) {
              game.ball.vel.x *= -1.25;
            } else {
              game.ball.vel.x *= 1.25;
            }
          }
          if (game.ball.pos.x < game.recentPaddlePositions.p1x + p1w * 0.15) {
            if (Math.sign(game.ball.vel.x) === -1) {
              game.ball.vel.x *= 1.25;
            } else {
              game.ball.vel.x *= -1.25;
            }
          }
        }
      }
      if (game.ball.pos.y > p2y && Math.sign(game.ball.vel.y) === 1) {
        if (
          game.ball.pos.x > game.recentPaddlePositions.p2x &&
          game.ball.pos.x < game.recentPaddlePositions.p2x + p2w
        ) {
          game.ball.pos.y = p2y - 1;
          game.ball.vel.y *= -1.25;
          if (game.ball.pos.x > game.recentPaddlePositions.p2x + p2w * 0.85) {
            if (Math.sign(game.ball.vel.x) === -1) {
              game.ball.vel.x *= -1.25;
            } else {
              game.ball.vel.x *= 1.25;
            }
          }
          if (game.ball.pos.x < game.recentPaddlePositions.p2x + p2w * 0.15) {
            if (Math.sign(game.ball.vel.x) === -1) {
              game.ball.vel.x *= 1.25;
            } else {
              game.ball.vel.x *= -1.25;
            }
          }
        }
      }
      isIntervalRunning = false;
    }
    // End of inner game loop logic.
    // Now we emit the status to each player:

    game.players.forEach((playerId) => {
      io.to(playerId).emit("gameState", game);
    });
  });
}, 10);

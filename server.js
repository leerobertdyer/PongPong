import express from 'express'
import { Server } from 'socket.io'
import { createServer } from "node:http"
import cors from "cors"
import dotenv from 'dotenv'
dotenv.config()

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['https://pongdong.glitch.me', 'http://127.0.0.1:5500'],
    methods: ["GET", "POST"]
  }
})

const allowedOrigins = ['https://pongdong.glitch.me', 'http://127.0.0.1:5500'];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions))

server.listen(process.env.PORT, () => {
  console.log(`Server listening at port ${process.env.PORT}`)
})

// app.use(express.static("public"));  <---- might still need this for glitch...



/////////////////// ----------> INITIALIZATION <--------- /////////////////

let games = [];
let gameId = 0;
let players = [];
let w, h, p1x, p1y, p1w, p1h, p2x, p2y, p2w, p2h, blocks;
let startVelX = 3;
let startVelY = 2;
let waitingRoom = [];
let playerNumber;

class Game {
  constructor() {
    this.id = gameId;
    this.players = [];
    this.scores = { p1: 0, p2: 0 };
    this.blocks = {};
    this.ball = { pos: { x: 20, y: 20 }, vel: { x: startVelX, y: startVelY } };
    this.recentPaddlePositions = {
      p1x: 0,
      p2x: 0,
    },
      this.player1Ready = false;
    this.player2Ready = false;
    this.isGameReady = false;
    this.isIntervalRunning = false;
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
    blocks = gameVariables.blocks;
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
      game.players = waitingRoom.splice(0, 2);
      game.id = gameId;
      game.blocks = blocks;
      game.recentPaddlePositions.x = 200;
      game.recentPaddlePositions.y = 200;
      games.push(game);

      // Notify players that the game is ready to start (Start Counter)
      game.players.forEach((playerId) => {
        io.to(playerId).emit("gameReady");
      });

      socket.on("countdownOver", () => {
        game.ball.vel.x = startVelX;
        game.ball.vel.y = startVelY;
        game.isGameReady = true;
      });
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
    const currentGameIndex = games.findIndex((game) =>
      game.players.includes(socket.id)
    );
    if (currentGameIndex !== -1) {
      const currentGame = games[currentGameIndex];
      const disconnectedPlayerId = socket.id;
      const remainingPlayerId = currentGame.players.find(
        (playerId) => playerId !== disconnectedPlayerId
      );
      if (remainingPlayerId) {
        io.to(remainingPlayerId).emit("playerDisconnected");
        games.splice(currentGameIndex, 1);
        gameId--;
      }
    }
  });
});

///////////////////////     Main game loop    ///////////////////////

setInterval(function () {
  games.forEach((game) => {
    if (!game.isGameReady) {
      return;
    }
    if (!game.isIntervalRunning) {
      game.isIntervalRunning = true;

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

      // Bounce off blocks and remove blocks
      if (blocks.length > 0) {
        for (let i = 0; i < game.blocks.length; i++) {
          let currentBlock = game.blocks[i];
          if (Math.sign(game.ball.vel.y) === 1 && currentBlock.y > h / 2) {
            if (
              game.ball.pos.y >= currentBlock.y &&
              game.ball.pos.x >= currentBlock.x &&
              game.ball.pos.x <= currentBlock.x + currentBlock.w
            ) {
              game.ball.vel.y *= -1;
              game.blocks.splice(i, 1);
            }
          }
          if (Math.sign(game.ball.vel.y) === -1 && currentBlock.y < h / 2) {
            if (
              game.ball.pos.y <= currentBlock.y + currentBlock.h &&
              game.ball.pos.x >= currentBlock.x &&
              game.ball.pos.x <= currentBlock.x + currentBlock.w
            ) {
              game.ball.vel.y *= -1;
              game.blocks.splice(i, 1);
            }
          }
        }
        game.players.forEach((playerId) => {
          io.to(playerId).emit("blocks", game.blocks);
        });
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
      game.isIntervalRunning = false;
    }

    // End of inner game loop logic.
    // Now we emit the status to each player:

    game.players.forEach((playerId) => {
      io.to(playerId).emit("gameState", game);
    });
  });
}, 10);

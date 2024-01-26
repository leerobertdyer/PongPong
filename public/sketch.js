let rectX = 15;
let rectY = 20;
let rectW = 25;
let rectH = 25;
let v;
let direction;
let ball;
let p1;
let p2;
let p1s;
let p2s;
var r = 255;
var g = 255;
var b = 255;
let playerNumber;
let socket;
const main = document.getElementById('main')
console.log(window.innerWidth)
console.log('here: ', main.style.width)
let w = window.innerHeight * .75;
let h = w * .75;


function setup() {
  createCanvas(w, h);
  ball = new Ball(30, 30, 20);
  p1 = new Paddle(w / 2, 5, 20, 80);
  p2 = new Paddle(w / 2, h - 25, 20, 80);
  v = createVector(1, 1);
  socket = io.connect("http://localhost:3000");

  document.getElementById("startButton").addEventListener("click", () => {
    socket.emit("playerReady");
    document.getElementById("startButton").disabled = true;
  });

  socket.on("connect", function () {
    socket.emit("gameVariables", {
      width: w,
      height: h,
      p1x: p1.x,
      p1y: p1.y,
      p1h: p1.h,
      p1w: p1.w,
      p2x: p2.x,
      p2y: p2.y,
      p2h: p2.h,
      p2w: p2.w,
    });
  });
  socket.on('gameId', function (data) {
    const gameId = data.id;
    document.getElementById('gameId').innerHTML = `Game ID: ${gameId}`
  });
  socket.on("playerNumber", function (number) {
    playerNumber = number;
  });

  socket.on("otherPlayerPosition", function (data) {
    if (data.playerNumber === 1) {
      p1.x = data.x;
    } else {
      p2.x = data.x;
    }
  });

  socket.on("gameState", function (gameState) {
    ball.pos.x = gameState.ball.pos.x;
    ball.pos.y = gameState.ball.pos.y;
    ball.vel.x = gameState.ball.vel.x;
    ball.vel.y = gameState.ball.vel.y;
  });

  socket.on("p1Scored", function (scores) {
    document.getElementById("pong").innerHTML = "Player One Scored!";
    document.getElementById("pong").style.backgroundColor = "red";
    document.getElementById('p1s').innerHTML = scores.p1
    timer = millis();
    timerCheck = true;
  });

  socket.on("p2Scored", function (scores) {
    document.getElementById("pong").innerHTML = "Player Two Scored!";
    document.getElementById("pong").style.backgroundColor = "red";
    document.getElementById('p2s').innerHTML = scores.p2
    timer = millis();
    timerCheck = true;
  });

  socket.on("onePlayerDisconnect", () => {
    document.getElementById("startButton").disabled = false;
  });
}

function changeColor() {
  r = random(255);
  g = random(0);
  b = random(0);
}

class Ball {
  constructor(x, y, d) {
    this.pos = createVector(x, y);
    this.d = d;
    this.vel = createVector(4, 4);
  }

  draw() {
    fill(r, g, b);
    circle(this.pos.x, this.pos.y, this.d);
  }
}

class Paddle {
  constructor(x, y, h, w) {
    this.x = x;
    this.y = y;
    this.h = h;
    this.w = w;
  }
  draw() {
    fill(222, 188, 155);
    rect(this.x, this.y, this.w, this.h);
  }

  move() {
    this.x = mouseX;
    if (this.x > w - (this.w + 5)) {
      this.x = w - (this.w + 5);
    }
    if (this.x <= 0) {
      this.x = 0;
    }
  }
}

function mouseMoved() {
  if (playerNumber === 1) {
    p1.move();
    sendPaddle(p1.x);
  } else if (playerNumber === 2) {
    p2.move();
    sendPaddle(p2.x);
  }
}

function sendPaddle(paddleX) {
  const data = {
    playerNumber: playerNumber,
    x: paddleX,
  };
  socket.emit("paddlePosition", data);
}

let timerCheck = false;
let timer = 0;
let pH = 0;

function draw() {
  background(100, 200, 100);
  if (millis() - timer < 400 && millis() - timer > 0){
    changeColor()
  }
  if (millis() - timer > 400) {
    timerCheck = false;
    document.getElementById("pong").innerHTML = "Pong Pong"; // Reset the message
    document.getElementById("pong").style.backgroundColor = "black"; // Reset the background color
    r = 255;
    g = 255;
    b = 255;
  }

  strokeWeight(15);
  line(0, 0, 0, h);
  line(w, 0, w, h);
  line(0, 0, w, 0);
  line(0, h, w, h);
  strokeWeight(1);
  ball.draw();
  p1.draw();
  p2.draw();
}

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
let w = window.innerHeight * .85;
let h = w * .75;
let blocks = [];

function setup() {
  createCanvas(w, h);
  ball = new Ball(30, 30, 20);
  p1 = new Paddle(w / 2, 5, 20, 80);
  p2 = new Paddle(w / 2, h - 25, 20, 80);
  b1 = new Block(0, 0, 20, w / 5, 255, 255, 0);
  b2 = new Block((1 / 5) * w, 0, 20, w / 5, 255, 100, 0);
  b3 = new Block((2 / 5) * w, 0, 20, w / 5, 155, 77, 67);
  b4 = new Block((3 / 5) * w, 0, 20, w / 5, 98, 244, 255);
  b5 = new Block((4 / 5) * w, 0, 20, w / 5, 29, 199, 100);
  b6 = new Block(0, h - 20, 20, w / 5, 255, 255, 0);
  b7 = new Block((1 / 5) * w, h - 20, 20, w / 5, 255, 100, 0);
  b8 = new Block((2 / 5) * w, h - 20, 20, w / 5, 155, 77, 67);
  b9 = new Block((3 / 5) * w, h - 20, 20, w / 5, 98, 244, 255);
  b10 = new Block((4 / 5) * w, h - 20, 20, w / 5, 0, 20, 88);
  blocks.push(b1, b2, b3, b4, b5, b6, b7, b8, b9, b10);
  v = createVector(1, 1);
  let url = window.location.href
  if (!(url.includes("pongpong.glitch.me/"))) {
    url = 'http://localhost:3000'
  }
  socket = io.connect(url);

  document.getElementById("startButton").addEventListener("click", () => {
    document.getElementById("startButton").disabled = true;
    document.getElementById('waitingForOtherDiv').style.display="block"

    socket.emit("playerReady");
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
      blocks: blocks,
    });
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

  socket.on("blocks", (blockUpdate) => {
    const blockDataArray = blockUpdate;
    blocks = blockDataArray.map((blockData) => {
      return new Block(
        blockData.x,
        blockData.y,
        blockData.h,
        blockData.w,
        blockData.r,
        blockData.g,
        blockData.b
      );
    });
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

  socket.on("gameReady", () => {
    document.getElementById('waitingForOtherDiv').style.display="none"    
    document.getElementById("startButton").style.display = "none";
    document.getElementById("countdown").style.display = "block";
      setTimeout(() => {
        document.getElementById("countdown3").style.display = "none";
        document.getElementById('countdown2').style.display = "block";
      }, 1000)
      setTimeout(() => {
        document.getElementById('countdown2').style.display = "none";
        document.getElementById('countdown1').style.display = "block";
      }, 2000)
      setTimeout(() => {
        socket.emit('countdownOver')
        document.getElementById('countdown1').style.display = "none";
      }, 3000)  
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

class Block {
  constructor(x, y, h, w, r, g, b) {
    this.x = x;
    this.y = y;
    this.h = h;
    this.w = w;
    this.r = r;
    this.g = g;
    this.b = b;
  }
  draw() {
    fill(this.r, this.g, this.b);
    rect(this.x, this.y, this.w, this.h);
  }
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

  if (blocks.length > 0) {
    for (const block of blocks) {
      block.draw();
    }
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

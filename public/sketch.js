// I'll need an object for each socket.emit for instance:
// for the paddle I'll need just const move{x: mouseX}
// alternatively mouseX could be the x position of each paddle
// I'll also need one for the ball: const ball{x: ballX, y: ballY}
// Then looks like I'l need to use socket.emit('paddle1', move)
// socket.emit('ball', ball)

let rectX = 15;
let rectY = 20;
let rectW = 25;
let rectH = 25;
let w = 600;
let h = 600;
let p1Score = 0;
let p2Score = 0;
let v;
var r = 255;
var g = 144;
var b = 0;



let playerNumber; // To store the player's assigned number
let player; // To store the player object
let opponent; // To store the opponent object
let socket;

function setup() {
  createCanvas(w, h);
  ball = new Ball(30, 30, 20);
  p1 = new Paddle(25, 5, 20, 80);
  p2 = new Paddle(15, h - 25, 20, 80);
  v = createVector(1, 1);
  socket = io.connect('http://localhost:3000')

  socket.on('playerNumber', function (number) {
    playerNumber = number;
    console.log(playerNumber);
  })

socket.on('ballPositionFromServer', function(ballpos){
  if (playerNumber === 2) {
    console.log('Ball Pos: ' + ballpos.x + " " + ballpos.y)
    ball.pos.x = ballpos.x; 
    ball.pos.y = ballpos.y;
  }
})

  socket.on('otherPlayerPosition', function (x) {
    if (playerNumber === 1) {
      p2.x = x
    }
    else {
      p1.x = x
    }
  })

}


function changeColor(){
  r += .5
  if (r >= 255) {
    r = r * -1;
  }
  g + .2
  if (g >= 255){
    g = g * -1;
  }
  b += .1;
  if (b >=255){
    b = b * -1;
  }
}

class Ball {
  constructor(x, y, d) {
    this.pos = createVector(x, y);
    this.d = d;
    this.vel = createVector(4, 4);
  }

  draw() {
    fill(255);
    circle(this.pos.x, this.pos.y, this.d);
  }

  move() {
    this.pos.add(this.vel);
    if (this.pos.x >= w) {
      this.vel.mult(-1, 1);
    } else if (this.pos.x <= 0) {
      this.vel.mult(-1, 1);
    }
  }

  bounce(p) {
    if (this.pos.y <= p.y + p.h) {
      if (this.pos.x > p.x && this.pos.x < p.x + p.w) {
        this.vel.mult(1, -1);
      }
    }
  }
  bounce2(p) {
    if (this.pos.y >= p.y) {
      if (this.pos.x > p.x && this.pos.x < p.x + p.w) {
        this.vel.mult(1, -1);
      }
    }
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
  // move2() {
  //   if (keyIsDown(RIGHT_ARROW)) {
  //     if (this.x < w - (this.w + 5)) {
  //       this.x += 10;
  //     }
  //   }
  //   if (keyIsDown(LEFT_ARROW)) {
  //     if (this.x >= 15) {
  //       this.x -= 10;
  //     }
  //   }
  // }
}


let direction;
let ball;
let p1;
let p2;


function mouseMoved() {
  sendPaddle(mouseX)
  if (playerNumber === 1) {
    p1.move();
    sendPaddle(p1.x)
  }
  else if (playerNumber === 2) {
    p2.move()
    sendPaddle(p2.x)
  }
}

function sendPaddle(paddleX) {
  const data = paddleX;
  socket.emit('paddlePosition', data);
}

function ballMove(ballX, ballY, score) {
  ball.pos.x = ballX;
  ball.pos.y = ballY;

  const data = { x: ballX, y: ballY }
  socket.emit('ballPosition', data)
}




function draw() {
changeColor()
  background(r, g, b);
  strokeWeight(15);
  line(0, 0, 0, h);
  line(w, 0, w, h);
  line(0, 0, w, 0);
  line(0, h, w, h);
  strokeWeight(1);
  if (playerNumber === 1){
    ball.move();
    ballMove(ball.pos.x, ball.pos.y);
  }
  if (ball.pos.y >= h) {
    ball.pos.y = 0;
    p1Score += 1;
    document.getElementById("score1").innerHTML = p1Score;

    //this.vel.mult(1, -1);
  } else if (ball.pos.y <= 0) {
    ball.pos.y = h;
    p2Score += 1;
    document.getElementById("score2").innerHTML = p2Score;
    //this.vel.mult(1, -1);
  }

  p1.draw();

  ball.draw();
  ball.bounce(p1);
  p2.draw();
  // p2.move2();
  ball.bounce2(p2);

  /* 
 
 if(rectX === (w-rectW)) {
    direction.x =-15;
  } else if (rectX <= 0) {
    direction.x = 15;
  }
  if(rectY === (h-rectH)){
    direction.y = -7;
  } else if (rectY <= 0){
    direction.y = 7;
  }
  
*/
}

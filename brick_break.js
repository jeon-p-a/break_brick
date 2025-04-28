let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");

let canvasWidth = 800;
let canvasHeight = 600;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

var window_width = canvasWidth;
var window_height = canvasHeight;

canvas.style.background = "#0d3667";

class Paddle {
    constructor(x, y, width, height, color, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = speed;

        this.acceleration = 0.7;
        this.maxSpeed = 8;
        this.friction = 0.2;

        this.dx = 0;
    }

    draw(context) {
        context.beginPath();
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
        context.closePath();
    }

    move() {
        if (rightPressed) {
            this.dx += this.acceleration;
        } else if (leftPressed) {
            this.dx -= this.acceleration;
        } else {
            // 키를 안 누르면 서서히 감속
            if (this.dx > 0) {
                this.dx -= this.friction;
                if (this.dx < 0) this.dx = 0;
            } else if (this.dx < 0) {
                this.dx += this.friction;
                if (this.dx > 0) this.dx = 0;
            }
        }
    
        // 속도 제한
        if (this.dx > this.maxSpeed) this.dx = this.maxSpeed;
        if (this.dx < -this.maxSpeed) this.dx = -this.maxSpeed;
    
        this.x += this.dx;
    
        if (this.x < 0) {
            this.x = 0;
            this.dx = 0;
        }
        if (this.x + this.width > window_width) {
            this.x = window_width - this.width;
            this.dx = 0;
        }
    }

    update(context) {
        this.move();
        this.draw(context);
    }
}


class Ball {
    constructor(x, y, radius, color, speed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;

        this.dx = speed;
        this.dy = -speed;

    }

    draw(context) {
        context.beginPath();
        context.fillStyle = this.color;
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        context.fill();
        context.closePath();
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        // 좌우 벽 반사
        if (this.x - this.radius < 0 || this.x + this.radius > window_width) {
            this.dx = -this.dx;
        }

        // 위쪽 벽 반사
        if (this.y - this.radius < 0) {
            this.dy = -this.dy;
        }

        this.draw(context);
    }
    
}
class Brick {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.status = 1; // 1->안깨짐, 0->꺠짐
    }

    draw(context) {
        if (this.status === 1) {
            context.beginPath();
            context.fillStyle = this.color;
            context.fillRect(this.x, this.y, this.width, this.height);
            context.closePath();
        }
    }
}


let paddle, ball, bricks;
let brickRowCount = 5, brickColumnCount = 7;
let brickWidth = 75, brickHeight = 25, brickPadding = 10;
let brickOffsetTop = 30, brickOffsetLeft = 100;
let score;
let totalBricks = brickColumnCount * brickRowCount;
let rightPressed = false, leftPressed = false;
let animationId;


document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
    if (e.key === "Right"|| e.key==="ArrowRight") rightPressed = true;
    if (e.key === "Left" || e.key==="ArrowLeft") leftPressed = true;
}
function keyUpHandler(e) {
    if (e.key === "Right"|| e.key==="ArrowRight") rightPressed = false;
    if (e.key === "Left" || e.key==="ArrowLeft") leftPressed = false;
}

// 게임 객체들을 (재)생성
function init() {
    paddle = new Paddle(canvasWidth/2-50, canvasHeight-30, 150,10,"#d5d5f0",9);
    ball   = new Ball(canvasWidth/2, canvasHeight-50, 10,"#ffffff",6);
    score = 0;
    totalBricks = brickRowCount * brickColumnCount;
    // 벽돌 배열 초기화
    bricks = [];
    for (let c=0; c<brickColumnCount; c++) {
        bricks[c] = [];
        for (let r=0; r<brickRowCount; r++) {
            let x = c*(brickWidth+brickPadding)+brickOffsetLeft;
            let y = r*(brickHeight+brickPadding)+brickOffsetTop;
            bricks[c][r] = new Brick(x,y,brickWidth,brickHeight,'#f6f692');
        }
    }
}


// 충돌 검사
function collisionDetection() {
    for (let c=0; c<brickColumnCount; c++) {
        for (let r=0; r<brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status &&
                ball.x + ball.radius > b.x && ball.x - ball.radius < b.x + b.width &&
                ball.y + ball.radius > b.y && ball.y - ball.radius < b.y + b.height){

                let overlapLeft = ball.x + ball.radius - b.x;
                let overlapRight = b.x + b.width - (ball.x - ball.radius);
                let overlapTop = ball.y + ball.radius - b.y;
                let overlapBottom = b.y + b.height - (ball.y - ball.radius);

                let minOverlapX = Math.min(overlapLeft, overlapRight);
                let minOverlapY = Math.min(overlapTop, overlapBottom);

                if (minOverlapX < minOverlapY) {
                    ball.dx = -ball.dx;
                } else {
                    ball.dy = -ball.dy; 
                }

                b.status = 0;
                score++;

                if (score === totalBricks) {
                    Sleep(100);
                    cancelAnimationFrame(animationId);
                    if (confirm("You Win! Try Again?")) {
                        init();
                        updateGame();
                    }
                }
            }
        }
    }
}

function updateGame() {
    context.clearRect(0,0,canvasWidth,canvasHeight);
    context.font="16px Arial"; context.fillStyle="#f6f692";
    context.fillText("Score: "+score,8,20);

    // 패들 이동
    paddle.dx = rightPressed ? paddle.speed : leftPressed ? -paddle.speed : 0;
    paddle.update(context);
    ball.update(context);

    collisionDetection();

    // 바닥에 떨어졌을 때
    if (ball.y + ball.radius > canvasHeight) {
        cancelAnimationFrame(animationId);
        if (confirm("Game Over. Try Again?")) {
            init();
            updateGame();
            return;
        }
    }

    // 패들에 부딪힘
    if (ball.y + ball.radius > paddle.y-paddle.height/2 &&
        ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
        ball.dy = -ball.dy;
        ball.y = paddle.y - ball.radius;
    }

    // 벽돌 그리기
    for (let c=0; c<brickColumnCount; c++)
        for (let r=0; r<brickRowCount; r++)
            bricks[c][r].draw(context);

    animationId = requestAnimationFrame(updateGame);
}

// 최초 게임 시작
init();
updateGame();
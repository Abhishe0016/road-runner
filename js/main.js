const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let gameOverMessage = document.getElementById("gameOverMessage");
let scoreDisplay = document.getElementById("scoreDisplay");

const blockObstacleImage = new Image();
blockObstacleImage.src = "block.png";

const blockObstacleWidth = 80;
const blockObstacleHeight = 80;
const blockObstacleSpeed = 0.8; 


let blockObstacles = [];

/* Game Initial State*/
let score = 0;
let gameOver = false;
const maxHealth = 3;
let health = maxHealth;

const carImage = new Image();
carImage.src = "car.png";
const carWidth = 68;
const carHeight = 90;

const obstacleImage = new Image();
obstacleImage.src = "enemycar.png";

const powerUpImage = new Image();
powerUpImage.src = "powerup.png";
const powerUpWidth = 40;
const powerUpHeight = 40;
let powerUps = [];
let lastPowerUpTime = 0;


const bulletImage = new Image();
bulletImage.src = "bullet.png";


//My Car
const car = {
  x: canvas.width / 2 - carWidth / 2,
  y: canvas.height - carHeight - 10,
  width: carWidth,
  height: carHeight,
  speed: 3,
  isMovingLeft: false,
  isMovingRight: false
};

// Road
const roadSectionWidth = canvas.width / 3;
const roadHeight = canvas.height;
const road = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: roadHeight,
  color: "#808080",
  lineColor: "#ffffff",
  lineWidth: 5
};

// Enemy Car
const obstacleWidth = 62;
const obstacleHeight = 95;
let obstacles = [];
const maxObstacles = 3;
const minObstacles = 1;
let obstacleSpeed = 5; // Initial obstacle speed

// Bullets
const bulletWidth = 30;
const bulletHeight = 20;
let bullets = [];
const bulletSpeed = 4;

/*Key Events*/
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(event) {
  if (event.code === "ArrowLeft") {
    car.isMovingLeft = true;
  } else if (event.code === "ArrowRight") {
    car.isMovingRight = true;
  } else if (event.code === "Space") {
    fireBullet();
  }
  else if (event.keyCode === 13 && gameOver) {
    restartGame();
  }
}

function keyUpHandler(event) {
  if (event.code === "ArrowLeft") {
    car.isMovingLeft = false;
  } else if (event.code === "ArrowRight") {
    car.isMovingRight = false;
  }
}

let requestId;
let x = 0;
function gameLoop() {
  x++;
  update();
  draw(x);
  if (!gameOver) {
    requestId = requestAnimationFrame(gameLoop);
  }
}


function update() {

  // Car Movement
  if (car.isMovingLeft && car.x > 0) {
    car.x -= car.speed;
  } else if (car.isMovingRight && car.x < canvas.width - car.width) {
    car.x += car.speed;
  }

  // Bullets Movement
  for (let i = 0; i < bullets.length; i++) {
    bullets[i].y -= bulletSpeed;

    // Remove bullet when it goes off-screen
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
    }
  }

  // Enemy Car Movement
  for (let i = 0; i < obstacles.length; i++) {
    obstacles[i].y += obstacleSpeed;

    // Collision Detection: Enemy Car vs. Player Car
    if (isCollision(car, obstacles[i])) {
      health--;
      if (health <= 0) {
        gameOver = true;
        cancelAnimationFrame(requestId);
        playCollisionSound();
        showGameOverMessage();
        return;
      } else {
        playHealthReduceSound(); // Play health reduction sound
      }

      // Remove Enemy Car after collision
      obstacles.splice(i, 1);
      i--;
      continue;
    }

    // Collision Detection: Bullets vs. Enemy Cars
    for (let j = 0; j < bullets.length; j++) {
      for (let i = obstacles.length - 1; i >= 0; i--) {
        if (isCollision(bullets[j], obstacles[i])) {
          bullets.splice(j, 1);
          obstacles.splice(i, 1);
          score++;
          playBulletCollisionSound();
          break;
        }
      }
    }

    // Remove Enemy Cars at the bottom of the Canvas
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].y > canvas.height) {
        obstacles.splice(i, 1);
      }
    }

  }

  // Add new obstacles
  if (obstacles.length < maxObstacles && Math.random() < 0.02) {
    const numObstacles = Math.floor(Math.random() * (maxObstacles - minObstacles + 1)) + minObstacles;
    for (let i = 0; i < numObstacles; i++) {
      const randomLane = Math.floor(Math.random() * 3); // random select a lane
      const randomX = getRandomXCoordinate(randomLane);
      const newObstacle = {
        x: randomX,
        y: -obstacleHeight,
        width: obstacleWidth,
        height: obstacleHeight
      };

      // Collision Detection: New Obstacle vs. Existing Obstacles
      let collisionDetected = false;
      for (let j = 0; j < obstacles.length; j++) {
        if (isCollision(newObstacle, obstacles[j])) {
          collisionDetected = true;
          break;
        }
      }

      if (!collisionDetected) {
        obstacles.push(newObstacle);
      }
    }


  // Add block obstacles...
  if (Math.random() < 0.5 && blockObstacles.length < 1) {
    const randomLane = Math.floor(Math.random() * 3); // random select a lane
    const randomX = getRandomXCoordinate(randomLane);
    const newBlockObstacle = {
      x: randomX,
      y: -blockObstacleHeight,
      width: blockObstacleWidth,
      height: blockObstacleHeight
    };

    // Collision Detection: New Block Obstacle vs. Existing Obstacles
    let collisionDetected = false;
    for (let j = 0; j < obstacles.length; j++) {
      if (isCollision(newBlockObstacle, obstacles[j])) {
        collisionDetected = true;
        break;
      }
    }
    for (let j = 0; j < blockObstacles.length; j++) {
      if (isCollision(newBlockObstacle, blockObstacles[j])) {
        collisionDetected = true;
        break;
      }
    }

    if (!collisionDetected) {
      blockObstacles.push(newBlockObstacle);
    }
  }
  }
  // Power-up Movement
  for (let i = 0; i < powerUps.length; i++) {
    powerUps[i].y += obstacleSpeed;

    // Collision Detection: Power-up vs. Player Car
    if (isCollision(car, powerUps[i])) {
      powerUps.splice(i, 1);
      increaseHealth();
      playPowerUpSound();
      break;
    }

    // Remove Power-ups at the bottom of the Canvas
    if (powerUps[i].y > canvas.height) {
      powerUps.splice(i, 1);
    }
  }
  // Add new power-ups
  if (powerUps.length < maxObstacles && Math.random() < 0.01) {
    const currentTime = Date.now();
    if (currentTime - lastPowerUpTime < 45000) {
      return;
    }

    const randomLane = Math.floor(Math.random() * 3); // random select a lane
    const randomX = getRandomXCoordinate(randomLane);
    const newPowerUp = {
      x: randomX,
      y: -powerUpHeight,
      width: powerUpWidth,
      height: powerUpHeight
    };

    // Collision Detection: New Power-up vs. Existing Power-ups and Obstacles
    let collisionDetected = false;
    for (let j = 0; j < powerUps.length; j++) {
      if (isCollision(newPowerUp, powerUps[j])) {
        collisionDetected = true;
        break;
      }
    }
    for (let j = 0; j < obstacles.length; j++) {
      if (isCollision(newPowerUp, obstacles[j])) {
        collisionDetected = true;
        break;
      }
    }

    if (!collisionDetected) {
      powerUps.push(newPowerUp);
      lastPowerUpTime = currentTime;
    }
  }

  //
  // Block Obstacle Movement
for (let i = 0; i < blockObstacles.length; i++) {
  blockObstacles[i].y += blockObstacleSpeed;

  // Collision Detection: Block Obstacle vs. My Car
  if (isCollision(car, blockObstacles[i])) {
    health--;
    if (health <= 0) {
      gameOver = true;
      cancelAnimationFrame(requestId);
      playCollisionSound();
      showGameOverMessage();
      return;
    } else {
      playHealthReduceSound(); // Play health reduction sound
    }

    // Remove Block Obstacle after collision
    blockObstacles.splice(i, 1);
    i--;
    continue;
  }
 

  // Remove Block Obstacles at the bottom of the Canvas
  for (let i = blockObstacles.length - 1; i >= 0; i--) {
    if (blockObstacles[i].y > canvas.height) {
      blockObstacles.splice(i, 1);
    }
  }
}
}

function draw(x) {


  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //road
  ctx.fillStyle = road.color;
  ctx.fillRect(road.x, road.y, road.width, road.height);

  //road lines
  ctx.strokeStyle = road.lineColor;
  ctx.lineWidth = road.lineWidth;

  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(roadSectionWidth, road.y + x * 5 );
  ctx.lineTo(roadSectionWidth, road.y + road.height + -1000000);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(roadSectionWidth * 2, road.y + x * 5);
  ctx.lineTo(roadSectionWidth * 2, road.y + road.height + -1000000);
  ctx.stroke();

  //car
  ctx.drawImage(carImage, car.x, car.y, car.width, car.height);

  //EnemyCar
  for (let i = 0; i < obstacles.length; i++) {
    ctx.drawImage(obstacleImage, obstacles[i].x, obstacles[i].y, obstacles[i].width, obstacles[i].height);
  }
// Draw Block Obstacles
for (let i = 0; i < blockObstacles.length; i++) {
  ctx.drawImage(blockObstacleImage, blockObstacles[i].x, blockObstacles[i].y, blockObstacleWidth, blockObstacleHeight);
}

  //power-ups
  for (let i = 0; i < powerUps.length; i++) {
    ctx.drawImage(powerUpImage, powerUps[i].x, powerUps[i].y, powerUpWidth, powerUpHeight);
  }

  //bullets
  for (let i = 0; i < bullets.length; i++) {
    ctx.drawImage(bulletImage, bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);
  }

  //score and health
  ctx.fillStyle = "#ffffff";
  ctx.font = "24px Arial";
  ctx.fillText("Score: " + score, 10, 30);
  ctx.fillText("Health: " + health, 10, 60);
}

// Collision checking
function isCollision(obj1, obj2) {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
}

// Generate random x-coordinate based on the selected lane
function getRandomXCoordinate(lane) {
  const minX = road.x + lane * roadSectionWidth + obstacleWidth / 2;
  const maxX = minX + roadSectionWidth - obstacleWidth;
  return Math.floor(Math.random() * (maxX - minX + 1)) + minX;
}


// Bullet delay
const bulletDelay = 1000;
let lastBulletTime = 0;

// Fire a bullet
function fireBullet() {
  const currentTime = Date.now();
  if (currentTime - lastBulletTime < bulletDelay) {
    return;
  }

  const bullet = {
    x: car.x + car.width / 2 - bulletWidth / 2,
    y: car.y,
    width: bulletWidth,
    height: bulletHeight
  };
  bullets.push(bullet);

  lastBulletTime = currentTime;
  playBulletFireSound();
}

//Game restart function
function restartGame() {
  score = 0;
  health = maxHealth;
  gameOver = false;
  bullets = [];
  obstacles = [];
  car.x = canvas.width / 2 - carWidth / 2;
  hideGameOverMessage();
  gameLoop();
}


function showGameOverMessage() {
  scoreDisplay.textContent = score;
  gameOverMessage.style.display = "block";
}
function hideGameOverMessage() {
  gameOverMessage.style.display = "none";
}

//sounds
function playCollisionSound() {
  const collisionSound = document.getElementById("collisionSound");
  collisionSound.play();
}

function playHealthReduceSound() {
  const healthReduceSound = document.getElementById("healthReduceSound");
  healthReduceSound.play();
}

function playBulletFireSound() {
  const bulletFireSound = document.getElementById("bulletFireSound");
  bulletFireSound.play();
}

function playBulletCollisionSound() {
  const bulletCollisionSound = document.getElementById("bulletCollisionSound");
  bulletCollisionSound.play();
}

function increaseHealth() {
  if (health < maxHealth) {
    health++;
  }
}

function playPowerUpSound() {
  const powerUpSound = document.getElementById("powerUpSound");
  powerUpSound.play();
}


gameLoop();

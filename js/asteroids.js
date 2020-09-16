// Collecting the canvas and his context
let canvas  = document.getElementById("game-screen");
let context = canvas.getContext('2d');
let keys    = [];
let bullets = [];
let debug   = false;

// Game constants
const GAME_WIDTH     = 800;
const GAME_HEIGHT    = 600;
const KEY_SCORE_SAVE = "localHighScore";

/////////////////////////////////////////////// MANAGER ////////////////////////////////////////////////////////////////

class GameManager {
    constructor(canvas, sceneWidth, sceneHeight, context, debugMode, saveKey) {
        this.canvas = canvas;
        this.sceneWidth = sceneWidth;
        this.sceneHeight = sceneHeight;
        this.context = context;
        this.debugMode = debugMode;
        this.asteroidsQuantity = 0;
        this.level = 1;
        this.gameLives = 3;
        this.ship = undefined;
        this.asteroidsBelt = [];
        this.scoreStr = localStorage.getItem(saveKey);

        // Persisting the Highest Score
        if(this.scoreStr == null) {
            this.highestScore = 0;
        } else {
            this.highestScore = parseInt(this.scoreStr);
        }

    }

    newShip() {
        return new Ship(this.canvas, this.sceneWidth, this.sceneHeight, this.context, this.debugMode);
    }

    newGame() {
        this.ship = this.newShip();
        this.ship.Draw();
        this.newLevel(this.level);
        return {
            ship: this.ship,
            shipLives: this.gameLives,
            gameLevel: this.level,
            asteroidsBelt: this.asteroidsBelt,
        };
    }

    newLevel(gameLevel) {
        for(let i = 0; i < this.asteroidsQuantity + gameLevel ; i++) {
            this.asteroidsBelt.push(new Rocks(this.canvas, this.sceneWidth, this.sceneHeight, this.context, this.ship, gameLevel));
        }
    }

    gameOver(ship) {
        ship.alive = false;

    }
}

class SoundFXManager {
   constructor() {
   }

   sound(src, maxStreams = 1, vol = 1.0) {
       this.streamNum = 0;
       this.streams = [];

       for(let i = 0; i < maxStreams; i++) {
           this.streams.push(new Audio(src));
           this.streams[i].volume = vol;
       }

       this.play = function () {
           this.streamNum = (this.streamNum + 1) % maxStreams;
           this.streams[this.streamNum].play();
       }

       this.stop = function () {
           this.streams[this.streamNum].pause();
           this.streams[this.streamNum].currentTime = 0;
       }
   }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////// ENTITIES ///////////////////////////////////////////////////////////////

class Ship {

    shipExplodeFx = new SoundFXManager();
    shipThrust = new SoundFXManager();

    constructor(canvas, canvasWidth, canvasHeight, ctx) {
        this.alive = true;
        this.score = 0;
        this.context = ctx;
        this.crash = 0;
        this.explosionTime = 120;
        this.blinkDuration = 0.1;
        this.invisibilityDuration = 3;
        this.blinkTime = Math.ceil(this.blinkDuration * 60);
        this.blinkNum = Math.ceil(this.invisibilityDuration / this.blinkDuration);
        this.blinkOn = 0;
        this.canvas = canvas;
        this.strokeColor = "white";
        this.movingForward = false;
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.radius = 15;
        this.angle = 0;
        this.noseX = (canvasWidth / 2) + 15;
        this.noseY = canvasHeight / 2;
        this.velX = 0;
        this.velY = 0;
        this.speed = 0.05;
        this.rotateSpeed = 0.0005;
        this.shipExplodeFx.sound("bin/sounds/explode.m4a", 1, 0.1);
        this.shipThrust.sound("bin/sounds/thrust.m4a", 1, 0.1)

    }

    Rotate(direction) {
        this.angle += this.rotateSpeed * direction;
    }

    Debug() {
        // Configuring Font
        this.context.font = "8pt Roboto";
        this.context.textAlign = "center";

        // Hitbox
        this.context.strokeStyle = "yellow";
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.context.closePath();
        this.context.stroke();

        // X Axis
        this.context.strokeStyle = "red";
        this.context.beginPath();
        this.context.lineTo(this.noseX, this.noseY);
        this.context.lineTo(this.noseX - 75, this.noseY);
        this.context.closePath();
        this.context.stroke();
        this.context.fillStyle = "red";
        this.context.fillText("posX (Nose): " + Math.ceil(this.noseX), this.noseX - 75, this.noseY + 20)
        this.context.fillText("posX (ShipCenter): " + Math.ceil(this.x), this.noseX - 75, this.noseY + 35)


        // Y Axis
        this.context.strokeStyle = "green";
        this.context.beginPath();
        this.context.lineTo(this.noseX, this.noseY);
        this.context.lineTo(this.noseX, this.noseY - 75);
        this.context.closePath();
        this.context.stroke();
        this.context.fillStyle = "green"
        this.context.fillText("posY (Nose): " + Math.ceil(this.noseX), this.noseX + 5, this.noseY - 75);
        this.context.fillText("posY (ShipCenter): " + Math.ceil(this.y), this.noseX + 5, this.noseY - 60)
    }

    Explosion() {
        this.crash = this.explosionTime > 0;

        // draw the explosion (concentric circles of different colours)
        this.context.strokeStyle = "darkred";
        this.context.fillStyle = "darkred";
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius * 1.7, 0, Math.PI * 2, false);
        this.context.fill();
        this.context.closePath();
        this.context.stroke();

        this.context.strokeStyle = "red";
        this.context.fillStyle = "red";
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius * 1.4, 0, Math.PI * 2, false);
        this.context.fill();
        this.context.closePath();
        this.context.stroke();

        this.context.strokeStyle = "orange";
        this.context.fillStyle = "orange";
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius * 1.1, 0, Math.PI * 2, false);
        this.context.fill();
        this.context.closePath();
        this.context.stroke();

        this.context.strokeStyle = "yellow";
        this.context.fillStyle = "yellow";
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2, false);
        this.context.fill();
        this.context.closePath();
        this.context.stroke();

        this.context.strokeStyle = "white";
        this.context.fillStyle = "white";
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2, false);
        this.context.fill();
        this.context.closePath();
        this.context.stroke();

        // Play the explosion Effect
        this.shipThrust.stop();
        this.shipExplodeFx.play();
    }

    Update() {
        let radians = this.angle / Math.PI * 180;

        // oldX + cos(radians) * distance
        // oldY + sin(radians) * distance
        if(this.movingForward) {
            this.velX += Math.cos(radians) * this.speed;
            this.velY += Math.sin(radians) * this.speed;
            this.shipThrust.play();
        } else {
            this.shipThrust.stop();
        }

        // Moving Left
        if(this.x < this.radius) {
            this.x = this.canvas.width;
        }
        // Moving Right
        if(this.x > this.canvas.width) {
            this.x = this.radius;
        }

        //Moving Up
        if(this.y < this.radius) {
            this.y = this.canvas.height;
        }
        // Moving Down
        if(this.y > this.canvas.height) {
            this.y = this.radius;
        }

        // Friction and slow down when nothing is pressed
        this.velX *= 0.99;
        this.velY *= 0.99;
        this.x -= this.velX;
        this.y -= this.velY

    }

    Draw(debug) {
        let rightSideAngle = ((3 * Math.PI) / 4);
        let leftSideAngle = ((5 * Math.PI) / 4);
        let radians = this.angle / Math.PI * 180;

        if(debug) {
            this.Debug();
        }

        this.context.strokeStyle = this.strokeColor;
        this.context.lineWidth = 2;
        this.context.beginPath();

        this.noseX = this.x - this.radius * Math.cos(radians);
        this.noseY = this.y - this.radius * Math.sin(radians);

        // Starting Point
        this.context.lineTo(this.x - this.radius * Math.cos(radians),
                            this.y - this.radius * Math.sin(radians));

        // Right Side
        this.context.lineTo(this.x - this.radius * Math.cos(rightSideAngle + radians),
                            this.y - this.radius * Math.sin(rightSideAngle + radians));

        // Left Side
        this.context.lineTo(this.x - this.radius * Math.cos(leftSideAngle + radians),
                            this.y - this.radius * Math.sin(leftSideAngle + radians));

        // Closing
        this.context.closePath();
        this.context.stroke();
    }
}

class Bullet {
    constructor(ship, angle, ctx) {
        this.context = ctx;
        this.x = ship.noseX;
        this.y = ship.noseY;
        this.angle = angle;
        this.width = 4;
        this.height = 4;
        this.radius = Math.sqrt(Math.pow(this.width/2, 2) + Math.pow(this.height/2, 2));
        this.speed = 5;
    }

    Debug() {
        this.context.strokeStyle = "yellow";
        this.context.beginPath();
        this.context.arc(this.x + (this.width/2), this.y + (this.width/2), this.radius, 0, Math.PI * 2, false);
        this.context.closePath();
        this.context.stroke();
    }

    Update() {
        let radians = this.angle / Math.PI * 180;
        this.x -= Math.cos(radians) * this.speed;
        this.y -= Math.sin(radians) * this.speed;
    }

    Draw(debug) {
        if(debug) {
            this.Debug();
        }

        this.context.fillStyle = 'white';
        this.context.lineWidth = 2;
        this.context.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Rocks {

    distanceFromShip = new CollisionSystem();

    static ROCK_VERTICES = 10;
    static ROCK_RADIUS = 100;
    static ROCK_SPEED = 0.6;
    static ROCK_IRREGULAR = 0.5;

    static idGenerator() {
        if (!this.latestId) this.latestId = 1
        else this.latestId++
        return this.latestId
    }

    constructor(canvas, canvasWidth, canvasHeight, ctx, ship, gameLevel, radius, x, y) {
        this.context = ctx;
        this.id = Rocks.idGenerator();
        this.canvas = canvas;
        this.ship = ship;
        this.levelMultiplier = Math.ceil(Rocks.ROCK_SPEED + 0.1 * gameLevel);
        this.strokeColor = 'slategrey';
        this.radius = radius || Math.ceil(Rocks.ROCK_RADIUS / 2);
        this.vertices = Math.floor(Math.random() * (Rocks.ROCK_VERTICES + 1) + Rocks.ROCK_VERTICES / 2);
        this.angle = Math.floor(Math.random() * Math.PI * 2);
        this.speed = this.levelMultiplier;
        this.offset = [];

        // Defining score
        if(this.radius === Math.ceil(Rocks.ROCK_RADIUS / 2)) {  // Large Asteroid
            this.pointsValue = 15;
        } else if(this.radius === Math.ceil(Rocks.ROCK_RADIUS / 4)) {  // Medium Asteroid
            this.pointsValue = 30;
        } else {  // Small Asteroid
            this.pointsValue = 50;
        }

        // Preventing from spawning rocks nearby the ship
        if (x === undefined && y === undefined){
            do {
                this.x = Math.floor(Math.random() * canvasWidth);
                this.y = Math.floor(Math.random() * canvasHeight);
            } while(this.distanceFromShip.DistanceBetweenEntities(this.ship.x, this.ship.y, this.x, this.y) < Rocks.ROCK_RADIUS * 2 + this.ship.radius);
        } else {
            this.x = x;
            this.y = y;
        }

        // Adding some jaggedness (irregular shape)
        for(let i = 0; i < this.vertices; i++) {
            this.offset.push(Math.random() * Rocks.ROCK_IRREGULAR * 2 + 1 - Rocks.ROCK_IRREGULAR);
        }
    }

    Debug() {
        // Configuring Font
        this.context.font = "8pt Roboto";
        this.context.textAlign = "center";

        // Hitbox
        this.context.strokeStyle = "yellow";
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.context.closePath();
        this.context.stroke();

        // ID
        this.context.fillStyle = "aqua";
        this.context.fillText("ID: " + this.id, this.x, this.y);

        // X Position
        this.context.fillStyle = "red";
        this.context.fillText("posX (centro): " + Math.ceil(this.x), this.x, this.y + 15);

        // X Position
        this.context.fillStyle = "green";
        this.context.fillText("posY (centro): " + Math.ceil(this.y), this.x, this.y + 25);
    }

    Explosion() {
        this.crash = true;

        // draw the explosion (concentric circles of different colours)
        this.context.strokeStyle = "darkred";
        this.context.fillStyle = "darkred";
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius * 1.7, 0, Math.PI * 2, false);
        this.context.fill();
        this.context.closePath();
        this.context.stroke();

        this.context.strokeStyle = "red";
        this.context.fillStyle = "red";
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius * 1.4, 0, Math.PI * 2, false);
        this.context.fill();
        this.context.closePath();
        this.context.stroke();

        this.context.strokeStyle = "orange";
        this.context.fillStyle = "orange";
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius * 1.1, 0, Math.PI * 2, false);
        this.context.fill();
        this.context.closePath();
        this.context.stroke();

        this.context.strokeStyle = "yellow";
        this.context.fillStyle = "yellow";
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2, false);
        this.context.fill();
        this.context.closePath();
        this.context.stroke();

        this.context.strokeStyle = "white";
        this.context.fillStyle = "white";
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2, false);
        this.context.fill();
        this.context.closePath();
        this.context.stroke();
    }

    Update() {
        let radians = this.angle / Math.PI * 180;
        this.x += this.offset[0] * Math.cos(radians) * this.speed;
        this.y += this.offset[0] * Math.sin(radians) * this.speed;


        // Keeping the rock on screen
        if(this.x < this.radius) {
            this.x = this.canvas.width;
        }
        if(this.x > this.canvas.width) {
            this.x = this.radius;
        }
        if(this.y < this.radius) {
            this.y = this.canvas.height;
        }
        if(this.y > this.canvas.height) {
            this.y = this.radius;
        }
    }

    Draw(debug) {
        if(debug) {
            this.Debug();
        }

        this.context.beginPath();
        this.context.strokeStyle = this.strokeColor;
        this.context.lineWidth = 2;

        for(let i = 1; i < this.vertices; i++) {
            this.context.lineTo(this.x + this.radius * this.offset[i] * Math.cos(this.angle + i * Math.PI * 2 / this.vertices),
                                this.y + this.radius * this.offset[i] * Math.sin(this.angle + i * Math.PI * 2 / this.vertices));
            this.context.stroke();

        }
        this.context.closePath();
        this.context.stroke();

    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////// SCREEN /////////////////////////////////////////////////////////////////

class GameHUD {

    static TEXT_TIME_FADE = 120;

    constructor(context, sceneWidth, sceneHeight, ship) {
        this.context = context;
        this.sceneWidth = sceneWidth;
        this.sceneHeight = sceneHeight;
        this.ship = ship;
        this.angle = 1.562680546;
        this.textAlpha = 1;
    }

    levelIndicadorFade(levelInfo) {
        this.context.fillStyle = "rgba(255, 255, 255, " + this.textAlpha + ")";
        this.context.font = "20pt Roboto";
        this.context.textAlign = "center";

        this.context.fillText("Level " + levelInfo, this.sceneWidth / 2, this.sceneHeight * 0.75);
        this.textAlpha -= 1.0 / GameHUD.TEXT_TIME_FADE;
    }

    liveIndicator(shipLives, crashStatus) {
        let rightSideAngle = ((3 * Math.PI) / 4);
        let leftSideAngle = ((5 * Math.PI) / 4);
        let radians = this.angle / Math.PI * 180;
        let lifeColour;
        let posX = 20;
        let posY = 20;

        for(let i = 0; i < shipLives; i++) {
            lifeColour = crashStatus && i === shipLives - 1 ? "red" : "white";
            this.context.strokeStyle = lifeColour;
            this.context.beginPath();

            // Starting Point
            this.context.lineTo(posX - this.ship.radius * Math.cos(radians),
                                posY - this.ship.radius * Math.sin(radians));

            // Right Side
            this.context.lineTo(posX - this.ship.radius * Math.cos(rightSideAngle + radians),
                                posY - this.ship.radius * Math.sin(rightSideAngle + radians));

            // Left Side
            this.context.lineTo(posX - this.ship.radius * Math.cos(leftSideAngle + radians),
                                posY - this.ship.radius * Math.sin(leftSideAngle + radians));

            this.context.closePath();
            this.context.stroke();
            posX += 30;
        }

    }

    scoreIndicator(score) {
        this.context.fillStyle = "White";
        this.context.font = "20pt Roboto";
        this.context.textAlign = "center"

        this.context.fillText(score, this.sceneWidth / 2, this.sceneHeight * 0.05);
    }

    highestScore(finalScore) {
        this.context.fillStyle = "White";
        this.context.font = "20pt Roboto";
        this.context.textAlign = "right"

        this.context.fillText("Best: " + finalScore, this.sceneWidth, this.sceneHeight * 0.05);
    }

    gameOverIndicador() {
        this.context.fillStyle = "White";
        this.context.font = "20pt Roboto";
        this.context.textAlign = "center";

        this.context.fillText("Game Over", this.sceneWidth / 2, this.sceneHeight * 0.5);
    }

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////// COLLISION SYSTEM ///////////////////////////////////////////////////////

class CollisionSystem {

    hitFx = new SoundFXManager();

    constructor(canvas, game_width, game_height, ctx) {
        this.canvas = canvas;
        this.context = ctx;
        this.game_width = game_width;
        this.game_height = game_height;
        this.hitFx.sound("bin/sounds/hit.m4a", 5, 0.1);


    }

    DistanceBetweenEntities(EntityOneX, EntityOneY, EntityTwoX, EntityTwoY) {
        return Math.sqrt(Math.pow(EntityTwoX - EntityOneX, 2) + Math.pow(EntityTwoY - EntityOneY, 2));
    }

    BulletCollisionRocks(rocks, bullets, gameLevel, ship) {
        for(let i = 0; i < rocks.length; i++) {
            for (let j = 0; j < bullets.length; j++) {
                if (this.DistanceBetweenEntities(rocks[i].x, rocks[i].y, bullets[j].x, bullets[j].y) < rocks[i].radius + bullets[j].radius) {
                    if (rocks[i].radius === Math.ceil(Rocks.ROCK_RADIUS / 2)) {

                        rocks.push(new Rocks(this.canvas, this.game_width, this.game_height, this.context, this.ship, gameLevel, Math.ceil(Rocks.ROCK_RADIUS / 4),
                                             rocks[i].x, rocks[i].y));

                        rocks.push(new Rocks(this.canvas, this.game_width, this.game_height, this.context, this.ship, gameLevel, Math.ceil(Rocks.ROCK_RADIUS / 4),
                                             rocks[i].x, rocks[i].y));
                    } else if (rocks[i].radius === Math.ceil(Rocks.ROCK_RADIUS / 4)) {

                        rocks.push(new Rocks(this.canvas, this.game_width, this.game_height, this.context, this.ship, gameLevel, Math.ceil(Rocks.ROCK_RADIUS / 8),
                            rocks[i].x, rocks[i].y));

                        rocks.push(new Rocks(this.canvas, this.game_width, this.game_height, this.context, this.ship, gameLevel, Math.ceil(Rocks.ROCK_RADIUS / 8),
                            rocks[i].x, rocks[i].y));
                    }

                    bullets.splice(j, 1);
                    rocks[i].Explosion();
                    ship.score += rocks[i].pointsValue;
                    rocks.splice(i, 1);
                    this.hitFx.play();
                    break;
                }
            }
        }
    }

    BulletOffScreen(bullets) {
        // Deleting the bullet when off screen
        for(let i = 0; i < bullets.length; i++) {
            if(bullets[i].x < bullets[i].radius) {
                bullets.splice(i, 1);
                break;
            }
            if(bullets[i].x > this.canvas.width) {
                bullets.splice(i, 1);
                break;
            }
            if(bullets[i].y < bullets[i].radius) {
                bullets.splice(i, 1);
                break;
            }
            if(bullets[i].y > this.canvas.height) {
                bullets.splice(i, 1);
                break;
            }
        }
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////// Sessão Main ////////////////////////////////////////////////////////////

// Setting up Bullet sound effects
let bulletFx = new SoundFXManager();
bulletFx.sound("bin/sounds/laser.m4a", 5, 0.1);

// Setting up the Game Manager
let gameHandler = new GameManager(canvas, GAME_WIDTH, GAME_HEIGHT, context, debug, KEY_SCORE_SAVE);
let game = gameHandler.newGame();

// Getting the spaceship, the asteroids belt and the game level
let ship = game.ship;
let rocks = game.asteroidsBelt;
let gameLevel = game.gameLevel;
let shipLives = game.shipLives;

// Setting up the HUD
let gameHUD = new GameHUD(context, GAME_WIDTH, GAME_HEIGHT, ship);

// Instantiating the Collision System Detection
let collision = new CollisionSystem(canvas, GAME_WIDTH, GAME_HEIGHT, context);

// Getting the controllers
document.body.addEventListener('keydown', event => {
    keys[event.keyCode] = true;

    if (event.keyCode === 186/*ç*/) {
        debug = !debug;
    }
});
document.body.addEventListener('keyup', event => {
    delete keys[event.keyCode];

    if(event.keyCode === 32/*space*/) {
        bullets.push(new Bullet(ship, ship.angle, context));
        bulletFx.play();
    }
});

// Creating the game loop
function gameLoop() {
    // Clear the screen, this make characters movements
    context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    gameHUD.liveIndicator(shipLives, ship.crash);
    gameHUD.scoreIndicator(ship.score);

    if(ship.score > gameHandler.highestScore) {
        gameHandler.highestScore = ship.score;
        localStorage.setItem(KEY_SCORE_SAVE, gameHandler.highestScore);
    }

    gameHUD.highestScore(gameHandler.highestScore);

    if(!ship.crash) {
        if(ship.alive) {

            // Show game level when changes
            if (gameHUD.textAlpha >= 0) {
                gameHUD.levelIndicadorFade(gameLevel);
            }

            // Making ship movements
            ship.movingForward = keys[87];

            if (keys[68]) {
                ship.Rotate(1);
            }

            if (keys[65]) {
                ship.Rotate(-1);
            }

            // Updating the Ship and drawing
            if (ship.blinkOn) {
                ship.Update();
                ship.Draw(debug);
            }

            // Handle ship blinking
            if (ship.blinkNum >= 0) {
                // Toggles the blink state
                ship.blinkOn = ship.blinkNum % 2 === 0;

                // Reducing blink time
                ship.blinkTime--;

                // Reducing blink num
                if (ship.blinkTime === 0) {
                    ship.blinkTime = Math.ceil(ship.blinkDuration * 60);
                    ship.blinkNum--;
                }
            }

            // New level when the last asteroid is destroyed
            if (rocks.length === 0) {
                gameLevel++;
                gameHandler.newLevel(gameLevel);
                gameHUD.textAlpha = 1;
            }

            // Bullet Gun
            if (bullets.length !== 0) {
                // Collision Detection
                collision.BulletCollisionRocks(rocks, bullets, gameLevel, ship);
                collision.BulletOffScreen(bullets);

                for (let i = 0; i < bullets.length; i++) {
                    bullets[i].Update();
                    bullets[i].Draw(debug);
                }
            }
        } else {
            gameHUD.gameOverIndicador();
        }
    } else {
        ship.Explosion();
    }

    // Rocks behavior
    if(rocks.length !== 0) {
        for(let j = 0; j < rocks.length; j++) {
            rocks[j].Update();
            rocks[j].Draw(debug);

            // Collision Detection
            if(!ship.crash && ship.alive) {
                if(ship.blinkNum === -1) {
                    const distance = collision.DistanceBetweenEntities(
                        ship.x, ship.y, rocks[j].x, rocks[j].y);

                    const sumOfRadius = ship.radius + rocks[j].radius;

                    if (distance < sumOfRadius) {
                        ship.Explosion();
                    }
                }
            } else {
                ship.explosionTime--;

                if (ship.explosionTime === 0) {
                    shipLives--;
                    gameHUD.textAlpha = 1;

                    if (--shipLives === 0) {
                        gameHandler.gameOver(ship);
                    } else {
                        ship = gameHandler.newShip();
                    }
                }
            }
        }
    }

    // Looping
    requestAnimationFrame(gameLoop);
}

gameLoop();
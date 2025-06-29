
let canvas, ctx;
let gameWidth, gameHeight;
let backgroundImg, playerImg, bulletImg, asteroidImg;
let gameoverSound, shotSound;


let gameRunning = false;
let animationId;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let health = 100;
let difficulty = 1;
let lastAsteroidTime = 0;
let asteroidInterval = 1500;
let asteroidSpeed = 1.5;
let asteroidSize = 56;


let player = {
    x: 0,
    y: 0,
    width: 84,
    height: 84,
    speed: 7, 
    dx: 0
};

let bullets = [];
let asteroids = [];


const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    a: false,
    d: false,
    ' ': false
};


let soundEnabled = true;
let canShoot = true;


function preloadAssets(callback) {
    let loadedAssets = 0;
    const assetsToLoad = 6; 
    backgroundImg = new Image();
    playerImg = new Image();
    bulletImg = new Image();
    asteroidImg = new Image();
    gameoverSound = new Audio();
    shotSound = new Audio();
    const logoImg = new Image(); 

    backgroundImg.src = 'background.png';
    playerImg.src = 'player.png';
    bulletImg.src = 'bullet.png';
    asteroidImg.src = 'asteroid.png';
    gameoverSound.src = 'gameover.mp3';
    shotSound.src = 'shot.mp3';
    logoImg.src = 'logo.png'; 

    function assetLoaded() {
        loadedAssets++;
        if (loadedAssets === assetsToLoad) {
            if (logoImg.complete && logoImg.naturalWidth > 0) {
                callback();
            } else {
                console.error('Logo image failed to load. Check logo.png path.');
            }
        }
    }

    backgroundImg.onload = assetLoaded;
    playerImg.onload = assetLoaded;
    bulletImg.onload = assetLoaded;
    asteroidImg.onload = assetLoaded;
    gameoverSound.oncanplaythrough = assetLoaded;
    shotSound.oncanplaythrough = assetLoaded;

    backgroundImg.onerror = () => console.error('Failed to load background.png.');
    playerImg.onerror = () => console.error('Failed to load player.png.');
    bulletImg.onerror = () => console.error('Failed to load bullet.png.');
    asteroidImg.onerror = () => console.error('Failed to load asteroid.png.');
    gameoverSound.onerror = () => console.error('Failed to load gameover.mp3.');
    shotSound.onerror = () => console.error('Failed to load shot.mp3.');
    logoImg.onerror = () => console.error('Failed to load logo.png. Check path or file.');
}


function initGame() {
    preloadAssets(() => {
        setupCanvas();
        setupEventListeners();
        document.getElementById('logoScreen').style.display = 'flex'; 
        document.getElementById('gameWrapper').style.display = 'none'; 
        document.getElementById('gameContainer').style.border = 'none';
        document.getElementById('gameContainer').style.boxShadow = 'none';
        startLogoAnimation();
    });
}

function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Canvas 2D context not supported.');
        return;
    }
    resizeCanvas();
    window.addEventListener('resize', () => {
        resizeCanvas();
        if (gameRunning) draw();
    });
}

function resizeCanvas() {
    gameWidth = canvas.width = canvas.offsetWidth || 800;
    gameHeight = canvas.height = canvas.offsetHeight || 600;
    if (gameWidth > 0 && gameHeight > 0) {
        player.x = gameWidth / 2 - player.width / 2;
        player.y = gameHeight - player.height;
    } else {
        console.warn('Invalid canvas dimensions:', gameWidth, gameHeight);
    }
}

function startLogoAnimation() {
    setTimeout(() => {
        document.getElementById('logoScreen').style.display = 'none'; 
        document.getElementById('gameContainer').style.border = '4px solid #00fffc'; 
        document.getElementById('gameContainer').style.boxShadow = '0 0 20px rgba(0, 255, 252, 0.5)'; 
        document.getElementById('gameWrapper').style.display = 'block'; 
        document.getElementById('startScreen').style.display = 'flex';
    }, 3000);
}

function setupEventListeners() {
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', startGame);
    document.getElementById('soundToggle').addEventListener('click', toggleSound);
}

function keyDownHandler(e) {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        if (e.key === ' ' && gameRunning && canShoot) {
            shoot();
            canShoot = false;
        }
    }
}

function keyUpHandler(e) {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
        if (e.key === ' ') canShoot = true;
    }
}

function startGame() {
    resetGame();
    updateUI();
    document.getElementById('gameCanvas').style.display = 'block';
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('scoreDisplay').style.display = 'block';
    document.getElementById('highScoreDisplay').style.display = 'block';
    document.getElementById('soundToggle').style.display = 'block';
    document.getElementById('healthBar').style.display = 'block';
    gameRunning = true;
    if (animationId) cancelAnimationFrame(animationId);
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

function resetGame() {
    score = 0;
    health = 100;
    difficulty = 1;
    asteroidInterval = 1500;
    asteroidSpeed = 1.5;
    asteroidSize = 56;
    bullets = [];
    asteroids = [];
    lastAsteroidTime = 0;
    player.x = gameWidth / 2 - player.width / 2;
    player.y = gameHeight - player.height;
    canShoot = true;
}

function updateUI() {
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('healthFill').style.width = `${health}%`;
    document.getElementById('highScoreDisplay').textContent = `High Score: ${highScore}`;
}

function gameLoop(timestamp) {
    if (gameRunning) {
        update(timestamp);
        draw();
        animationId = requestAnimationFrame(gameLoop);
    }
}

function update(timestamp) {
    updateDifficulty();
    updatePlayer();
    updateBullets();
    updateAsteroids(timestamp);
    checkCollisions();
}

function updateDifficulty() {
    difficulty = 1 + Math.min(score / 300, 4);
}

function updatePlayer() {
    player.dx = 0;
    if (keys.ArrowLeft || keys.a) player.dx = -player.speed; 
    if (keys.ArrowRight || keys.d) player.dx = player.speed; 
    player.x += player.dx;
    player.x = Math.max(0, Math.min(gameWidth - player.width, player.x));
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y < 0) bullets.splice(i, 1);
    }
}

function updateAsteroids(timestamp) {
    if (timestamp - lastAsteroidTime > asteroidInterval / difficulty) {
        createAsteroid();
        lastAsteroidTime = timestamp;
        asteroidSpeed = Math.min(3, asteroidSpeed + 0.002 + (score / 100) * 0.005); 
        asteroidInterval = Math.max(300, asteroidInterval - 10);
        asteroidSize = Math.min(80, asteroidSize + 0.5);
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].y += asteroids[i].speed * difficulty;
        if (asteroids[i].y > gameHeight) {
            health = Math.max(0, health - 5);
            document.getElementById('healthFill').style.width = `${health}%`;
            if (health <= 0) gameOver();
            asteroids.splice(i, 1);
        }
    }
}

function draw() {
    if (!ctx || gameWidth <= 0 || gameHeight <= 0) {
        console.warn('Canvas not ready:', gameWidth, gameHeight);
        return;
    }
    ctx.clearRect(0, 0, gameWidth, gameHeight);
    if (backgroundImg.complete && backgroundImg.naturalWidth > 0) {
        ctx.drawImage(backgroundImg, 0, 0, gameWidth, gameHeight);
    } else {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, gameWidth, gameHeight);
    }
    if (playerImg.complete && playerImg.naturalWidth > 0) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    }
    bullets.forEach(bullet => {
        if (bulletImg.complete && bulletImg.naturalWidth > 0) {
            ctx.drawImage(bulletImg, bullet.x, bullet.y, bullet.width, bullet.height);
        }
    });
    asteroids.forEach(asteroid => {
        if (asteroidImg.complete && asteroidImg.naturalWidth > 0) {
            ctx.drawImage(asteroidImg, asteroid.x, asteroid.y, asteroid.size, asteroid.size);
        }
    });
}

function shoot() {
    const bullet = { x: player.x + player.width / 2 - 28, y: player.y, width: 56, height: 42, speed: 7 }; 
    bullets.push(bullet);
    if (soundEnabled) {
        shotSound.currentTime = 0;
        shotSound.play().catch(error => console.warn('Shot sound failed:', error));
    }
}

function createAsteroid() {
    const size = asteroidSize + Math.random() * 28;
    const asteroid = { x: Math.random() * (gameWidth - size), y: -size, size, speed: asteroidSpeed + Math.random() * 1 };
    asteroids.push(asteroid);
}

function checkCollisions() {
    checkBulletAsteroidCollisions();
    checkPlayerAsteroidCollisions();
}

function checkBulletAsteroidCollisions() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[j], asteroids[i])) {
                asteroids.splice(i, 1);
                bullets.splice(j, 1);
                score += 10;
                document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
                break;
            }
        }
    }
}

function checkPlayerAsteroidCollisions() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
        if (checkCollision(player, asteroids[i])) {
            asteroids.splice(i, 1);
            health -= 10;
            document.getElementById('healthFill').style.width = `${health}%`;
            if (health <= 0) gameOver();
        }
    }
}

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.size &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.size &&
           obj1.y + obj1.height > obj2.y;
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    document.getElementById('finalScore').textContent = `Your Score: ${score}`;
    document.getElementById('highScoreMessage').textContent = `High Score: ${highScore}`;
    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('gameCanvas').style.display = 'none';
    document.getElementById('scoreDisplay').style.display = 'none';
    document.getElementById('highScoreDisplay').style.display = 'none';
    document.getElementById('soundToggle').style.display = 'none';
    document.getElementById('healthBar').style.display = 'none';
    if (soundEnabled) {
        gameoverSound.currentTime = 0;
        gameoverSound.play().catch(error => console.warn('Game over sound failed:', error));
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('soundToggle').textContent = soundEnabled ? 'Sound ON' : 'Sound OFF';
}

function startGame() {
    resetGame();
    updateUI();
    document.getElementById('gameCanvas').style.display = 'block';
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('scoreDisplay').style.display = 'block';
    document.getElementById('highScoreDisplay').style.display = 'block';
    document.getElementById('soundToggle').style.display = 'block';
    document.getElementById('healthBar').style.display = 'block';
    gameRunning = true;
    if (animationId) cancelAnimationFrame(animationId);
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

window.addEventListener('load', initGame);
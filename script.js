
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("highScore");
const playerDisplay = document.getElementById("playerDisplay");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayIcon = document.getElementById("overlayIcon");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const soundBtn = document.getElementById("soundBtn");

const difficulty = document.getElementById("difficulty");
const skinSelect = document.getElementById("skinSelect");
const playerNameInput = document.getElementById("playerName");
const leaderboard = document.getElementById("leaderboard");

const GRID = 20;
const CELL = canvas.width / GRID;

const speeds = {
  easy: 180,
  medium: 125,
  hard: 80
};

const skins = {
  mint: ["#b0fff0", "#36d9c5"],
  purple: ["#d1aaff", "#8055e9"],
  blue: ["#a8d8ff", "#348bff"],
  pink: ["#ffb5e8", "#ef58bc"],
  gold: ["#fff0a8", "#e8aa28"]
};

let snake = [];
let food = {};
let bonusFood = null;
let bonusTimeout = null;

let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };

let score = 0;
let highScore = Number(localStorage.getItem("snakeXHighScore")) || 0;
let foodCount = 0;
let playerName = "Player";

let gameRunning = false;
let gameOver = false;
let soundEnabled = true;

let gameLoop = null;
let audioContext = null;

highScoreDisplay.textContent =
  String(highScore).padStart(3, "0");

// Reset game board
function resetGame() {
  clearInterval(gameLoop);
  clearTimeout(bonusTimeout);

  snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 }
  ];

  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };

  score = 0;
  foodCount = 0;
  bonusFood = null;

  gameRunning = false;
  gameOver = false;

  scoreDisplay.textContent = "000";

  createFood();
  drawGame();
}

// Create normal food
function createFood() {
  do {
    food = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID)
    };
  } while (
    snake.some(part => part.x === food.x && part.y === food.y) ||
    (bonusFood && bonusFood.x === food.x && bonusFood.y === food.y)
  );
}

// Create bonus food
function createBonusFood() {
  if (bonusFood || !gameRunning) return;

  do {
    bonusFood = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID)
    };
  } while (
    snake.some(part =>
      part.x === bonusFood.x && part.y === bonusFood.y
    ) ||
    (food.x === bonusFood.x && food.y === bonusFood.y)
  );

  playSound(900);

  bonusTimeout = setTimeout(() => {
    bonusFood = null;
    if (!gameOver) drawGame();
  }, 7000);
}

// Draw rounded rectangle
function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

// Draw game
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#080d1b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = "rgba(120,150,190,0.08)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL, 0);
    ctx.lineTo(i * CELL, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * CELL);
    ctx.lineTo(canvas.width, i * CELL);
    ctx.stroke();
  }

  // Normal food
  drawFood(food.x, food.y, "#ff62bd", "#ff5bba");

  // Bonus food
  if (bonusFood) {
    drawFood(bonusFood.x, bonusFood.y, "#ffe47a", "#ffbf33");
  }

  // Snake skin
  const colors = skins[skinSelect.value] || skins.mint;

  snake.forEach((part, index) => {
    const isHead = index === 0;
    const padding = 2;

    ctx.save();

    ctx.shadowColor = colors[1];
    ctx.shadowBlur = isHead ? 22 : 10;

    const gradient = ctx.createLinearGradient(
      part.x * CELL,
      part.y * CELL,
      part.x * CELL + CELL,
      part.y * CELL + CELL
    );

    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);

    ctx.fillStyle = gradient;

    roundedRect(
      part.x * CELL + padding,
      part.y * CELL + padding,
      CELL - padding * 2,
      CELL - padding * 2,
      7
    );

    ctx.restore();

    // Eyes
    if (isHead) {
      ctx.fillStyle = "#08131c";

      const eyes = direction.x !== 0
        ? [[0.68, 0.32], [0.68, 0.68]]
        : [[0.32, 0.32], [0.68, 0.32]];

      eyes.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(
          part.x * CELL + CELL * x,
          part.y * CELL + CELL * y,
          3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
    }
  });
}

// Draw food with glow
function drawFood(x, y, color, glow) {
  ctx.save();

  ctx.shadowColor = glow;
  ctx.shadowBlur = 25;
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.arc(
    x * CELL + CELL / 2,
    y * CELL + CELL / 2,
    CELL * 0.3,
    0,
    Math.PI * 2
  );

  ctx.fill();
  ctx.restore();
}

// Start game
function startGame() {
  if (gameRunning) return;

  if (gameOver) {
    resetGame();
  }

  if (playerNameInput.value.trim()) {
    playerName = playerNameInput.value.trim().slice(0, 15);
  }

  playerDisplay.textContent = playerName;

  gameRunning = true;
  gameOver = false;

  overlay.classList.add("hidden");
  pauseBtn.textContent = "Ⅱ Pause";

  clearInterval(gameLoop);

  gameLoop = setInterval(
    updateGame,
    speeds[difficulty.value]
  );

  playSound(500);
}

// Pause
function pauseGame() {
  if (!gameRunning) return;

  gameRunning = false;
  clearInterval(gameLoop);

  overlayIcon.textContent = "⏸️";
  overlayTitle.textContent = "Game Paused";
  overlayText.textContent = "Your game is waiting for you!";
  startBtn.textContent = "▶ Resume Game";

  playerNameInput.style.display = "none";
  overlay.classList.remove("hidden");

  pauseBtn.textContent = "▶ Resume";
}

// Update game
function updateGame() {
  direction = { ...nextDirection };

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  const eatingNormal =
    head.x === food.x && head.y === food.y;

  const eatingBonus =
    bonusFood &&
    head.x === bonusFood.x &&
    head.y === bonusFood.y;

  // Wall collision
  if (
    head.x < 0 ||
    head.x >= GRID ||
    head.y < 0 ||
    head.y >= GRID
  ) {
    endGame();
    return;
  }

  // Self collision
  const bodyToCheck = eatingNormal || eatingBonus
    ? snake
    : snake.slice(0, -1);

  if (
    bodyToCheck.some(
      part => part.x === head.x && part.y === head.y
    )
  ) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (eatingNormal) {
    score += 10;
    foodCount++;

    createFood();
    playSound(650);

    // Bonus food after every 5 normal foods
    if (foodCount % 5 === 0) {
      createBonusFood();
    }

  } else if (eatingBonus) {
    score += 50;

    clearTimeout(bonusTimeout);
    bonusFood = null;

    playSound(1000);

  } else {
    snake.pop();
  }

  updateScore();
  drawGame();
}

// Score and high score
function updateScore() {
  scoreDisplay.textContent = String(score).padStart(3, "0");

  if (score > highScore) {
    highScore = score;

    localStorage.setItem("snakeXHighScore", highScore);

    highScoreDisplay.textContent =
      String(highScore).padStart(3, "0");
  }
}

// Save leaderboard
function saveLeaderboard() {
  let scores = [];

  try {
    scores = JSON.parse(
      localStorage.getItem("snakeXLeaderboard") || "[]"
    );

    if (!Array.isArray(scores)) scores = [];
  } catch {
    scores = [];
  }

  scores.push({
    name: playerName,
    score: score,
    date: Date.now()
  });

  scores.sort((a, b) => b.score - a.score);

  scores = scores.slice(0, 5);

  localStorage.setItem(
    "snakeXLeaderboard",
    JSON.stringify(scores)
  );

  renderLeaderboard();
}

// Display leaderboard
function renderLeaderboard() {
  let scores = [];

  try {
    scores = JSON.parse(
      localStorage.getItem("snakeXLeaderboard") || "[]"
    );

    if (!Array.isArray(scores)) scores = [];
  } catch {
    scores = [];
  }

  if (scores.length === 0) {
    leaderboard.innerHTML =
      '<p class="empty-board">No scores yet. Be the first!</p>';
    return;
  }

  leaderboard.innerHTML = scores.map((item, index) => `
    <div class="leader-row">
      <span class="leader-name">
        <span class="rank">${index + 1}.</span>
        ${escapeHTML(item.name)}
      </span>
      <span class="leader-score">${item.score} pts</span>
    </div>
  `).join("");
}

// Protect leaderboard names from HTML injection
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

// Game over
function endGame() {
  gameRunning = false;
  gameOver = true;

  clearInterval(gameLoop);
  clearTimeout(bonusTimeout);

  bonusFood = null;

  saveLeaderboard();

  overlayIcon.textContent = "💜";
  overlayTitle.textContent = "Game Over!";
  overlayText.textContent =
    `${playerName}, your final score is ${score} points.`;

  startBtn.textContent = "↻ Play Again";
  playerNameInput.style.display = "none";

  overlay.classList.remove("hidden");

  pauseBtn.textContent = "Ⅱ Pause";

  playSound(180);
}

// Direction controls
function changeDirection(newDirection) {
  if (!gameRunning) return;

  if (
    newDirection.x === -direction.x &&
    newDirection.y === -direction.y
  ) {
    return;
  }

  nextDirection = newDirection;
}

// Keyboard
document.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  const directions = {
    arrowup: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 },
    d: { x: 1, y: 0 }
  };

  if (directions[key]) {
    event.preventDefault();
    changeDirection(directions[key]);
  }

  if (key === " " || key === "escape") {
    event.preventDefault();

    if (gameRunning) {
      pauseGame();
    } else if (!gameOver) {
      startGame();
    }
  }
});

// Mobile controls
document.querySelectorAll(".direction").forEach(button => {
  button.addEventListener("click", () => {
    const directions = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };

    changeDirection(directions[button.dataset.dir]);
  });
});

// Start button
startBtn.addEventListener("click", () => {
  if (!gameRunning) {
    if (!gameOver && !playerNameInput.value.trim() &&
        playerNameInput.style.display !== "none") {
      playerNameInput.focus();
      playerNameInput.placeholder = "Please enter your name!";
      return;
    }

    playerNameInput.style.display = "block";
    startGame();
  }
});

// Enter key for player name
playerNameInput.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    startBtn.click();
  }
});

// Pause button
pauseBtn.addEventListener("click", () => {
  if (gameRunning) {
    pauseGame();
  } else if (!gameOver) {
    playerNameInput.style.display = "none";
    startGame();
  }
});

// Restart button
restartBtn.addEventListener("click", () => {
  resetGame();

  overlayIcon.textContent = "🐍";
  overlayTitle.textContent = "Ready to Play?";
  overlayText.textContent = "Enter your name and start your neon adventure.";

  playerNameInput.value = playerName === "Player" ? "" : playerName;
  playerNameInput.style.display = "block";

  startBtn.textContent = "▶ Start Game";
  overlay.classList.remove("hidden");

  pauseBtn.textContent = "Ⅱ Pause";
});

// Change difficulty
difficulty.addEventListener("change", () => {
  if (gameRunning) {
    clearInterval(gameLoop);

    gameLoop = setInterval(
      updateGame,
      speeds[difficulty.value]
    );
  }
});

// Change snake skin
skinSelect.addEventListener("change", drawGame);

// Sound effects
function playSound(frequency) {
  if (!soundEnabled) return;

  try {
    audioContext ??= new (
      window.AudioContext || window.webkitAudioContext
    )();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(
      0.12,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.18
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.18);

  } catch {
    console.log("Audio is unavailable.");
  }
}

soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;

  soundBtn.textContent = soundEnabled
    ? "♫ Sound: ON"
    : "♫ Sound: OFF";
});

// Initial setup
renderLeaderboard();
resetGame();

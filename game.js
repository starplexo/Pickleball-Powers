const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = canvas.width, H = canvas.height;

// Load images
const bgImg = new Image(); bgImg.src = 'https://codehs.com/uploads/3368a24a2d41c924f1751f9dc629a606';
const bg2Img = new Image(); bg2Img.src = 'https://codehs.com/uploads/1be150b4553f5ac291f169899ad4edbb';
const bg3Img = new Image(); bg3Img.src = 'https://codehs.com/uploads/d163ac03a8741d6b4eefd693231b5e54';
const p1Img = new Image(); p1Img.src = 'https://codehs.com/uploads/ee546f121d88cfd710ec451683684669';
const p2Img = new Image(); p2Img.src = 'https://codehs.com/uploads/c6f67798ba4baef619c02e60f173ebb7';
// NPC sprites per level
const npc1Img = new Image(); npc1Img.src = 'https://codehs.com/uploads/40ec7760ddfb8f5a4805fd8cf244c32a';
const npc2Img = new Image(); npc2Img.src = 'https://codehs.com/uploads/965ea0faedc72efb31d588ce5b6d976e';
const npc3Img = new Image(); npc3Img.src = 'https://codehs.com/uploads/1ddd99b4e5acf59ae026d78a1b1239d2';
const npcImgs = [npc1Img, npc2Img, npc3Img];

// ---- SFX ----
const wallHitSfx = new Audio('https://codehs.com/uploads/d597ebdb03f4e0a725cc6049458470db');
const hitSfx = new Audio('https://codehs.com/uploads/bb2c4fb84627fa783a50b6a7b19ef745');
const powerupSfx = new Audio('https://codehs.com/uploads/6f7c3709a1bc41098c736ec84fe5a113');
const winSfx = new Audio('https://codehs.com/uploads/c9649409ba7a027288d847bba6dd05d7');
const gamewinSfx = new Audio('https://codehs.com/uploads/c9649409ba7a027288d847bba6dd05d7');

// ---- BACKGROUND MUSIC ----
const bgMusic     = new Audio('https://codehs.com/uploads/7ce2fcee8ee5c06d5c7582a36c0719f2');
const bgMusiclvl1 = new Audio('https://codehs.com/uploads/7ce2fcee8ee5c06d5c7582a36c0719f2');
const bgMusiclvl2 = new Audio('https://codehs.com/uploads/03c8a8b758a70af2f2552ea350d284f3');
const bgMusiclvl3 = new Audio('https://codehs.com/uploads/7dd7d3355edb2577b98171994fafffc4');

// Configure all tracks
[bgMusic, bgMusiclvl1, bgMusiclvl2, bgMusiclvl3].forEach(track => {
  track.loop = true;
  track.volume = 0.4;
});

// Map championship levels to their tracks
const levelMusic = [bgMusiclvl1, bgMusiclvl2, bgMusiclvl3];

let musicStarted = false;
let currentTrack = null;

function stopAllMusic() {
  [bgMusic, bgMusiclvl1, bgMusiclvl2, bgMusiclvl3].forEach(track => {
    track.pause();
    track.currentTime = 0;
  });
  currentTrack = null;
}

function playTrack(track) {
  if (currentTrack === track) return;
  stopAllMusic();
  currentTrack = track;
  track.muted = muteState;
  track.play().catch(() => {});
}

// Mute state shared across all tracks
let muteState = false;

function startMusic() {
  if (!musicStarted) {
    musicStarted = true;
    if (!currentTrack) {
      playTrack(bgMusic);
    }
  }
}

// Start music on first user interaction (required by browsers)
['keydown', 'mousedown', 'touchstart'].forEach(evt =>
  window.addEventListener(evt, startMusic, { once: true })
);

// Mute toggle button
(function createMuteBtn() {
  const btn = document.createElement('button');
  btn.id = 'muteBtn';
  btn.textContent = '🔊';
  btn.title = 'Toggle Music';
  btn.style.cssText = [
    'position:fixed', 'top:10px', 'right:10px', 'z-index:9999',
    'background:#222', 'color:#fff', 'border:2px solid #555',
    'border-radius:6px', 'padding:6px 10px', 'font-size:18px',
    'cursor:pointer', 'font-family:monospace', 'line-height:1'
  ].join(';');
  btn.addEventListener('click', () => {
    muteState = !muteState;
    [bgMusic, bgMusiclvl1, bgMusiclvl2, bgMusiclvl3].forEach(t => t.muted = muteState);
    btn.textContent = muteState ? '🔇' : '🔊';
    startMusic();
  });
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn));
  if (document.body) document.body.appendChild(btn);
})();

function sfxWallHit() {
  try { const s = wallHitSfx.cloneNode(); s.volume = 0.5; s.play(); } catch(e) {}
}
function sfxPaddleHit() {
  try { const s = hitSfx.cloneNode(); s.volume = 0.6; s.play(); } catch(e) {}
}
function sfxScore() {
  try { const s = winSfx.cloneNode(); s.volume = 1.0; s.play(); } catch(e) {}
}
function sfxWin() {
  try { winSfx.currentTime = 0; winSfx.play(); } catch(e) {}
}
function sfxPowerup() {
  try { powerupSfx.currentTime = 0; powerupSfx.play(); } catch(e) {}
}

// ---- LEVEL CONFIG ----
const LEVELS = [
  { num: 1, label: 'ROOKIE RALLY',  ballSpeed: 4.5, playerSpeed: 5.5, powerupInterval: 250, npcSpeed: 2.4, npcError: 75, npcReactDist: 200 },
  { num: 2, label: 'PRO CIRCUIT',   ballSpeed: 5.5, playerSpeed: 6,   powerupInterval: 350, npcSpeed: 3.8, npcError: 42, npcReactDist: 300 },
  { num: 3, label: 'CHAMPIONSHIP',  ballSpeed: 7,   playerSpeed: 6.5, powerupInterval: 500, npcSpeed: 5.4, npcError: 20, npcReactDist: 480 },
];
let currentLevel = 0;

// ---- GAME MODE ----
// 'menu' | '1v1' | 'championship'
let gameMode = 'menu';

// ---- GAME STATE ----
let gameRunning = false;
let scores = [0, 0];
let serving = 0;
let rallyActive = false;
let countdown = 0;
let countdownTimer = 0;
let winner = null;
let frameCount = 0;

const NET_Y = H / 2;
const KITCHEN_W = 90;
const PADDLE_W = 70, PADDLE_H = 18;
const BALL_SIZE = 14;

// Players
const players = [
  { x: W/2, y: 60, vx: 0, score: 0, power: null, powerTimer: 0, frozen: 0, color: '#7cf', side: 0 },
  { x: W/2, y: H-60-PADDLE_H, vx: 0, score: 0, power: null, powerTimer: 0, frozen: 0, color: '#fc7', side: 1 }
];

// Ball
let ball = { x: W/2, y: H/2, vx: 0, vy: 0, bounces: [0,0], active: false, fire: false, curve: 0, size: BALL_SIZE };

// Powerups
let powerups = [];
let powerupTimer = 0;

const POWER_TYPES = [
  { id: 'speed',  label: '⚡SPEED',  color: '#ffff00', glow: '#ffaa00' },
  { id: 'boom',   label: '💣BOOM',   color: '#ff4400', glow: '#ff8800' },
  { id: 'magnet', label: '🧲MAGNET', color: '#aa44ff', glow: '#cc88ff' },
  { id: 'fire',   label: '🔥FIRE',   color: '#ff6600', glow: '#ffaa00' },
  { id: 'freeze', label: '❄️FREEZE', color: '#44ccff', glow: '#88eeff' },
  { id: 'curve',  label: '🌀CURVE',  color: '#00ff88', glow: '#00ffcc' },
];

// Keys
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
  // Dev cheat: * grants P1 a point
  if (e.key === '*' && gameRunning) scorePoint(0);
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Particles
let particles = [];

function spawnParticles(x, y, color, count=8, speed=4) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random()*0.4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * (speed * 0.5 + Math.random()*speed),
      vy: Math.sin(angle) * (speed * 0.5 + Math.random()*speed),
      life: 30 + Math.random()*20,
      maxLife: 50,
      color,
      size: 3 + Math.random()*4
    });
  }
}

// Flash message
let flashMsg = '';
let flashTimer = 0;
function showFlash(msg, t=90) { flashMsg = msg; flashTimer = t; }

function resetBall() {
  const SPEED = LEVELS[currentLevel].ballSpeed;
  ball.x = W/2 + (Math.random()-0.5)*100;
  ball.y = H/2;
  const dir = serving === 0 ? 1 : -1;
  const angle = (Math.random()-0.5)*0.6;
  ball.vy = dir * (SPEED + 1);
  ball.vx = Math.sin(angle) * SPEED;
  ball.bounces = [0, 0];
  ball.active = true;
  ball.fire = false;
  ball.curve = 0;
  ball.size = BALL_SIZE;
}

function startServe() {
  rallyActive = false;
  countdownTimer = 180;
  countdown = 3;
  ball.active = false;
}

function startGame(mode, levelIndex) {
  gameMode = mode || '1v1';
  currentLevel = (typeof levelIndex === 'number') ? levelIndex : 0;
  scores = [0, 0];
  players.forEach((p, i) => {
    p.x = W/2;
    p.vx = 0;
    p.power = null;
    p.powerTimer = 0;
    p.frozen = 0;
  });
  powerups = [];
  particles = [];
  powerupTimer = 0;
  serving = 0;
  winner = null;
  gameRunning = true;
  document.getElementById('overlay').style.display = 'none';

  // ---- MUSIC: play level-specific track in championship, default track in 1v1 ----
  if (gameMode === 'championship') {
    playTrack(levelMusic[currentLevel]);
  } else {
    playTrack(bgMusic);
  }
  musicStarted = true;

  // Update HUD labels
  const lbl = LEVELS[currentLevel];
  if (gameMode === 'championship') {
    document.getElementById('levelLabel').textContent = `LVL ${lbl.num}: ${lbl.label}`;
    document.getElementById('p2label').textContent = 'NPC';
  } else {
    document.getElementById('levelLabel').textContent = '1V1 MODE';
    document.getElementById('p2label').textContent = 'P2';
  }
  startServe();
}

function pixelRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function drawPixelText(text, x, y, size, color, shadow) {
  ctx.font = `${size}px 'Press Start 2P', monospace`;
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(text, x+2, y+2); }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawCourt() {
  const bgs = [bgImg, bg2Img, bg3Img];
  const bg = (gameMode === 'championship') ? bgs[currentLevel] : bgImg;
  if (bg && bg.complete && bg.naturalWidth > 0) {
    ctx.drawImage(bg, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#1a6b1a';
    ctx.fillRect(0, 0, W, H);
  }
}

function drawPlayer(p, idx) {
  let img;
  if (idx === 0) {
    img = p1Img;
  } else if (gameMode === 'championship') {
    img = npcImgs[currentLevel];
  } else {
    img = p2Img;
  }
  const pw = 48, ph = 64;
  const px = p.x - pw/2;
  const py = idx === 0 ? p.y - 4 : p.y - ph + PADDLE_H + 4;

  if (p.frozen > 0) {
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(frameCount * 0.2);
    ctx.fillStyle = '#44ccff';
    ctx.fillRect(px-2, py-2, pw+4, ph+4);
    ctx.restore();
  }

  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, px, py, pw, ph);
  } else {
    pixelRect(p.x - 7, p.y + (idx===0?4:2), 14, 14, idx===0?'#f5c842':'#8B5E3C');
    pixelRect(p.x - 9, p.y + (idx===0?2:0), 18, 22, '#fff');
    pixelRect(p.x - 7, p.y + (idx===0?-16:-16), 6, 18, idx===0?'#c0392b':'#3498db');
    pixelRect(p.x + 1, p.y + (idx===0?-16:-16), 6, 18, idx===0?'#c0392b':'#3498db');
  }

  if (p.power) {
    const type = POWER_TYPES.find(t => t.id === p.power);
    if (type) {
      ctx.save();
      ctx.globalAlpha = 0.8 + 0.2*Math.sin(frameCount*0.15);
      const padX = p.x - PADDLE_W/2;
      const padY = p.y - PADDLE_H/2;
      const bx = padX + PADDLE_W/2 - 14;
      const by = idx===0 ? padY - 20 : padY + PADDLE_H + 6;
      pixelRect(bx, by, 50, 14, type.glow);
      ctx.fillStyle = '#000';
      ctx.font = "10px 'Press Start 2P'";
      ctx.fillText(type.id.toUpperCase(), bx+2, by+10);
      ctx.restore();
    }
  }
}

function drawBall() {
  if (!ball.active) return;
  const bx = Math.round(ball.x - ball.size/2);
  const by = Math.round(ball.y - ball.size/2);
  const bs = ball.size;

  if (ball.fire) {
    spawnParticles(ball.x, ball.y, '#ff6600', 1, 2);
  }

  ctx.save();
  ctx.shadowColor = ball.fire ? '#ff4400' : '#ffff88';
  ctx.shadowBlur = ball.fire ? 20 : 10;

  ctx.fillStyle = ball.fire ? '#ff8800' : '#f5f58a';
  ctx.fillRect(bx+2, by, bs-4, bs);
  ctx.fillRect(bx, by+2, bs, bs-4);
  ctx.fillStyle = '#fff';
  ctx.fillRect(bx+2, by+2, 3, 3);

  ctx.restore();

  for (let i = 0; i < 2; i++) {
    if (ball.bounces[i] >= 1) {
      ctx.fillStyle = `rgba(255,255,0,${0.4 - ball.bounces[i]*0.1})`;
      ctx.fillRect(W-40, Math.round(ball.y)-4, 4, 8);
    }
  }
}

function drawPowerups() {
  powerups.forEach((pu, idx) => {
    const type = POWER_TYPES.find(t => t.id === pu.type);
    if (!type) return;
    const bob = Math.sin(frameCount * 0.08 + idx) * 4;
    const glow = 8 + 4*Math.sin(frameCount*0.1 + idx);
    ctx.save();
    ctx.shadowColor = type.glow;
    ctx.shadowBlur = glow;
    pixelRect(pu.x - 14, pu.y - 14 + bob, 28, 28, type.color);
    pixelRect(pu.x - 10, pu.y - 10 + bob, 20, 20, '#000');
    ctx.font = "13px serif";
    ctx.textAlign = 'center';
    ctx.fillText(pu.icon, pu.x, pu.y + 4 + bob);
    ctx.textAlign = 'left';
    ctx.restore();
  });
}

function drawParticles() {
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x - p.size/2), Math.round(p.y - p.size/2), Math.round(p.size), Math.round(p.size));
    ctx.restore();
  });
}

function drawFlash() {
  if (flashTimer <= 0) return;
  const alpha = Math.min(1, flashTimer / 20);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "28px 'Press Start 2P'";
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000';
  ctx.fillText(flashMsg, W/2+3, H/2+3);
  ctx.fillStyle = '#ffff00';
  ctx.fillText(flashMsg, W/2, H/2);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawCountdown() {
  if (!rallyActive && countdown > 0) {
    const pulse = 1 + 0.15*Math.sin(frameCount*0.3);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.font = `${Math.round(60*pulse)}px 'Press Start 2P'`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4';
    ctx.fillText(countdown, W/2, H/2+20);
    ctx.fillStyle = '#000';
    ctx.font = "10px 'Press Start 2P'";
    const servingLabel = (gameMode === 'championship' && serving === 1) ? 'NPC SERVES' : `P${serving+1} SERVES`;
    ctx.fillText(servingLabel, W/2, H/2 + 70);
    ctx.textAlign = 'left';
    ctx.restore();
  }
}

function updatePlayers() {
  const PLAYER_SPEED = LEVELS[currentLevel].playerSpeed;
  const lvl = LEVELS[currentLevel];
  players.forEach((p, i) => {
    if (p.frozen > 0) { p.frozen--; return; }

    const spd = p.power === 'speed' ? PLAYER_SPEED * 1.8 : PLAYER_SPEED;

    if (i === 0) {
      if (keys['a'] || keys['A']) p.vx = -spd;
      else if (keys['d'] || keys['D']) p.vx = spd;
      else p.vx = 0;
    } else if (gameMode === 'championship') {
      const npcSpd = p.power === 'speed' ? lvl.npcSpeed * 1.8 : lvl.npcSpeed;
      const ballComingToward = ball.vy < 0;
      const ballInRange = Math.abs(ball.y - p.y) < lvl.npcReactDist;

      if (ball.active && (ballComingToward || ballInRange)) {
        const errorOffset = (Math.random() - 0.5) * lvl.npcError;
        const targetX = ball.x + errorOffset;
        const diff = targetX - p.x;
        if (Math.abs(diff) > 4) {
          p.vx = diff > 0 ? npcSpd : -npcSpd;
        } else {
          p.vx = 0;
        }
      } else {
        const diff = W/2 - p.x;
        if (Math.abs(diff) > 8) p.vx = diff > 0 ? npcSpd * 0.4 : -npcSpd * 0.4;
        else p.vx = 0;
      }
    } else {
      if (keys['ArrowLeft']) p.vx = -spd;
      else if (keys['ArrowRight']) p.vx = spd;
      else p.vx = 0;
    }

    p.x += p.vx;
    p.x = Math.max(30 + PADDLE_W/2, Math.min(W - 30 - PADDLE_W/2, p.x));

    if (p.powerTimer > 0) {
      p.powerTimer--;
      if (p.powerTimer === 0) {
        p.power = null;
        updateHUD();
      }
    }
  });
}

function updateBall() {
  if (!ball.active) return;

  if (ball.curve !== 0) {
    ball.vx += ball.curve * 0.05;
    ball.curve *= 0.98;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x - ball.size/2 < 30) { ball.x = 30 + ball.size/2; ball.vx = Math.abs(ball.vx); sfxWallHit(); }
  if (ball.x + ball.size/2 > W - 30) { ball.x = W - 30 - ball.size/2; ball.vx = -Math.abs(ball.vx); sfxWallHit(); }

  if (ball.y < 0) { scorePoint(1); return; }
  if (ball.y > H) { scorePoint(0); return; }

  for (let i = 0; i < 2; i++) {
    const p = players[i];
    const px = p.x - PADDLE_W/2, py = p.y - PADDLE_H/2;
    const hit = i === 0
      ? ball.y - ball.size/2 < py + PADDLE_H && ball.y + ball.size/2 > py && ball.x > px && ball.x < px + PADDLE_W
      : ball.y + ball.size/2 > py && ball.y - ball.size/2 < py + PADDLE_H && ball.x > px && ball.x < px + PADDLE_W;

    if (hit) {
      ball.vy = i === 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
      ball.vx += p.vx * 0.4;
      ball.vx = Math.max(-8, Math.min(8, ball.vx));
      ball.bounces = [0, 0];

      if (p.power === 'boom') {
        ball.vx *= 1.6;
        ball.vy *= 1.6;
        spawnParticles(ball.x, ball.y, '#ff4400', 16, 6);
        showFlash('BOOM!');
        p.power = null; p.powerTimer = 0;
      }
      if (p.power === 'fire') {
        ball.fire = true;
        ball.vy = i===0 ? Math.abs(ball.vy)+2 : -(Math.abs(ball.vy)+2);
        showFlash('ON FIRE!');
      }
      if (p.power === 'curve') {
        ball.curve = i===0 ? 0.8 : -0.8;
        showFlash('CURVE!');
        p.power = null; p.powerTimer = 0;
      }

      spawnParticles(ball.x, ball.y, i===0?'#7cf':'#fc7', 6, 3);
      sfxPaddleHit();
      break;
    }
  }

  players.forEach((p, i) => {
    if (p.power === 'magnet') {
      const side = i === 0 ? ball.x > W/2 : ball.x < W/2;
      if (side) {
        const dx = p.x + PADDLE_W/2 - ball.x;
        const dy = p.y + PADDLE_H/2 - ball.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 200) {
          ball.vx += (dx / dist) * 0.3;
          ball.vy += (dy / dist) * 0.3;
        }
      }
    }
  });
}

function updatePowerups() {
  powerupTimer++;
  if (powerupTimer > LEVELS[currentLevel].powerupInterval && powerups.length < 3) {
    powerupTimer = 0;
    const type = POWER_TYPES[Math.floor(Math.random()*POWER_TYPES.length)];
    const icons = { speed:'⚡', boom:'💣', magnet:'🧲', fire:'🔥', freeze:'❄️', curve:'🌀' };
    powerups.push({
      x: 80 + Math.random()*(W-160),
      y: 60 + Math.random()*(H-120),
      type: type.id,
      icon: icons[type.id],
      life: 600
    });
  }

  powerups = powerups.filter(pu => {
    pu.life--;
    if (pu.life <= 0) return false;

    if (ball.active) {
      const dx = ball.x - pu.x, dy = ball.y - pu.y;
      if (Math.sqrt(dx*dx+dy*dy) < 22) {
        const beneficiary = ball.vy < 0 ? 1 : 0;
        applyPower(beneficiary, pu.type);
        spawnParticles(pu.x, pu.y, '#ffff00', 12, 5);
        sfxPowerup();
        showFlash(pu.type.toUpperCase()+'!');
        return false;
      }
    }
    return true;
  });
}

function applyPower(pidx, type) {
  const p = players[pidx];
  p.power = type;
  p.powerTimer = type === 'fire' ? 600 : 400;

  if (type === 'freeze') {
    players[1-pidx].frozen = 180;
    p.power = null;
    showFlash('FROZEN!');
  }
  updateHUD();
}

function updateHUD() {
  document.getElementById('score1').textContent = scores[0];
  document.getElementById('score2').textContent = scores[1];
  const gi = document.getElementById('gameInfo');

  const names = ['P1 SERVES', gameMode === 'championship' ? 'NPC SERVES' : 'P2 SERVES'];
  gi.textContent = rallyActive ? 'RALLY' : names[serving];

  const pd1 = document.getElementById('power1');
  const pd2 = document.getElementById('power2');
  pd1.textContent = players[0].power ? players[0].power.toUpperCase() : '';
  pd2.textContent = players[1].power ? players[1].power.toUpperCase() : '';
}

function scorePoint(scorer) {
  scores[scorer]++;
  spawnParticles(W/2, scorer===0?80:H-80, scorer===0?'#7cf':'#fc7', 20, 8);
  sfxScore();
  const pointLabel = (gameMode === 'championship' && scorer === 1) ? 'NPC POINT!' : `P${scorer+1} POINT!`;
  showFlash(pointLabel, 100);
  updateHUD();

  const [s0, s1] = scores;
  if ((s0 >= 10 || s1 >= 10) && Math.abs(s0-s1) >= 2) {
    winner = scorer;
    endGame();
    return;
  }

  serving = scorer;
  startServe();
}

function endGame() {
  gameRunning = false;
  const ov = document.getElementById('overlay');

  if (gameMode === '1v1') {
    sfxWin();
    ov.innerHTML = `
      <h1 style="color:#ffd500">&#127942; PLAYER ${winner+1}<br>WINS! &#127942;</h1>
      <div style="font-size:22px;color:#FFEEBC;margin:8px 0">${scores[0]} - ${scores[1]}</div>
      <p style="color:#aaa;font-size:9px">Great match!</p>
      <div style="display:flex;gap:16px;margin-top:8px;flex-wrap:wrap;justify-content:center;">
        <button class="btn" id="rematchBtn" style="padding:16px 28px;font-size:9px">&#9654; REMATCH</button>
        <button class="btn" id="menuBtn" style="background:#444;padding:16px 28px;font-size:9px">&#8592; MENU</button>
      </div>
    `;
    ov.style.display = 'flex';
    document.getElementById('rematchBtn').addEventListener('click', () => startGame('1v1', 0));
    document.getElementById('menuBtn').addEventListener('click', showMenu);
    return;
  }

  const p1won = winner === 0;

  if (!p1won) {
    ov.innerHTML = `
      <h1 style="color:#ff4444">&#128128; GAME OVER &#128128;</h1>
      <div style="font-size:14px;color:#aaa;margin:8px 0">NPC wins Level ${LEVELS[currentLevel].num}</div>
      <div style="font-size:22px;color:#FFEEBC;margin:8px 0">${scores[0]} - ${scores[1]}</div>
      <p style="color:#aaa;font-size:10px">Better luck next time!</p>
      <div style="display:flex;gap:16px;margin-top:8px;flex-wrap:wrap;justify-content:center;">
        <button class="btn" id="retryBtn" style="padding:16px 28px;font-size:9px">&#9654; RETRY LVL ${LEVELS[currentLevel].num}</button>
        <button class="btn" id="menuBtn" style="background:#444;padding:16px 28px;font-size:9px">&#8592; MENU</button>
      </div>
    `;
    ov.style.display = 'flex';
    document.getElementById('retryBtn').addEventListener('click', () => startGame('championship', currentLevel));
    document.getElementById('menuBtn').addEventListener('click', showMenu);
    return;
  }

  const nextLevel = currentLevel + 1;
  if (nextLevel < LEVELS.length) {
    sfxWin();
    const lvl = LEVELS[nextLevel];
    ov.innerHTML = `
      <h1 style="color:#00ff88">&#9989; LEVEL ${LEVELS[currentLevel].num}<br>COMPLETE!</h1>
      <div style="font-size:22px;color:#FFEEBC;margin:8px 0">${scores[0]} - ${scores[1]}</div>
      <div style="font-size:12px;color:#ffdd00;margin:6px 0">NEXT: LVL ${lvl.num} &#8212; ${lvl.label}</div>
      <p style="color:#aaa;font-size:9px">NPC gets smarter... good luck!</p>
      <div style="display:flex;gap:16px;margin-top:8px;flex-wrap:wrap;justify-content:center;">
        <button class="btn" id="nextBtn" style="padding:16px 28px;font-size:9px">&#9654; LEVEL ${lvl.num}</button>
        <button class="btn" id="menuBtn" style="background:#444;padding:16px 28px;font-size:9px">&#8592; MENU</button>
      </div>
    `;
    ov.style.display = 'flex';
    document.getElementById('nextBtn').addEventListener('click', () => startGame('championship', nextLevel));
    document.getElementById('menuBtn').addEventListener('click', showMenu);
  } else {
    sfxWin();
    ov.innerHTML = `
      <div style="font-size:13px;color:#00ff88;margin:4px 0">ALL 3 LEVELS CONQUERED</div>
      <div style="font-size:22px;color:#FFEEBC;margin:8px 0">${scores[0]} - ${scores[1]}</div>
      <p style="color:#aaa;font-size:8px">You've mastered Pickleball Powers!</p>
      <div style="display:flex;gap:16px;margin-top:8px;flex-wrap:wrap;justify-content:center;">
        <button class="btn" id="againBtn" style="padding:16px 28px;font-size:9px">&#9654; PLAY AGAIN</button>
        <button class="btn" id="menuBtn" style="background:#444;padding:16px 28px;font-size:9px">&#8592; MENU</button>
      </div>
    `;
    ov.style.display = 'flex';
    document.getElementById('againBtn').addEventListener('click', () => startGame('championship', 0));
    document.getElementById('menuBtn').addEventListener('click', showMenu);
  }
}

function showMenu() {
  gameMode = 'menu';
  gameRunning = false;
  playTrack(bgMusic);
  const ov = document.getElementById('overlay');
  ov.style.display = 'flex';
  ov.innerHTML = `
    <h1> PICKLEBALL POWERS.  </h1>
    <div class="sub">2D PICKLEBALL REIMAGINED</div>
    <div>
      <p style="font-size:13px;color:#aaa;margin-bottom:4px">Choose your game mode:</p>
      <div style="display:flex;gap:20px;margin-top:8px;flex-wrap:wrap;justify-content:center;">
        <div style="text-align:center">
          <button class="btn" id="btn1v1m" style="background:#0059ff;padding:18px 32px;font-size:10px;">&#9876; 1V1 MODE</button>
          <div style="font-size:8px;color:#888;margin-top:6px;line-height:1.8">P1 vs P2<br>A/D vs Arrow Keys</div>
        </div>
        <div style="text-align:center">
          <button class="btn" id="btnChampm" style="background:#cc5500;padding:18px 32px;font-size:10px;">&#127942; CHAMPIONSHIP</button>
          <div style="font-size:8px;color:#888;margin-top:6px;line-height:1.8">P1 vs NPC<br>3 Levels &#8226; A/D keys</div>
        </div>
      </div>
      <div style="font-size:10px;color:#ffdd00;text-align:left;line-height:2.4;margin-top:14px">
        &#128994; LVL 1 &#8212; ROOKIE RALLY &nbsp;&nbsp;Easy NPC<br>
        &#128993; LVL 2 &#8212; PRO CIRCUIT &nbsp;&nbsp;&nbsp;&nbsp;Smart NPC<br>
        &#128308; LVL 3 &#8212; CHAMPIONSHIP &nbsp;Elite NPC!
      </div>
    </div>
  `;
  document.getElementById('btn1v1m').addEventListener('click', () => startGame('1v1', 0));
  document.getElementById('btnChampm').addEventListener('click', () => startGame('championship', 0));
}

function updateParticles() {
  particles = particles.filter(p => {
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.92; p.vy *= 0.92;
    p.life--;
    return p.life > 0;
  });
}

function gameLoop() {
  requestAnimationFrame(gameLoop);
  frameCount++;

  ctx.clearRect(0, 0, W, H);
  drawCourt();

  if (!gameRunning) {
    drawParticles();
    return;
  }

  if (!rallyActive) {
    if (countdownTimer > 0) {
      countdownTimer--;
      countdown = Math.ceil(countdownTimer / 60);
    } else {
      if (!ball.active) {
        showFlash("GO!", 30);
        rallyActive = true;
        resetBall();
      }
      countdown = 0;
    }
  }

  updatePlayers();
  updateBall();
  updatePowerups();
  updateParticles();

  drawPowerups();
  players.forEach((p, i) => drawPlayer(p, i));
  drawBall();
  drawParticles();
  drawFlash();
  drawCountdown();

  if (flashTimer > 0) flashTimer--;
  updateHUD();
}

document.getElementById('btn1v1').addEventListener('click', () => startGame('1v1', 0));
document.getElementById('btnChamp').addEventListener('click', () => startGame('championship', 0));
gameLoop();
// VOID RUNNER — top-down space shooter
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let W = 0, H = 0, DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * DPR; canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// ---------- Theme ----------
const THEMES = {
  dark: {
    name: 'DARK', bg: ['#120a2e', '#08051a', '#02010a'],
    starA: '#bfe8ff', starB: '#7d8fbf',
    hud: '#eaffff', hudGlow: '#39d0ff', sub: '#6f87b8',
    hull: '#dbeaff', accent: '#1f8fff', shipGlow: '#39d0ff',
    bullet: '#eaffff', bulletGlow: '#7df9ff',
    banner: '#eaffff', bannerGlow: '#7df9ff',
    control: 'rgba(160,185,230,0.75)', overlay: 'rgba(3,2,10,0.72)',
    overlayText: '#f4eaff', wave: '#8fa6d6', life: '#7df9ff', lifeOff: 'rgba(120,150,200,0.22)',
    trail: ['#9df6ff', '#2ea8ff']
  },
  light: {
    name: 'LIGHT', bg: ['#ffe3f1', '#e3edff', '#cfe0ff'],
    starA: '#8b6cf0', starB: '#a994f5',
    hud: '#2a1a55', hudGlow: '#ffffff', sub: '#7a68a8',
    hull: '#43307a', accent: '#ff4d9d', shipGlow: '#ff8fd0',
    bullet: '#2b2a6e', bulletGlow: '#9b7bff',
    banner: '#2a1a55', bannerGlow: '#ff8fd0',
    control: 'rgba(72,56,120,0.8)', overlay: 'rgba(255,245,252,0.8)',
    overlayText: '#2a1a55', wave: '#7a68a8', life: '#ff5fa2', lifeOff: 'rgba(80,60,140,0.18)',
    trail: ['#ffb3dd', '#ff4d9d']
  }
};
let themeName = localStorage.getItem('void_theme') || 'dark';
const T = () => THEMES[themeName];
function toggleTheme() {
  themeName = themeName === 'dark' ? 'light' : 'dark';
  localStorage.setItem('void_theme', themeName);
  game.banner = T().name + ' MODE'; game.bannerTimer = 1.2;
  blip(themeName === 'dark' ? 320 : 760, 0.16, 'sine', 0.05, themeName === 'dark' ? -120 : 180);
}

// ---------- Audio ----------
let AC = null;
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
function blip(freq = 440, dur = 0.08, type = 'square', vol = 0.05, slide = 0) {
  const ac = audio(); if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), ac.currentTime + dur);
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
}
function noiseBurst(dur = 0.3, vol = 0.15) {
  const ac = audio(); if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const s = ac.createBufferSource(); s.buffer = buf;
  const g = ac.createGain(); g.gain.value = vol;
  const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200;
  s.connect(f).connect(g).connect(ac.destination); s.start();
}

function meow(pitch = 1) {
  const ac = audio(); if (!ac) return;
  const t = ac.currentTime;
  const o = ac.createOscillator(), g = ac.createGain();
  const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 2;
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(520 * pitch, t);
  o.frequency.exponentialRampToValueAtTime(760 * pitch, t + 0.09);
  o.frequency.exponentialRampToValueAtTime(430 * pitch, t + 0.3);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  o.connect(f).connect(g).connect(ac.destination);
  o.start(t); o.stop(t + 0.34);
}

// ---------- Input ----------
const keys = {};
window.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  keys[e.key.toLowerCase()] = true;
  audio();
  if (e.key === ' ' && game.state === 'playing') fire();
  if (e.key.toLowerCase() === 'r') reset();
  if (e.key.toLowerCase() === 'l') toggleTheme();
  if (e.key.toLowerCase() === 'b' && game.state === 'playing') spawnBoss();
  if (e.key.toLowerCase() === 'p' && game.state === 'playing') game.paused = !game.paused;
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// ---------- Game state ----------
const game = {
  state: 'playing', score: 0, best: +(localStorage.getItem('voidrunner_best') || 0),
  lives: 3, wave: 1, shake: 0, time: 0, paused: false,
  spawnTimer: 0, spawnRate: 1.15, combo: 1, comboTimer: 0,
  flash: 0, banner: '', bannerTimer: 0, boss: null, bossWavesDone: [],
  coins: 0, coinStreak: 0, coinTimer: 0
};

const player = { x: 0, y: 0, vx: 0, vy: 0, r: 15, cool: 0, invuln: 0, thrust: 0, angle: 0 };
let bullets = [], ebullets = [], enemies = [], particles = [], stars = [], powerups = [], floaties = [], coins = [];

function initStars() {
  stars = [];
  for (let i = 0; i < 220; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * 2 + 0.3, s: Math.random() * 1.8 + 0.4 });
  }
}
initStars();

function reset() {
  game.state = 'playing'; game.score = 0; game.lives = 3; game.wave = 1;
  game.shake = 0; game.spawnTimer = 0.6; game.spawnRate = 1.15; game.combo = 1; game.comboTimer = 0;
  game.paused = false; game.boss = null; game.bossWavesDone = []; game.banner = 'WAVE 1 — CATS INBOUND'; game.bannerTimer = 1.6;
  game.coins = 0; game.coinStreak = 0; game.coinTimer = 0;
  bullets = []; ebullets = []; enemies = []; particles = []; powerups = []; floaties = []; coins = [];
  player.x = W / 2; player.y = H * 0.78; player.vx = 0; player.vy = 0;
  player.cool = 0; player.invuln = 1.5;
  initStars();
}
reset();

// ---------- Helpers ----------
const rand = (a, b) => a + Math.random() * (b - a);
function burst(x, y, color, n = 18, speed = 220, life = 0.7) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = rand(speed * 0.2, speed);
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(life * 0.4, life), max: life, color, r: rand(1, 3.2) });
  }
}
function dropCoins(x, y, n = 1, power = 120) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = rand(power * 0.4, power);
    coins.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, r: 10, t: rand(0, 6) });
  }
}
function floatText(x, y, text, color) {
  floaties.push({ x, y, text, color, life: 1, vy: -50 });
}

// ---------- Firing ----------
function fire() {
  if (player.cool > 0 || game.paused) return;
  player.cool = 0.13;
  const lvl = game.wave;
  const spread = lvl >= 6 ? [-0.16, 0, 0.16] : lvl >= 3 ? [-0.1, 0.1] : [0];
  for (const off of spread) {
    bullets.push({ x: player.x + off * 28, y: player.y - 18, vx: Math.sin(off) * 620, vy: -720, r: 3.5, life: 2 });
  }
  blip(760 + Math.random() * 80, 0.06, 'square', 0.035, -420);
  burst(player.x, player.y - 16, '#7df9ff', 3, 90, 0.18);
}

// ---------- Enemies ----------
const ENEMY_TYPES = {
  scout: { hp: 1, r: 15, speed: 105, color: '#ff4d9d', score: 10 },
  zig:   { hp: 2, r: 17, speed: 88, color: '#ffb347', score: 20 },
  tank:  { hp: 4, r: 26, speed: 48,  color: '#b566ff', score: 40 },
  rock:  { hp: 3, r: 24, speed: 66,  color: '#8899bb', score: 25 }
};
function spawnEnemy() {
  const roll = Math.random();
  let type = 'scout';
  if (game.wave >= 2 && roll > 0.55) type = 'zig';
  if (game.wave >= 3 && roll > 0.82) type = 'tank';
  if (game.wave >= 2 && roll > 0.44 && roll < 0.55) type = 'rock';
  const t = ENEMY_TYPES[type];
  const x = rand(40, W - 40);
  if (Math.random() < 0.35) meow(rand(0.8, 1.3));
  enemies.push({
    type, x, y: -40, hp: t.hp + Math.floor(game.wave / 4), maxhp: t.hp + Math.floor(game.wave / 4),
    r: t.r, speed: t.speed + game.wave * 3.5, color: t.color, score: t.score,
    t: rand(0, 10), baseX: x, shootTimer: rand(1.2, 2.6), hitFlash: 0, rot: 0
  });
}

function damageEnemy(e, dmg, bx, by) {
  e.hp -= dmg; e.hitFlash = 0.12;
  burst(bx, by, '#fff', 4, 120, 0.25);
  if (e.hp <= 0) {
    e.dead = true;
    const pts = Math.round(e.score * game.combo);
    game.score += pts;
    floatText(e.x, e.y, '+' + pts, e.color);
    if (Math.random() < 0.35) floatText(e.x, e.y - 22, 'MEOW!', '#ffd166');
    meow(rand(1.1, 1.6));
    burst(e.x, e.y, e.color, 26, 300, 0.8);
    game.shake = Math.min(14, game.shake + 5);
    noiseBurst(0.35, 0.1);
    game.combo = Math.min(5, game.combo + 0.25); game.comboTimer = 2.5;
    dropCoins(e.x, e.y, e.type === 'tank' ? 4 : e.type === 'rock' ? 2 : 1, e.type === 'scout' ? 90 : 150);
    if (Math.random() < 0.09 + (e.type === 'tank' ? 0.15 : 0)) {
      powerups.push({ x: e.x, y: e.y, vy: 70, r: 12, kind: Math.random() < 0.5 ? 'rapid' : 'shield', t: 0 });
    }
  }
}

// ---------- Boss ----------
function spawnBoss() {
  const hp = 55 + game.wave * 22;
  game.boss = {
    type: 'boss', x: W / 2, y: -130, targetY: Math.min(320, H * 0.32), r: 62,
    hp, maxhp: hp, color: '#ff4d9d', hitFlash: 0, rot: 0, t: 0,
    entering: true, shootA: 1.6, shootB: 2.6, summonT: 5.5, dead: false
  };
  game.banner = 'WARNING — CAT QUEEN'; game.bannerTimer = 2.2;
  blip(90, 0.5, 'sawtooth', 0.08, 60); meow(0.55);
}

function damageBoss(b, bx, by) {
  b.hp -= 1; b.hitFlash = 0.1;
  burst(bx, by, '#ffffff', 3, 110, 0.2);
  if (b.hp <= 0) {
    b.dead = true;
    const pts = 600 + game.wave * 250;
    game.score += pts;
    floatText(b.x, b.y, '+' + pts, '#ffd166');
    for (let i = 0; i < 5; i++) burst(b.x + rand(-50, 50), b.y + rand(-40, 40), i % 2 ? '#ffd166' : '#ff4d9d', 30, 400, 1.1);
    game.shake = 26; game.flash = 0.7;
    noiseBurst(0.8, 0.25); meow(0.5); blip(140, 0.6, 'sine', 0.08, 220);
    game.banner = 'CAT QUEEN DOWN!'; game.bannerTimer = 2.2;
    game.bossWavesDone.push(game.wave);
    for (let i = 0; i < 2; i++) powerups.push({ x: b.x + rand(-60, 60), y: b.y, vy: 60, r: 12, kind: i ? 'shield' : 'rapid', t: 0 });
    for (let i = 0; i < 16; i++) dropCoins(b.x + rand(-40, 40), b.y + rand(-30, 30), 1, 380);
    game.boss = null;
  }
}

// ---------- Update ----------
function update(dt) {
  game.time += dt;
  if (game.state !== 'playing' || game.paused) return;

  // timers
  game.shake *= Math.pow(0.0025, dt);
  game.flash *= Math.pow(0.0005, dt);
  player.cool -= dt; player.invuln -= dt;
  if (game.comboTimer > 0) { game.comboTimer -= dt; if (game.comboTimer <= 0) game.combo = 1; }
  if (game.bannerTimer > 0) game.bannerTimer -= dt;

  // player movement
  const acc = 2000, drag = Math.pow(0.0008, dt);
  let ix = (keys['arrowright'] || keys['d'] ? 1 : 0) - (keys['arrowleft'] || keys['a'] ? 1 : 0);
  let iy = (keys['arrowdown'] || keys['s'] ? 1 : 0) - (keys['arrowup'] || keys['w'] ? 1 : 0);
  player.vx += ix * acc * dt; player.vy += iy * acc * dt;
  player.vx *= drag; player.vy *= drag;
  const maxv = 470;
  const sp = Math.hypot(player.vx, player.vy);
  if (sp > maxv) { player.vx = player.vx / sp * maxv; player.vy = player.vy / sp * maxv; }
  player.x += player.vx * dt; player.y += player.vy * dt;
  player.x = Math.max(player.r + 6, Math.min(W - player.r - 6, player.x));
  player.y = Math.max(H * 0.15, Math.min(H - player.r - 10, player.y));
  player.angle += ((player.vx / maxv) * 0.45 - player.angle) * Math.min(1, dt * 10);

  player.thrust = Math.min(1, player.thrust + dt * 4 * (iy > 0 || ix !== 0 ? 1 : 0.2));
  if (keys[' ']) fire();
  // engine trail
  if (Math.random() < 0.9) {
    particles.push({ x: player.x + rand(-4, 4), y: player.y + 16, vx: rand(-30, 30) - player.vx * 0.15, vy: rand(60, 160), life: 0.35, max: 0.35, color: Math.random() < 0.5 ? '#39d0ff' : '#ff8a3d', r: rand(1, 3) });
  }

  // starfield
  for (const s of stars) {
    s.y += (30 + s.z * 90 + Math.abs(player.vy) * 0.15) * dt;
    s.x -= player.vx * dt * s.z * 0.25;
    if (s.y > H) { s.y = -4; s.x = Math.random() * W; }
    if (s.x < -4) s.x = W + 4; if (s.x > W + 4) s.x = -4;
  }

  // spawn
  game.spawnTimer -= dt;
  if (!game.boss && game.spawnTimer <= 0) {
    spawnEnemy();
    game.spawnTimer = Math.max(0.4, game.spawnRate - game.wave * 0.04) * rand(0.7, 1.3);
  }
  // boss arrives every third wave
  if (!game.boss && game.wave % 3 === 0 && !game.bossWavesDone.includes(game.wave)) spawnBoss();
  const newWave = 1 + Math.floor(game.score / 500);
  if (!game.boss && newWave > game.wave) {
    game.wave = newWave;
    game.banner = 'WAVE ' + game.wave + ' — MORE CATS'; game.bannerTimer = 1.8;
    blip(220, 0.25, 'sawtooth', 0.06, 260); blip(440, 0.35, 'sine', 0.05, 220);
  }

  // bullets
  for (const b of bullets) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (b.y < -20 || b.life <= 0) b.dead = true; }
  for (const b of ebullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.y > H + 20 || b.y < -20 || b.x < -20 || b.x > W + 20 || b.life <= 0) b.dead = true;
  }

  // enemies
  for (const e of enemies) {
    e.t += dt; e.hitFlash -= dt; e.rot += dt * (e.type === 'rock' ? 1.2 : 2);
    if (e.type === 'zig') { e.x = e.baseX + Math.sin(e.t * 2.4) * 120; e.y += e.speed * dt; }
    else if (e.type === 'scout') {
      e.y += e.speed * dt;
      e.x += Math.sin(e.t * 1.6) * 40 * dt + (player.x - e.x) * 0.25 * dt;
    } else if (e.type === 'tank') {
      e.y += e.speed * dt;
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && e.y > 0 && e.y < H * 0.7) {
        e.shootTimer = rand(1.3, 2.2);
        const a = Math.atan2(player.y - e.y, player.x - e.x);
        for (let k = -1; k <= 1; k++) ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a + k * 0.22) * 200, vy: Math.sin(a + k * 0.22) * 200, r: 5, life: 4, color: '#c98bff' });
        blip(180, 0.12, 'sawtooth', 0.03, -60);
      }
    } else {
      e.y += e.speed * dt; e.x += Math.sin(e.t * 0.9) * 30 * dt;
    }
    e.x = Math.max(e.r, Math.min(W - e.r, e.x));
    if (e.y > H + 60) e.dead = true;

    // bullets hit
    for (const b of bullets) {
      if (b.dead) continue;
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + b.r) {
        b.dead = true; damageEnemy(e, 1, b.x, b.y);
        if (e.dead) break;
      }
    }
    if (e.dead) continue;

    // player collide
    if (player.invuln <= 0 && Math.hypot(player.x - e.x, player.y - e.y) < player.r + e.r * 0.85) {
      e.dead = true; hurtPlayer(); burst(e.x, e.y, e.color, 20, 260, 0.7);
    }
  }

  // boss update
  const boss = game.boss;
  if (boss) {
    boss.t += dt; boss.hitFlash -= dt; boss.rot += dt * 0.6;
    if (boss.entering) {
      boss.y += 150 * dt;
      if (boss.y >= boss.targetY) { boss.y = boss.targetY; boss.entering = false; }
    } else {
      boss.x = W / 2 + Math.sin(boss.t * 0.45) * Math.min(W * 0.32, 460);
      boss.y = boss.targetY + Math.sin(boss.t * 1.1) * 18;
      boss.shootA -= dt; boss.shootB -= dt; boss.summonT -= dt;
      if (boss.shootA <= 0) {
        boss.shootA = 2.1;
        const n = 14;
        for (let i = 0; i < n; i++) {
          const a = Math.PI * 0.12 + (i / (n - 1)) * Math.PI * 0.76;
          ebullets.push({ x: boss.x, y: boss.y + 30, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, r: 6, life: 5, color: '#ffd166' });
        }
        meow(0.7); game.shake = Math.max(game.shake, 4);
      }
      if (boss.shootB <= 0) {
        boss.shootB = 1.15;
        const a = Math.atan2(player.y - boss.y, player.x - boss.x);
        for (let k = -1; k <= 1; k++) ebullets.push({ x: boss.x + k * 18, y: boss.y + 34, vx: Math.cos(a + k * 0.16) * 250, vy: Math.sin(a + k * 0.16) * 250, r: 5, life: 4, color: '#ff8fd0' });
        blip(240, 0.1, 'square', 0.03, -80);
      }
      if (boss.summonT <= 0) {
        boss.summonT = 7;
        for (let k = -1; k <= 1; k += 2) {
          const t = ENEMY_TYPES.scout;
          enemies.push({ type: 'scout', x: boss.x + k * boss.r, y: boss.y, hp: 1, maxhp: 1, r: t.r, speed: 120, color: t.color, score: t.score, t: 0, baseX: boss.x + k * boss.r, shootTimer: 2, hitFlash: 0, rot: 0 });
        }
        meow(1.5);
      }
    }
    // player bullets
    for (const b of bullets) {
      if (b.dead) continue;
      if (Math.hypot(b.x - boss.x, b.y - boss.y) < boss.r * 0.95 + b.r) {
        b.dead = true; damageBoss(boss, b.x, b.y);
        if (boss.dead) break;
      }
    }
    // body collision
    if (!boss.dead && player.invuln <= 0 && Math.hypot(player.x - boss.x, player.y - boss.y) < player.r + boss.r * 0.7) hurtPlayer();
    if (boss.dead) game.boss = null;
  }

  // enemy bullets hit player
  for (const b of ebullets) {
    if (player.invuln > 0) continue;
    if (Math.hypot(player.x - b.x, player.y - b.y) < player.r + b.r) {
      b.dead = true; hurtPlayer();
    }
  }

  // coins — drift, magnet, collect
  if (game.coinTimer > 0) { game.coinTimer -= dt; if (game.coinTimer <= 0) game.coinStreak = 0; }
  for (const c of coins) {
    c.t += dt;
    const dx = player.x - c.x, dy = player.y - c.y, d = Math.hypot(dx, dy) || 1;
    if (d < 200) {
      const pull = (1 - d / 200) * 2600 + 260;
      c.vx += (dx / d) * pull * dt; c.vy += (dy / d) * pull * dt;
    } else {
      c.vy += 110 * dt;
    }
    c.vx *= Math.pow(0.5, dt); c.vy *= Math.pow(0.5, dt);
    c.x += c.vx * dt; c.y += c.vy * dt;
    if (c.y > H + 30) c.dead = true;
    if (d < player.r + c.r + 8) {
      c.dead = true;
      game.coins++;
      game.score += 25;
      game.coinStreak++; game.coinTimer = 0.7;
      const pitch = 760 + Math.min(game.coinStreak, 20) * 42;
      blip(pitch, 0.06, 'square', 0.035, 180);
      blip(pitch * 1.5, 0.09, 'sine', 0.03, 120);
      floatText(c.x, c.y - 4, '+25', '#ffd166');
      burst(c.x, c.y, '#ffd166', 7, 150, 0.45);
      if (Math.random() < 0.5) burst(c.x, c.y, '#fff3b0', 3, 90, 0.3);
    }
  }
  coins = coins.filter(c => !c.dead);

  // powerups
  for (const p of powerups) {
    p.y += p.vy * dt; p.t += dt;
    if (p.y > H + 20) p.dead = true;
    if (Math.hypot(player.x - p.x, player.y - p.y) < player.r + p.r + 6) {
      p.dead = true;
      if (p.kind === 'rapid') { player.cool = -2.5; floatText(p.x, p.y, 'RAPID', '#7df9ff'); game.score += 15; }
      else { player.invuln = Math.max(player.invuln, 4); floatText(p.x, p.y, 'SHIELD', '#7dffb0'); game.score += 15; }
      blip(880, 0.15, 'sine', 0.06, 300);
      burst(p.x, p.y, '#fff', 12, 160, 0.5);
    }
  }

  // particles
  for (const p of particles) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= Math.pow(0.1, dt); p.vy *= Math.pow(0.1, dt);
    p.life -= dt;
  }
  for (const f of floaties) { f.y += f.vy * dt; f.vy *= Math.pow(0.2, dt); f.life -= dt * 1.2; }

  // wave spawning
  bullets = bullets.filter(b => !b.dead);
  ebullets = ebullets.filter(b => !b.dead);
  enemies = enemies.filter(e => !e.dead);
  particles = particles.filter(p => p.life > 0);
  floaties = floaties.filter(f => f.life > 0);
  powerups = powerups.filter(p => !p.dead);

  if (game.score > game.best) { game.best = game.score; localStorage.setItem('voidrunner_best', game.best); }
}

function hurtPlayer() {
  game.lives--;
  player.invuln = 2;
  game.shake = 18; game.flash = 0.8;
  game.combo = 1;
  burst(player.x, player.y, '#7df9ff', 30, 340, 0.9);
  noiseBurst(0.45, 0.2); blip(120, 0.4, 'sawtooth', 0.08, -80);
  if (game.lives <= 0) {
    game.state = 'over';
    burst(player.x, player.y, '#fff', 60, 480, 1.2);
  }
}

// ---------- Drawing ----------
function drawShip(x, y, angle, invuln) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle);
  const flick = invuln > 0 && Math.floor(performance.now() / 70) % 2 === 0;
  ctx.globalAlpha = flick ? 0.35 : 1;
  // exhaust flame
  const fl = 12 + Math.sin(performance.now() / 40) * 5;
  const grd = ctx.createLinearGradient(0, 10, 0, 10 + fl);
  const tc = T().trail; grd.addColorStop(0, tc[0]); grd.addColorStop(0.5, tc[1]); grd.addColorStop(1, 'rgba(255,140,0,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.moveTo(-6, 10); ctx.lineTo(0, 10 + fl); ctx.lineTo(6, 10); ctx.closePath(); ctx.fill();

  // hull
  ctx.shadowColor = T().shipGlow; ctx.shadowBlur = 22;
  ctx.fillStyle = T().hull;
  ctx.strokeStyle = themeName === 'light' ? '#2a1a55' : 'rgba(180,230,255,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, 19, 0, 7); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -20); ctx.lineTo(9, 2); ctx.lineTo(18, 12); ctx.lineTo(6, 9);
  ctx.lineTo(0, 14); ctx.lineTo(-6, 9); ctx.lineTo(-18, 12); ctx.lineTo(-9, 2);
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = T().accent;
  ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(5, 1); ctx.lineTo(0, 7); ctx.lineTo(-5, 1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff9a3d';
  ctx.beginPath(); ctx.arc(0, -6, 3, 0, 7); ctx.fill();
  ctx.restore();
}

function drawEnemy(e) {
  const r = e.r;
  const fur = e.hitFlash > 0 ? '#ffffff' : e.color;
  const dark = e.hitFlash > 0 ? '#ffffff' : 'rgba(10,4,24,0.55)';
  ctx.save();
  ctx.translate(e.x, e.y + Math.sin(e.t * 3 + e.x) * 2);
  ctx.rotate(e.type === 'rock' ? Math.sin(e.t) * 0.25 : e.rot * 0.06 + Math.sin(e.t * 1.4) * 0.08);
  ctx.shadowColor = e.color; ctx.shadowBlur = 18;

  // ears
  ctx.fillStyle = fur;
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sgn * r * 0.75, -r * 0.45);
    ctx.lineTo(sgn * r * 0.5, -r * 1.28);
    ctx.lineTo(sgn * r * 0.08, -r * 0.72);
    ctx.closePath(); ctx.fill();
  }
  // fluffy tank cheeks
  if (e.type === 'tank' || e.type === 'boss') {
    for (const sgn of [-1, 1]) {
      ctx.beginPath(); ctx.arc(sgn * r * 0.78, r * 0.18, r * 0.42, 0, 7); ctx.fill();
    }
  }
  // head
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.92, 0, 0, 7); ctx.fill();
  ctx.shadowBlur = 0;

  // inner ears
  ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : 'rgba(255,180,215,0.9)';
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sgn * r * 0.62, -r * 0.52);
    ctx.lineTo(sgn * r * 0.48, -r * 1.05);
    ctx.lineTo(sgn * r * 0.22, -r * 0.7);
    ctx.closePath(); ctx.fill();
  }

  // tabby stripes
  if (e.type === 'zig' || e.type === 'rock') {
    ctx.strokeStyle = e.hitFlash > 0 ? '#ffffff' : 'rgba(0,0,0,0.22)';
    ctx.lineWidth = Math.max(2, r * 0.11); ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.38, -r * 0.72);
      ctx.lineTo(i * r * 0.38, -r * 0.44);
      ctx.stroke();
    }
  }
  // tank forehead patch
  if (e.type === 'tank' || e.type === 'boss') {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.ellipse(0, -r * 0.45, r * 0.34, r * 0.16, 0, 0, 7); ctx.fill();
  }

  // eyes (blink)
  const blink = (Math.sin(e.t * 1.7 + e.x * 0.05) > 0.97);
  for (const sgn of [-1, 1]) {
    if (blink) {
      ctx.strokeStyle = dark; ctx.lineWidth = Math.max(2, r * 0.12);
      ctx.beginPath(); ctx.moveTo(sgn * r * 0.45, -r * 0.14); ctx.lineTo(sgn * r * 0.18, -r * 0.14); ctx.stroke();
    } else {
      ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#eaffff';
      ctx.beginPath(); ctx.ellipse(sgn * r * 0.32, -r * 0.12, r * 0.21, r * 0.24, 0, 0, 7); ctx.fill();
      ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#0b0620';
      ctx.beginPath(); ctx.ellipse(sgn * r * 0.32 + Math.sin(e.t * 2) * r * 0.04, -r * 0.1, r * 0.07, r * 0.19, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(sgn * r * 0.25, -r * 0.22, r * 0.06, 0, 7); ctx.fill();
    }
  }

  // nose + mouth
  ctx.fillStyle = '#ff7fa8';
  ctx.beginPath();
  ctx.moveTo(0, r * 0.2); ctx.lineTo(-r * 0.13, r * 0.08); ctx.lineTo(r * 0.13, r * 0.08);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = dark; ctx.lineWidth = Math.max(1.5, r * 0.06);
  ctx.beginPath();
  ctx.moveTo(0, r * 0.22);
  ctx.quadraticCurveTo(-r * 0.1, r * 0.4, -r * 0.22, r * 0.3);
  ctx.moveTo(0, r * 0.22);
  ctx.quadraticCurveTo(r * 0.1, r * 0.4, r * 0.22, r * 0.3);
  ctx.stroke();

  // whiskers
  ctx.strokeStyle = e.hitFlash > 0 ? '#ffffff' : 'rgba(230,240,255,0.8)';
  ctx.lineWidth = 1.4;
  for (const sgn of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(sgn * r * 0.55, r * 0.06 + i * r * 0.09);
      ctx.lineTo(sgn * r * 1.3, r * (0.0 + i * 0.14) - r * 0.04);
      ctx.stroke();
    }
  }

  // pink collar for the big cats
  if (e.type === 'tank' || e.type === 'boss') {
    ctx.strokeStyle = '#ff4d9d'; ctx.lineWidth = Math.max(3, r * 0.14);
    ctx.beginPath(); ctx.arc(0, r * 0.5, r * 0.6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(0, r * 0.5 + r * 0.58, r * 0.12, 0, 7); ctx.fill();
  }
  ctx.restore();

  if (e.type !== 'boss' && e.maxhp > 2 && e.hp < e.maxhp) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(e.x - 22, e.y - e.r - 16, 44, 4);
    ctx.fillStyle = '#7dffb0';
    ctx.fillRect(e.x - 22, e.y - e.r - 16, 44 * (e.hp / e.maxhp), 4);
  }
}

function render() {
  // background
  const bg = ctx.createRadialGradient(W / 2, H * 0.6, 0, W / 2, H * 0.6, Math.max(W, H) * 0.8);
  const th = T();
  bg.addColorStop(0, th.bg[0]); bg.addColorStop(0.5, th.bg[1]); bg.addColorStop(1, th.bg[2]);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  ctx.save();
  if (game.shake > 0.3) ctx.translate(rand(-game.shake, game.shake), rand(-game.shake, game.shake));

  // stars
  for (const s of stars) {
    ctx.globalAlpha = (themeName === 'light' ? 0.45 : 0.25) + s.z * 0.3;
    ctx.fillStyle = s.z > 1.6 ? th.starA : th.starB;
    ctx.fillRect(s.x, s.y, s.s, s.s * (1 + s.z));
  }
  ctx.globalAlpha = 1;

  // particles
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max) * 0.9;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (p.life / p.max + 0.3), 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // coins
  for (const c of coins) {
    const sx = Math.max(0.16, Math.abs(Math.cos(c.t * 5)));
    const bob = Math.sin(c.t * 4) * 1.6;
    ctx.save(); ctx.translate(c.x, c.y + bob);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.scale(sx, 1);
    ctx.shadowColor = '#ffb800'; ctx.shadowBlur = 16;
    const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, 10);
    g.addColorStop(0, '#fff6c0'); g.addColorStop(0.55, '#ffd166'); g.addColorStop(1, '#e09a00');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(140,84,0,0.75)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, 0, 6.4, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(-2.6, -3, 2.1, 0, 7); ctx.fill();
    ctx.restore();
  }

  // powerups
  for (const p of powerups) {
    const bob = Math.sin(p.t * 6) * 2;
    ctx.save(); ctx.translate(p.x, p.y + bob); ctx.rotate(p.t * 2);
    ctx.shadowColor = p.kind === 'rapid' ? '#7df9ff' : '#7dffb0'; ctx.shadowBlur = 20;
    ctx.strokeStyle = p.kind === 'rapid' ? '#7df9ff' : '#7dffb0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(10, 0); ctx.lineTo(0, 12); ctx.lineTo(-10, 0); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Orbitron, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.rotate(-p.t * 2); ctx.fillText(p.kind === 'rapid' ? 'R' : 'S', 0, 1);
    ctx.restore();
  }

  // bullets
  for (const b of bullets) {
    ctx.shadowColor = th.bulletGlow; ctx.shadowBlur = 18;
    ctx.fillStyle = th.bullet;
    ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r, b.r * 2.4, 0, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
  }
  for (const b of ebullets) {
    ctx.shadowColor = b.color || '#ff4d9d'; ctx.shadowBlur = 14;
    ctx.fillStyle = b.color || '#ff4d9d';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
  }

  for (const e of enemies) drawEnemy(e);
  if (game.boss) {
    const b = game.boss;
    drawEnemy(b);
    // crown
    ctx.save(); ctx.translate(b.x, b.y - b.r * 1.42); ctx.rotate(Math.sin(b.t) * 0.06);
    ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(-38, 12); ctx.lineTo(-44, -22); ctx.lineTo(-18, -2); ctx.lineTo(0, -30);
    ctx.lineTo(18, -2); ctx.lineTo(44, -22); ctx.lineTo(38, 12);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff4d9d';
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * 20, 2, 4.5, 0, 7); ctx.fill(); }
    ctx.restore();
  }

  if (game.state === 'playing' || game.state === 'over') {
    if (game.state === 'playing') drawShip(player.x, player.y, player.angle, player.invuln);
  }

  // float text
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const f of floaties) {
    ctx.globalAlpha = Math.min(1, f.life);
    ctx.font = 'bold 18px Orbitron, sans-serif';
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  drawHUD();

  if (game.flash > 0.01) {
    ctx.fillStyle = `rgba(255,80,120,${game.flash * 0.5})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (game.bannerTimer > 0 && game.state === 'playing') {
    const a = Math.min(1, game.bannerTimer * 1.5);
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.font = '900 44px Orbitron, sans-serif';
    ctx.shadowColor = T().bannerGlow; ctx.shadowBlur = themeName === 'light' ? 10 : 30;
    ctx.fillStyle = T().banner;
    ctx.fillText(game.banner, W / 2, H * 0.3);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  if (game.paused && game.state === 'playing') {
    overlay('PAUSED', 'PRESS P TO RESUME');
  }
  if (game.state === 'over') {
    overlay('GAME OVER', 'PRESS R TO RESTART', `SCORE ${game.score}   BEST ${game.best}`);
  }
}

function drawHUD() {
  ctx.save();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.font = '900 30px Orbitron, sans-serif';
  ctx.fillStyle = T().hud;
  ctx.shadowColor = T().hudGlow; ctx.shadowBlur = 16;
  ctx.fillText(String(game.score).padStart(6, '0'), 22, 18);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 12px Orbitron, sans-serif';
  ctx.fillStyle = T().sub;
  ctx.fillText('SCORE', 24, 54);
  ctx.fillText(`BEST ${game.best}`, 24, 74);

  // coin wallet
  ctx.save();
  ctx.translate(33, 108);
  ctx.shadowColor = '#ffb800'; ctx.shadowBlur = 12;
  const cg = ctx.createRadialGradient(-2, -2, 1, 0, 0, 9);
  cg.addColorStop(0, '#fff6c0'); cg.addColorStop(0.6, '#ffd166'); cg.addColorStop(1, '#d89300');
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(140,84,0,0.8)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, 6.2, 0, 7); ctx.stroke();
  ctx.restore();
  ctx.font = '900 20px Orbitron, sans-serif';
  ctx.fillStyle = '#ffd166'; ctx.shadowColor = '#ffb800'; ctx.shadowBlur = 10;
  ctx.fillText(`${game.coins}`, 50, 98);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 12px Orbitron, sans-serif';
  ctx.fillStyle = T().sub;
  ctx.fillText('COINS', 50, 122);

  // lives
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(W - 34 - i * 30, 34);
    ctx.scale(0.72, 0.72);
    ctx.fillStyle = i < game.lives ? T().life : T().lifeOff;
    ctx.shadowColor = T().hudGlow; ctx.shadowBlur = i < game.lives ? 14 : 0;
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(10, 2); ctx.lineTo(17, 13); ctx.lineTo(0, 9); ctx.lineTo(-17, 13); ctx.lineTo(-10, 2);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.shadowBlur = 0;

  // wave + combo
  ctx.textAlign = 'right';
  ctx.font = 'bold 14px Orbitron, sans-serif';
  ctx.fillStyle = T().wave;
  ctx.fillText(`WAVE ${game.wave}`, W - 22, 58);
  if (game.combo > 1) {
    ctx.fillStyle = '#ffd166';
    ctx.font = '900 18px Orbitron, sans-serif';
    ctx.fillText(`x${game.combo.toFixed(2)}`, W - 22, 80);
  }

  // boss health bar
  if (game.boss) {
    const b = game.boss;
    const bw = Math.min(620, W * 0.5), bx = (W - bw) / 2, by = 24;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.font = '900 15px Orbitron, sans-serif';
    ctx.fillStyle = '#ff4d9d'; ctx.shadowColor = '#ff4d9d'; ctx.shadowBlur = 16;
    ctx.fillText('SPACE CAT QUEEN', W / 2, by - 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(20,10,40,0.7)';
    ctx.beginPath(); ctx.roundRect(bx, by + 22, bw, 14, 7); ctx.fill();
    const ratio = Math.max(0, b.hp / b.maxhp);
    const grd = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grd.addColorStop(0, '#ff4d9d'); grd.addColorStop(1, '#ffd166');
    ctx.fillStyle = grd; ctx.shadowColor = '#ff4d9d'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.roundRect(bx, by + 22, Math.max(6, bw * ratio), 14, 7); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // controls bar
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px Orbitron, sans-serif';
  ctx.fillStyle = T().control;
  ctx.fillText('WASD / ARROWS  MOVE      SPACE  FIRE      P  PAUSE      R  RESTART      L  DAY / NIGHT', W / 2, H - 26);
  // theme chip
  ctx.textAlign = 'right'; ctx.font = 'bold 12px Orbitron, sans-serif';
  const label = themeName === 'dark' ? '☾ NIGHT' : '☀ DAY';
  const cw = ctx.measureText(label).width + 26;
  ctx.fillStyle = themeName === 'dark' ? 'rgba(125,249,255,0.12)' : 'rgba(255,95,162,0.16)';
  ctx.beginPath(); ctx.roundRect(W - 22 - cw, H - 56, cw, 26, 8); ctx.fill();
  ctx.fillStyle = themeName === 'dark' ? '#7df9ff' : '#ff4d9d';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, W - 35, H - 43);
  ctx.textBaseline = 'top';
  ctx.restore();
}

function overlay(title, sub, extra) {
  ctx.fillStyle = T().overlay;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '900 62px Orbitron, sans-serif';
  ctx.shadowColor = '#ff4d9d'; ctx.shadowBlur = 34;
  ctx.fillStyle = T().overlayText;
  ctx.fillText(title, W / 2, H * 0.42);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 18px Orbitron, sans-serif';
  ctx.fillStyle = T().sub;
  if (extra) ctx.fillText(extra, W / 2, H * 0.52);
  ctx.fillStyle = T().hudGlow === '#ffffff' ? '#ff4d9d' : '#7df9ff';
  const pulse = 0.65 + 0.35 * Math.sin(performance.now() / 260);
  ctx.globalAlpha = pulse;
  ctx.fillText(sub, W / 2, H * 0.6);
  ctx.globalAlpha = 1;
}

// ---------- Loop ----------
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

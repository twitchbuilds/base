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

// ---------- Input ----------
const keys = {};
window.addEventListener('keydown', e => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  keys[e.key.toLowerCase()] = true;
  audio();
  if (e.key === ' ' && game.state === 'playing') fire();
  if (e.key.toLowerCase() === 'r') reset();
  if (e.key.toLowerCase() === 'p' && game.state === 'playing') game.paused = !game.paused;
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// ---------- Game state ----------
const game = {
  state: 'playing', score: 0, best: +(localStorage.getItem('voidrunner_best') || 0),
  lives: 3, wave: 1, shake: 0, time: 0, paused: false,
  spawnTimer: 0, spawnRate: 0.9, combo: 1, comboTimer: 0,
  flash: 0, banner: '', bannerTimer: 0
};

const player = { x: 0, y: 0, vx: 0, vy: 0, r: 15, cool: 0, invuln: 0, thrust: 0, angle: 0 };
let bullets = [], ebullets = [], enemies = [], particles = [], stars = [], powerups = [], floaties = [];

function initStars() {
  stars = [];
  for (let i = 0; i < 220; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * 2 + 0.3, s: Math.random() * 1.8 + 0.4 });
  }
}
initStars();

function reset() {
  game.state = 'playing'; game.score = 0; game.lives = 3; game.wave = 1;
  game.shake = 0; game.spawnTimer = 0.6; game.spawnRate = 0.9; game.combo = 1; game.comboTimer = 0;
  game.paused = false; game.banner = 'WAVE 1'; game.bannerTimer = 1.6;
  bullets = []; ebullets = []; enemies = []; particles = []; powerups = []; floaties = [];
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
  scout: { hp: 1, r: 15, speed: 150, color: '#ff4d9d', score: 10 },
  zig:   { hp: 2, r: 17, speed: 120, color: '#ffb347', score: 20 },
  tank:  { hp: 4, r: 26, speed: 70,  color: '#b566ff', score: 40 },
  rock:  { hp: 3, r: 24, speed: 90,  color: '#8899bb', score: 25 }
};
function spawnEnemy() {
  const roll = Math.random();
  let type = 'scout';
  if (game.wave >= 2 && roll > 0.55) type = 'zig';
  if (game.wave >= 3 && roll > 0.82) type = 'tank';
  if (game.wave >= 2 && roll > 0.44 && roll < 0.55) type = 'rock';
  const t = ENEMY_TYPES[type];
  const x = rand(40, W - 40);
  enemies.push({
    type, x, y: -40, hp: t.hp + Math.floor(game.wave / 4), maxhp: t.hp + Math.floor(game.wave / 4),
    r: t.r, speed: t.speed + game.wave * 6, color: t.color, score: t.score,
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
    burst(e.x, e.y, e.color, 26, 300, 0.8);
    game.shake = Math.min(14, game.shake + 5);
    noiseBurst(0.35, 0.1);
    game.combo = Math.min(5, game.combo + 0.25); game.comboTimer = 2.5;
    if (Math.random() < 0.09 + (e.type === 'tank' ? 0.15 : 0)) {
      powerups.push({ x: e.x, y: e.y, vy: 70, r: 12, kind: Math.random() < 0.5 ? 'rapid' : 'shield', t: 0 });
    }
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
  const acc = 2400, drag = Math.pow(0.0008, dt);
  let ix = (keys['arrowright'] || keys['d'] ? 1 : 0) - (keys['arrowleft'] || keys['a'] ? 1 : 0);
  let iy = (keys['arrowdown'] || keys['s'] ? 1 : 0) - (keys['arrowup'] || keys['w'] ? 1 : 0);
  player.vx += ix * acc * dt; player.vy += iy * acc * dt;
  player.vx *= drag; player.vy *= drag;
  const maxv = 560;
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
  if (game.spawnTimer <= 0) {
    spawnEnemy();
    game.spawnTimer = Math.max(0.22, game.spawnRate - game.wave * 0.05) * rand(0.7, 1.3);
  }
  const newWave = 1 + Math.floor(game.score / 500);
  if (newWave > game.wave) {
    game.wave = newWave;
    game.banner = 'WAVE ' + game.wave; game.bannerTimer = 1.8;
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
        for (let k = -1; k <= 1; k++) ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a + k * 0.22) * 260, vy: Math.sin(a + k * 0.22) * 260, r: 5, life: 4, color: '#c98bff' });
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

  // enemy bullets hit player
  for (const b of ebullets) {
    if (player.invuln > 0) continue;
    if (Math.hypot(player.x - b.x, player.y - b.y) < player.r + b.r) {
      b.dead = true; hurtPlayer();
    }
  }

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
  grd.addColorStop(0, '#9df6ff'); grd.addColorStop(0.5, '#2ea8ff'); grd.addColorStop(1, 'rgba(255,140,0,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.moveTo(-6, 10); ctx.lineTo(0, 10 + fl); ctx.lineTo(6, 10); ctx.closePath(); ctx.fill();

  // hull
  ctx.shadowColor = '#39d0ff'; ctx.shadowBlur = 18;
  ctx.fillStyle = '#dbeaff';
  ctx.beginPath();
  ctx.moveTo(0, -20); ctx.lineTo(9, 2); ctx.lineTo(18, 12); ctx.lineTo(6, 9);
  ctx.lineTo(0, 14); ctx.lineTo(-6, 9); ctx.lineTo(-18, 12); ctx.lineTo(-9, 2);
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#1f8fff';
  ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(5, 1); ctx.lineTo(0, 7); ctx.lineTo(-5, 1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff9a3d';
  ctx.beginPath(); ctx.arc(0, -6, 3, 0, 7); ctx.fill();
  ctx.restore();
}

function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y); ctx.rotate(e.rot * (e.type === 'rock' ? 1 : 0.15));
  ctx.shadowColor = e.color; ctx.shadowBlur = 16;
  ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : e.color;
  if (e.type === 'rock') {
    ctx.beginPath();
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, rr = e.r * (0.75 + 0.3 * Math.sin(i * 2.7 + 1));
      i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.arc(-e.r * 0.25, -e.r * 0.2, e.r * 0.3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(e.r * 0.3, e.r * 0.25, e.r * 0.18, 0, 7); ctx.fill();
  } else if (e.type === 'tank') {
    ctx.beginPath();
    ctx.moveTo(0, e.r); ctx.lineTo(e.r, e.r * 0.2); ctx.lineTo(e.r * 0.6, -e.r);
    ctx.lineTo(-e.r * 0.6, -e.r); ctx.lineTo(-e.r, e.r * 0.2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b0f45';
    ctx.beginPath(); ctx.arc(0, 0, e.r * 0.38, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath(); ctx.arc(0, 0, e.r * 0.18, 0, 7); ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, e.r); ctx.lineTo(e.r, -e.r * 0.5); ctx.lineTo(e.r * 0.35, -e.r * 0.15);
    ctx.lineTo(0, -e.r); ctx.lineTo(-e.r * 0.35, -e.r * 0.15); ctx.lineTo(-e.r, -e.r * 0.5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.arc(0, e.r * 0.25, e.r * 0.2, 0, 7); ctx.fill();
  }
  ctx.restore();
  // hp bar for tanks
  if (e.maxhp > 2 && e.hp < e.maxhp) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(e.x - 22, e.y - e.r - 12, 44, 4);
    ctx.fillStyle = '#7dffb0';
    ctx.fillRect(e.x - 22, e.y - e.r - 12, 44 * (e.hp / e.maxhp), 4);
  }
}

function render() {
  // background
  const bg = ctx.createRadialGradient(W / 2, H * 0.6, 0, W / 2, H * 0.6, Math.max(W, H) * 0.8);
  bg.addColorStop(0, '#120a2e'); bg.addColorStop(0.5, '#08051a'); bg.addColorStop(1, '#02010a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  ctx.save();
  if (game.shake > 0.3) ctx.translate(rand(-game.shake, game.shake), rand(-game.shake, game.shake));

  // stars
  for (const s of stars) {
    ctx.globalAlpha = 0.25 + s.z * 0.3;
    ctx.fillStyle = s.z > 1.6 ? '#bfe8ff' : '#7d8fbf';
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
    ctx.shadowColor = '#7df9ff'; ctx.shadowBlur = 18;
    ctx.fillStyle = '#eaffff';
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
    ctx.shadowColor = '#7df9ff'; ctx.shadowBlur = 30;
    ctx.fillStyle = '#eaffff';
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
  ctx.fillStyle = '#eaffff';
  ctx.shadowColor = '#39d0ff'; ctx.shadowBlur = 16;
  ctx.fillText(String(game.score).padStart(6, '0'), 22, 18);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 12px Orbitron, sans-serif';
  ctx.fillStyle = '#6f87b8';
  ctx.fillText('SCORE', 24, 54);
  ctx.fillText(`BEST ${game.best}`, 24, 74);

  // lives
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(W - 34 - i * 30, 34);
    ctx.scale(0.72, 0.72);
    ctx.fillStyle = i < game.lives ? '#7df9ff' : 'rgba(120,150,200,0.22)';
    ctx.shadowColor = '#39d0ff'; ctx.shadowBlur = i < game.lives ? 14 : 0;
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(10, 2); ctx.lineTo(17, 13); ctx.lineTo(0, 9); ctx.lineTo(-17, 13); ctx.lineTo(-10, 2);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.shadowBlur = 0;

  // wave + combo
  ctx.textAlign = 'right';
  ctx.font = 'bold 14px Orbitron, sans-serif';
  ctx.fillStyle = '#8fa6d6';
  ctx.fillText(`WAVE ${game.wave}`, W - 22, 58);
  if (game.combo > 1) {
    ctx.fillStyle = '#ffd166';
    ctx.font = '900 18px Orbitron, sans-serif';
    ctx.fillText(`x${game.combo.toFixed(2)}`, W - 22, 80);
  }

  // controls bar
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px Orbitron, sans-serif';
  ctx.fillStyle = 'rgba(160,185,230,0.75)';
  ctx.fillText('WASD / ARROWS  MOVE      SPACE  FIRE      P  PAUSE      R  RESTART', W / 2, H - 26);
  ctx.restore();
}

function overlay(title, sub, extra) {
  ctx.fillStyle = 'rgba(3,2,10,0.65)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '900 62px Orbitron, sans-serif';
  ctx.shadowColor = '#ff4d9d'; ctx.shadowBlur = 34;
  ctx.fillStyle = '#f4eaff';
  ctx.fillText(title, W / 2, H * 0.42);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 18px Orbitron, sans-serif';
  ctx.fillStyle = '#9fb4e0';
  if (extra) ctx.fillText(extra, W / 2, H * 0.52);
  ctx.fillStyle = '#7df9ff';
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

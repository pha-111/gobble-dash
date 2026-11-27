// Gobble Dash — drawing: the turkey, the farmer, the farm and the kitchen.
// One job: everything the player sees, painted on canvas 2D with plain shapes
// in one coherent autumn palette. No images, no fonts from the network.

import { VIEW_W, VIEW_H, WALL, PALETTE } from './config.js';

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function roundRect(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

// ---------- floors ----------

export function drawFloor(ctx, world, time) {
  const floor = world.stage.floor;
  if (floor === 'farmyard') {
    // Patchwork grass.
    const size = 60;
    for (let y = 0; y < VIEW_H; y += size) {
      for (let x = 0; x < VIEW_W; x += size) {
        rect(ctx, x, y, size, size, (x / size + y / size) % 2 === 0 ? PALETTE.grassLight : PALETTE.grassDark);
      }
    }
    // A worn dirt path from the spawn to the gate.
    ctx.strokeStyle = PALETTE.dirt;
    ctx.lineWidth = 46;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(90, 510);
    ctx.lineTo(300, 420);
    ctx.lineTo(560, 330);
    ctx.lineTo(830, 180);
    ctx.lineTo(870, 60);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.dirtDark;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 14]);
    ctx.beginPath();
    ctx.moveTo(90, 510);
    ctx.lineTo(300, 420);
    ctx.lineTo(560, 330);
    ctx.lineTo(830, 180);
    ctx.lineTo(870, 60);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (floor === 'barn') {
    // Wooden plank floor.
    rect(ctx, 0, 0, VIEW_W, VIEW_H, '#a9804f');
    for (let y = WALL; y < VIEW_H - WALL; y += 42) {
      rect(ctx, 0, y, VIEW_W, 3, '#8a6136');
    }
    for (let x = WALL; x < VIEW_W - WALL; x += 130) {
      rect(ctx, x, 0, 3, VIEW_H, '#8a6136');
    }
    // A straw carpet down the middle.
    ctx.fillStyle = 'rgba(227,194,90,0.35)';
    ctx.fillRect(120, 240, 720, 110);
  } else {
    // Kitchen checkerboard tiles.
    const size = 48;
    for (let y = 0; y < VIEW_H; y += size) {
      for (let x = 0; x < VIEW_W; x += size) {
        rect(ctx, x, y, size, size, (x / size + y / size) % 2 === 0 ? PALETTE.tileLight : PALETTE.tileDark);
      }
    }
    // A worn rug by the back door.
    roundRect(ctx, 30, 480, 150, 80, 10, '#b8543f');
    roundRect(ctx, 42, 492, 126, 56, 8, '#d97b54');
  }

  // The border wall / fence around every stage.
  ctx.strokeStyle = floor === 'kitchen' ? PALETTE.woodDark : '#5d3f22';
  ctx.lineWidth = WALL;
  ctx.strokeRect(WALL / 2, WALL / 2, VIEW_W - WALL, VIEW_H - WALL);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(WALL, WALL, VIEW_W - WALL * 2, VIEW_H - WALL * 2);
}

// ---------- obstacles and decoration ----------

function drawBarn(ctx, s) {
  rect(ctx, s.x, s.y, s.w, s.h, PALETTE.barnRed);
  rect(ctx, s.x, s.y, s.w, 18, PALETTE.barnDark);
  // Plank lines and a big door.
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  for (let x = s.x + 26; x < s.x + s.w; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, s.y + 18);
    ctx.lineTo(x, s.y + s.h);
    ctx.stroke();
  }
  rect(ctx, s.x + s.w / 2 - 34, s.y + s.h - 78, 68, 78, PALETTE.barnDark);
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(s.x + s.w / 2 - 34, s.y + s.h - 78);
  ctx.lineTo(s.x + s.w / 2 + 34, s.y + s.h);
  ctx.moveTo(s.x + s.w / 2 + 34, s.y + s.h - 78);
  ctx.lineTo(s.x + s.w / 2 - 34, s.y + s.h);
  ctx.stroke();
  // A little hayloft window.
  circle(ctx, s.x + s.w / 2, s.y + 44, 14, PALETTE.cream);
  circle(ctx, s.x + s.w / 2, s.y + 44, 10, '#3a2a1a');
}

function drawFence(ctx, s) {
  rect(ctx, s.x, s.y, s.w, s.h, PALETTE.wood);
  ctx.fillStyle = PALETTE.woodDark;
  if (s.w > s.h) {
    for (let x = s.x; x < s.x + s.w; x += 22) ctx.fillRect(x, s.y - 3, 5, s.h + 6);
  } else {
    for (let y = s.y; y < s.y + s.h; y += 22) ctx.fillRect(s.x - 3, y, s.w + 6, 5);
  }
}

function drawCrate(ctx, s) {
  rect(ctx, s.x, s.y, s.w, s.h, '#b5854a');
  ctx.strokeStyle = '#7e5a2e';
  ctx.lineWidth = 3;
  ctx.strokeRect(s.x + 3, s.y + 3, s.w - 6, s.h - 6);
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(s.x + s.w, s.y + s.h);
  ctx.moveTo(s.x + s.w, s.y);
  ctx.lineTo(s.x, s.y + s.h);
  ctx.stroke();
}

export function drawObstacle(ctx, s, time) {
  switch (s.kind) {
    case 'barn': drawBarn(ctx, s); break;
    case 'fence': drawFence(ctx, s); break;
    case 'trough':
      roundRect(ctx, s.x, s.y, s.w, s.h, 12, PALETTE.wood);
      roundRect(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 16, 8, '#7fb2d9');
      break;
    case 'crate': drawCrate(ctx, s); break;
    case 'sack':
      roundRect(ctx, s.x, s.y, s.w, s.h, 16, '#cbb27f');
      ctx.strokeStyle = '#a68d5e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x + 10, s.y + s.h / 2);
      ctx.lineTo(s.x + s.w - 10, s.y + s.h / 2);
      ctx.stroke();
      break;
    case 'counter':
      roundRect(ctx, s.x, s.y, s.w, s.h, 8, '#8f7d6b');
      roundRect(ctx, s.x + 4, s.y + 4, s.w - 8, s.h - 8, 6, '#b7a58e');
      // A few plates and a pumpkin pie on the counter.
      circle(ctx, s.x + s.w * 0.3, s.y + s.h / 2, 10, PALETTE.cream);
      circle(ctx, s.x + s.w * 0.7, s.y + s.h / 2, 12, PALETTE.pumpkin);
      break;
    case 'table':
      roundRect(ctx, s.x, s.y, s.w, s.h, 10, PALETTE.wood);
      roundRect(ctx, s.x + 10, s.y + 10, s.w - 20, s.h - 20, 6, '#f2e3c2');
      // The Thanksgiving table is set: plates, a roast dish, candles.
      circle(ctx, s.x + 40, s.y + s.h / 2, 13, PALETTE.cream);
      circle(ctx, s.x + s.w - 40, s.y + s.h / 2, 13, PALETTE.cream);
      ellipse(ctx, s.x + s.w / 2, s.y + s.h / 2, 30, 18, PALETTE.barnRed);
      ellipse(ctx, s.x + s.w / 2, s.y + s.h / 2 - 4, 20, 10, '#c98a4b');
      break;
    default:
      rect(ctx, s.x, s.y, s.w, s.h, PALETTE.wood);
  }
}

export function drawHide(ctx, h, time) {
  const sway = Math.sin(time * 1.4 + h.x) * 2;
  if (h.kind === 'hay') {
    ellipse(ctx, h.x, h.y + 6, h.r, h.r * 0.62, 'rgba(0,0,0,0.18)');
    ellipse(ctx, h.x, h.y, h.r, h.r * 0.85, PALETTE.hay);
    ctx.strokeStyle = PALETTE.hayDark;
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(h.x + i * 12, h.y - h.r * 0.7);
      ctx.quadraticCurveTo(h.x + i * 12 + sway, h.y, h.x + i * 12, h.y + h.r * 0.6);
      ctx.stroke();
    }
    circle(ctx, h.x - h.r * 0.35, h.y - h.r * 0.35, 6, PALETTE.hayDark);
  } else if (h.kind === 'bush' || h.kind === 'plant') {
    const leaf = h.kind === 'bush' ? PALETTE.leaf : '#3f7d4e';
    circle(ctx, h.x - 14, h.y + 4, h.r * 0.55, leaf);
    circle(ctx, h.x + 14, h.y + 4, h.r * 0.55, leaf);
    circle(ctx, h.x, h.y - 12, h.r * 0.6, '#5d9c40');
    circle(ctx, h.x - 8, h.y - 20, 7, '#7cc24f');
    circle(ctx, h.x + 12, h.y - 16, 6, '#e8862e');
  }
}

export function drawDecor(ctx, d, time) {
  if (d.kind === 'pumpkin') {
    const s = d.s;
    ellipse(ctx, d.x, d.y, 16 * s, 12 * s, PALETTE.pumpkin);
    ellipse(ctx, d.x, d.y, 8 * s, 12 * s, '#d96a1a');
    rect(ctx, d.x - 2, d.y - 16 * s, 4, 6, '#4e7d32');
  } else if (d.kind === 'flower') {
    circle(ctx, d.x, d.y, 3, PALETTE.cream);
    circle(ctx, d.x - 5, d.y, 3, PALETTE.orange);
    circle(ctx, d.x + 5, d.y, 3, PALETTE.orange);
  } else if (d.kind === 'straw') {
    ctx.strokeStyle = 'rgba(227,194,90,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(d.x - 8 * d.s, d.y);
    ctx.lineTo(d.x + 8 * d.s, d.y - 3);
    ctx.stroke();
  } else if (d.kind === 'crumb') {
    circle(ctx, d.x, d.y, 2.5, '#a68d5e');
  }
}

// ---------- the exit, the oven, the knife ----------

export function drawExit(ctx, world, time) {
  const e = world.exit;
  const pulse = 0.5 + Math.sin(time * 3) * 0.2;
  ctx.save();
  ctx.globalAlpha = 0.25 + pulse * 0.25;
  ctx.fillStyle = '#ffe27a';
  ctx.fillRect(e.x - 8, e.y - 8, e.w + 16, e.h + 16);
  ctx.restore();
  if (world.stage.floor === 'kitchen') {
    // The back door, slightly open, with moonlight beyond.
    rect(ctx, e.x, e.y, e.w, e.h, '#2c4a6b');
    rect(ctx, e.x + 6, e.y + 4, e.w - 12, e.h - 8, '#7fae4e');
    circle(ctx, e.x + e.w - 14, e.y + e.h / 2, 3, PALETTE.cream);
  } else {
    // The wooden farm gate.
    rect(ctx, e.x, e.y, e.w, e.h, PALETTE.wood);
    ctx.fillStyle = PALETTE.woodDark;
    for (let x = e.x + 8; x < e.x + e.w; x += 18) ctx.fillRect(x, e.y, 4, e.h);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FREEDOM →', e.x + e.w / 2, e.y + e.h + 18);
  }
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  // Below the gate when it sits near the top, above it when near the bottom,
  // so the label never hides behind a HUD bar.
  const labelY = e.y < 200 ? e.y + e.h + 34 : e.y - 6;
  ctx.fillText('ESCAPE', e.x + e.w / 2, labelY);
}

export function drawOven(ctx, oven, time) {
  // The oven body.
  roundRect(ctx, oven.x, oven.y, oven.w, oven.h, 6, '#5a5a60');
  roundRect(ctx, oven.x + 8, oven.y + 8, oven.w - 16, oven.h - 16, 4, '#2e2e33');
  const open = Math.sin(time * 0.9) > -0.2;
  const glow = open ? 0.75 + Math.sin(time * 6) * 0.2 : 0.12;
  ctx.fillStyle = `rgba(255,122,26,${glow})`;
  ctx.fillRect(oven.x + 12, oven.y + 12, oven.w - 24, oven.h - 24);
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'HOT!' : 'OVEN', oven.x + oven.w / 2, oven.y + oven.h / 2 + 4);
  // The scorching zone in front of the oven.
  const z = oven.zone;
  ctx.save();
  ctx.globalAlpha = open ? 0.3 + Math.sin(time * 6) * 0.12 : 0.08;
  ctx.fillStyle = PALETTE.ovenHot;
  ctx.fillRect(z.x, z.y, z.w, z.h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(214,58,42,0.7)';
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  ctx.strokeRect(z.x, z.y, z.w, z.h);
  ctx.setLineDash([]);
  if (open) {
    ctx.fillStyle = PALETTE.danger;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('! HOT !', z.x + z.w / 2, z.y + z.h + 14);
  }
}

export function drawKnifeLane(ctx, lane, time) {
  // The lane the carving knife sweeps along, with a warning glint.
  ctx.strokeStyle = 'rgba(90,90,100,0.5)';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(lane.x0, lane.y);
  ctx.lineTo(lane.x1, lane.y);
  ctx.stroke();
  ctx.setLineDash([]);
  if (lane.phase === 'warn') {
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(time * 20) * 0.3;
    ctx.strokeStyle = '#ff4d2e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lane.x0, lane.y);
    ctx.lineTo(lane.x1, lane.y);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = PALETTE.danger;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ THE KNIFE IS COMING ⚠', (lane.x0 + lane.x1) / 2, lane.y - 18);
  }
  if (lane.phase === 'sweep' || lane.phase === 'warn') {
    drawKnife(ctx, lane.x, lane.y, lane.dir);
  }
}

export function drawKnife(ctx, x, y, dir) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dir > 0 ? 0 : Math.PI);
  // Blade.
  ctx.fillStyle = '#dfe6ea';
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(34, -3);
  ctx.lineTo(42, 0);
  ctx.lineTo(34, 3);
  ctx.lineTo(0, 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a97a0';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Handle.
  roundRect(ctx, -22, -6, 24, 12, 5, '#3a2a1a');
  ctx.restore();
}

// ---------- corn ----------

export function drawCorn(ctx, corn, time) {
  if (corn.taken) return;
  const bob = Math.sin(time * 2 + corn.bob) * 3;
  const y = corn.y + bob;
  if (corn.golden) {
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(time * 4 + corn.bob) * 0.15;
    circle(ctx, corn.x, y, 16, '#ffe27a');
    ctx.restore();
  }
  ctx.save();
  ctx.translate(corn.x, y);
  ctx.rotate(-0.3);
  ellipse(ctx, 0, 0, 7, 12, corn.golden ? '#ffd94a' : PALETTE.corn);
  ctx.strokeStyle = '#c9a83c';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 4, -10);
    ctx.lineTo(i * 4, 10);
    ctx.stroke();
  }
  // Green husk leaves.
  ctx.fillStyle = '#5d9c40';
  ctx.beginPath();
  ctx.moveTo(-6, 8);
  ctx.lineTo(-12, 16);
  ctx.lineTo(-2, 12);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6, 8);
  ctx.lineTo(12, 16);
  ctx.lineTo(2, 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------- the turkey ----------

export function drawTurkey(ctx, turkey, time) {
  const { x, y } = turkey;
  const hopLift = turkey.hopTimer > 0 ? -14 * Math.sin((turkey.hopTimer / 0.22) * Math.PI) : 0;
  const waddle = turkey.moving ? Math.sin(time * 14) * 2 : 0;
  const blink = Math.sin(time * 5) > 0 ? 0 : 1;

  ctx.save();
  ctx.translate(x, y + hopLift);
  if (turkey.invuln > 0 && Math.floor(time * 10) % 2 === 0) ctx.globalAlpha = 0.45;

  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 14 - hopLift, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail fan, fanned behind the direction of travel.
  const back = turkey.dir + Math.PI;
  ctx.save();
  ctx.rotate(back);
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.rotate(i * 0.38);
    ellipse(ctx, -20, 0, 15, 5.5, i % 2 === 0 ? '#a3652f' : '#7e4a22');
    circle(ctx, -32, 0, 4.5, '#5d9c40');
    ctx.restore();
  }
  ctx.restore();

  // Body.
  ellipse(ctx, 0, 0, 16, 14, PALETTE.turkeyBrown);
  ellipse(ctx, -3, 3, 11, 9, '#a06a35');
  // Wing.
  ctx.save();
  ctx.rotate(turkey.dir);
  ellipse(ctx, 2, 6, 9, 5, PALETTE.turkeyDark);
  ctx.restore();

  // Head, toward the direction of travel.
  const hx = Math.cos(turkey.dir) * 14;
  const hy = Math.sin(turkey.dir) * 14;
  circle(ctx, hx, hy - 2, 8.5, '#c98a4b');
  // Beak.
  ctx.save();
  ctx.translate(hx, hy - 2);
  ctx.rotate(turkey.dir);
  ctx.fillStyle = PALETTE.orange;
  ctx.beginPath();
  ctx.moveTo(6, -3);
  ctx.lineTo(14, 0);
  ctx.lineTo(6, 3);
  ctx.closePath();
  ctx.fill();
  // Red wattle.
  ellipse(ctx, 4, 6, 3, 5, '#d63a2a');
  ctx.restore();
  // Eye.
  if (!blink) circle(ctx, hx + Math.cos(turkey.dir - 0.6) * 4, hy - 2 + Math.sin(turkey.dir - 0.6) * 4, 1.8, '#1c1410');
  else {
    ctx.strokeStyle = '#1c1410';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hx - 4, hy - 6);
    ctx.lineTo(hx, hy - 6);
    ctx.stroke();
  }

  // Little legs, scrambling when moving.
  ctx.strokeStyle = '#e8862e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-4, 12);
  ctx.lineTo(-4 + waddle, 17);
  ctx.moveTo(5, 12);
  ctx.lineTo(5 - waddle, 17);
  ctx.stroke();

  ctx.restore();
}

// ---------- the farmer and the dog ----------

export function drawVisionCone(ctx, hunter) {
  const range = hunter.vision;
  const half = hunter.visionAngle;
  ctx.save();
  ctx.globalAlpha = hunter.state === 'chase' ? 0.3 : 0.16;
  ctx.fillStyle = hunter.state === 'chase' ? '#ff4d2e' : '#ffd94a';
  ctx.beginPath();
  ctx.moveTo(hunter.x, hunter.y);
  ctx.arc(hunter.x, hunter.y, range, hunter.dir - half, hunter.dir + half);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // The detection meter: a ring filling as the farmer clocks the turkey.
  if (hunter.detection > 0 && hunter.state === 'patrol') {
    ctx.save();
    ctx.strokeStyle = '#ff4d2e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(hunter.x, hunter.y - 30, 10, -Math.PI / 2, -Math.PI / 2 + hunter.detection * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export function drawFarmer(ctx, farmer, time) {
  const { x, y } = farmer;
  const walking = farmer.state !== 'search' ? Math.sin(time * 10) * 2 : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 15, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs in denim overalls.
  ctx.strokeStyle = '#3a5a8c';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-5, 6);
  ctx.lineTo(-5 + walking, 16);
  ctx.moveTo(5, 6);
  ctx.lineTo(5 - walking, 16);
  ctx.stroke();
  // Overalls body.
  roundRect(ctx, -13, -8, 26, 18, 6, '#3a5a8c');
  rect(ctx, -13, -8, 26, 6, '#2c4a75');
  // Red plaid shirt arms.
  ctx.strokeStyle = '#b8322a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-12, -4);
  ctx.lineTo(-18, 6);
  ctx.moveTo(12, -4);
  ctx.lineTo(18, 6);
  ctx.stroke();
  // Head and straw hat.
  circle(ctx, 0, -14, 10, '#e8b98a');
  ellipse(ctx, 0, -20, 16, 4.5, '#e3c25a');
  ellipse(ctx, 0, -22, 9, 6, '#e3c25a');
  // Moustache and angry brows when chasing.
  ctx.strokeStyle = '#6b4423';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-5, -11);
  ctx.lineTo(5, -11);
  ctx.stroke();
  if (farmer.state === 'chase') {
    ctx.strokeStyle = '#1c1410';
    ctx.beginPath();
    ctx.moveTo(-6, -18);
    ctx.lineTo(-1, -16);
    ctx.moveTo(6, -18);
    ctx.lineTo(1, -16);
    ctx.stroke();
  }
  // Eyes.
  circle(ctx, -3.5, -15, 1.4, '#1c1410');
  circle(ctx, 3.5, -15, 1.4, '#1c1410');

  // The pitchfork, held over the shoulder.
  ctx.save();
  ctx.rotate(-0.5);
  ctx.strokeStyle = '#8a5a33';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(14, 10);
  ctx.lineTo(24, -26);
  ctx.stroke();
  ctx.strokeStyle = '#c8ccd0';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(24 + i * 4, -26);
    ctx.lineTo(24 + i * 5, -34);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();

  // Alert / question mark above the head.
  if (farmer.state === 'chase') {
    drawBubble(ctx, x, y - 44, '!', '#d63a2a');
  } else if (farmer.state === 'search') {
    drawBubble(ctx, x, y - 44, '?', '#e8862e');
  }
}

function drawBubble(ctx, x, y, text, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  ctx.textBaseline = 'alphabetic';
}

export function drawDog(ctx, dog, time) {
  const { x, y } = dog;
  const run = Math.sin(time * 16) * 3;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dog.dir);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body, head, ears, tail.
  ellipse(ctx, 0, 0, 15, 9, '#7a4a2b');
  circle(ctx, 14, 0, 7, '#8a5a33');
  ellipse(ctx, 10, -6, 4, 6, '#5d3a20');
  ellipse(ctx, 13, -6, 4, 6, '#5d3a20');
  ctx.strokeStyle = '#7a4a2b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.quadraticCurveTo(-20, -6 - run, -22, -10);
  ctx.stroke();
  // Legs.
  ctx.strokeStyle = '#5d3a20';
  ctx.lineWidth = 3;
  for (const [lx, ly] of [[-8, 7], [-2, 8], [4, 8], [9, 7]]) {
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + (lx % 2 === 0 ? run : -run), ly + 6);
    ctx.stroke();
  }
  ctx.restore();
  if (dog.state === 'chase') drawBubble(ctx, x, y - 34, '!', '#d63a2a');
  else if (dog.state === 'search') drawBubble(ctx, x, y - 34, '?', '#e8862e');
}

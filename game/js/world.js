// Gobble Dash — the stage world: floors, walls, hiding spots, corn and hazards.
// One job: build one stage from its config and a seed, and answer the
// physics questions the turkey and the farmer ask (can I stand here? can I see?).

import { VIEW_W, VIEW_H, WALL, STAGES } from './config.js';
import { makeRng, range } from './rng.js';

export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  return (cx - nx) * (cx - nx) + (cy - ny) * (cy - ny) < r * r;
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// Is the straight line from (x1,y1) to (x2,y2) blocked by any solid obstacle?
// Sampled in small steps — cheap and plenty accurate for a sight cone.
export function lineBlocked(x1, y1, x2, y2, solids) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    for (const s of solids) {
      if (pointInRect(x, y, s)) return true;
    }
  }
  return false;
}

function scatterCorn(rng, count, goldenCount, solids, hides, keepOut) {
  const corns = [];
  let guard = 0;
  while (corns.length < count + goldenCount && guard < 600) {
    guard += 1;
    const x = range(rng, WALL + 40, VIEW_W - WALL - 40);
    const y = range(rng, WALL + 40, VIEW_H - WALL - 40);
    let bad = false;
    for (const s of solids) {
      if (circleHitsRect(x, y, 26, s)) {
        bad = true;
        break;
      }
    }
    if (bad) continue;
    for (const k of keepOut) {
      if (Math.hypot(x - k.x, y - k.y) < k.r) {
        bad = true;
        break;
      }
    }
    if (bad) continue;
    for (const c of corns) {
      if (Math.hypot(x - c.x, y - c.y) < 46) {
        bad = true;
        break;
      }
    }
    if (bad) continue;
    corns.push({ x, y, golden: corns.length >= count, taken: false, bob: rng() * Math.PI * 2 });
  }
  return corns;
}

// A haystack or a bush: a circle the turkey can hide inside.
function scatterHides(rng, spots, solids) {
  const hides = [];
  for (const spot of spots) {
    hides.push({ x: spot.x, y: spot.y, r: spot.r, kind: spot.kind });
  }
  return hides;
}

export function buildWorld(stageIndex, seed) {
  const stage = STAGES[stageIndex];
  const rng = makeRng(seed + stageIndex * 7919);
  const solids = [];
  const decor = [];
  let hides = [];
  let spawn = { x: 90, y: VIEW_H - 90 };
  let exit = { x: VIEW_W - 130, y: 44, w: 100, h: 30 };
  let farmerSpawns = [];
  let dogSpawn = null;
  let knifeLane = null;
  let oven = null;

  if (stage.floor === 'farmyard') {
    // The big red barn, top-left; the turkey starts bottom-left by the fence.
    solids.push({ x: 60, y: 60, w: 210, h: 130, kind: 'barn' });
    // Fence runs that break up the yard and block sight lines.
    solids.push({ x: 340, y: 120, w: 18, h: 170, kind: 'fence' });
    solids.push({ x: 560, y: 300, w: 18, h: 170, kind: 'fence' });
    solids.push({ x: 120, y: 380, w: 190, h: 18, kind: 'fence' });
    solids.push({ x: 620, y: 110, w: 170, h: 18, kind: 'fence' });
    // A trough the farmer walks around.
    solids.push({ x: 700, y: 420, w: 110, h: 46, kind: 'trough' });
    hides = scatterHides(rng, [
      { x: 430, y: 470, r: 42, kind: 'hay' },
      { x: 800, y: 200, r: 42, kind: 'hay' },
      { x: 200, y: 250, r: 36, kind: 'bush' },
      { x: 640, y: 520, r: 36, kind: 'bush' },
    ]);
    // Pumpkins are decoration only — the turkey can waddle past them.
    for (let i = 0; i < 6; i++) {
      decor.push({ x: range(rng, 80, 880), y: range(rng, 300, 540), kind: 'pumpkin', s: range(rng, 0.8, 1.3) });
    }
    for (let i = 0; i < 10; i++) {
      decor.push({ x: range(rng, 60, 900), y: range(rng, 60, 540), kind: 'flower', s: 1 });
    }
    spawn = { x: 90, y: 510 };
    exit = { x: VIEW_W - 140, y: 40, w: 110, h: 34 };
    farmerSpawns = [
      { x: 480, y: 180, waypoints: [
        { x: 480, y: 180 }, { x: 760, y: 180 }, { x: 760, y: 460 }, { x: 420, y: 460 }, { x: 300, y: 300 },
      ] },
    ];
  } else if (stage.floor === 'barn') {
    // Crates and feed sacks make a maze; hay bales are the hiding spots.
    solids.push({ x: 180, y: 120, w: 90, h: 90, kind: 'crate' });
    solids.push({ x: 420, y: 90, w: 90, h: 90, kind: 'crate' });
    solids.push({ x: 660, y: 130, w: 90, h: 90, kind: 'crate' });
    solids.push({ x: 300, y: 300, w: 90, h: 90, kind: 'crate' });
    solids.push({ x: 560, y: 330, w: 90, h: 90, kind: 'crate' });
    solids.push({ x: 140, y: 420, w: 120, h: 40, kind: 'sack' });
    solids.push({ x: 700, y: 430, w: 120, h: 40, kind: 'sack' });
    hides = scatterHides(rng, [
      { x: 120, y: 300, r: 40, kind: 'hay' },
      { x: 480, y: 480, r: 42, kind: 'hay' },
      { x: 830, y: 330, r: 40, kind: 'hay' },
      { x: 840, y: 90, r: 34, kind: 'hay' },
    ]);
    for (let i = 0; i < 8; i++) {
      decor.push({ x: range(rng, 80, 880), y: range(rng, 80, 540), kind: 'straw', s: range(rng, 0.7, 1.2) });
    }
    spawn = { x: 80, y: 510 };
    exit = { x: VIEW_W - 140, y: VIEW_H - 74, w: 110, h: 34 };
    farmerSpawns = [
      { x: 480, y: 250, waypoints: [
        { x: 480, y: 250 }, { x: 800, y: 250 }, { x: 800, y: 500 }, { x: 180, y: 500 }, { x: 180, y: 200 },
      ] },
    ];
    dogSpawn = { x: 700, y: 300, waypoints: [
      { x: 700, y: 300 }, { x: 380, y: 420 }, { x: 380, y: 160 }, { x: 700, y: 160 },
    ] };
  } else {
    // The kitchen: counters along the top and left, a big table in the
    // middle, the oven glowing at top-right, the back door at bottom-left.
    solids.push({ x: 60, y: 60, w: 420, h: 60, kind: 'counter' });
    solids.push({ x: 60, y: 60, w: 60, h: 260, kind: 'counter' });
    solids.push({ x: 800, y: 60, w: 100, h: 60, kind: 'counter' });
    solids.push({ x: 400, y: 250, w: 220, h: 80, kind: 'table' });
    solids.push({ x: 620, y: 430, w: 150, h: 50, kind: 'counter' });
    solids.push({ x: 160, y: 430, w: 120, h: 50, kind: 'counter' });
    hides = scatterHides(rng, [
      { x: 850, y: 480, r: 38, kind: 'plant' },
      { x: 330, y: 520, r: 38, kind: 'plant' },
      { x: 880, y: 300, r: 34, kind: 'plant' },
    ]);
    for (let i = 0; i < 5; i++) {
      decor.push({ x: range(rng, 140, 880), y: range(rng, 140, 540), kind: 'crumb', s: 1 });
    }
    spawn = { x: 120, y: 510 };
    exit = { x: 40, y: VIEW_H - 80, w: 100, h: 34 };
    farmerSpawns = [
      { x: 500, y: 160, waypoints: [
        { x: 500, y: 160 }, { x: 820, y: 160 }, { x: 820, y: 480 }, { x: 480, y: 480 }, { x: 220, y: 180 },
      ] },
    ];
    oven = { x: 700, y: 60, w: 100, h: 60, zone: { x: 690, y: 120, w: 120, h: 70 } };
    knifeLane = { y: 390, x0: 130, x1: 830, warn: 0.9, sweep: 0.85, pause: 2.6, t: 0, phase: 'pause', dir: 1, x: 130 };
  }

  const keepOut = [{ x: spawn.x, y: spawn.y, r: 90 }, { x: exit.x + exit.w / 2, y: exit.y + exit.h / 2, r: 80 }];
  for (const f of farmerSpawns) keepOut.push({ x: f.x, y: f.y, r: 90 });
  const corns = scatterCorn(rng, stage.cornCount, stage.goldenCorn, solids, hides, keepOut);

  return {
    stageIndex,
    stage,
    solids,
    decor,
    hides,
    corns,
    spawn,
    exit,
    farmerSpawns,
    dogSpawn,
    knifeLane,
    oven,
    seed,
  };
}

// Can a circle of radius r stand at (x, y) without overlapping a wall or solid?
export function circleFree(world, x, y, r) {
  if (x < WALL + r || x > VIEW_W - WALL - r) return false;
  if (y < WALL + r || y > VIEW_H - WALL - r) return false;
  for (const s of world.solids) {
    if (circleHitsRect(x, y, r, s)) return false;
  }
  return true;
}

// Move a circle step by step, sliding along obstacles instead of sticking.
export function moveCircle(world, x, y, r, dx, dy) {
  const nx = x + dx;
  if (circleFree(world, nx, y, r)) x = nx;
  const ny = y + dy;
  if (circleFree(world, x, ny, r)) y = ny;
  return { x, y };
}

// Is the turkey hidden inside a haystack, bush or plant right now?
export function hidingSpotAt(world, x, y) {
  for (const h of world.hides) {
    if (Math.hypot(x - h.x, y - h.y) < h.r * 0.8) return h;
  }
  return null;
}

// Gobble Dash — the game itself: state machine, loop, hazards, scoring.
// One job: tie the turkey, the hunters, the world and the screens together,
// and run the whole escape from title to freedom.

import { VIEW_W, VIEW_H, STAGES, TUNING } from './config.js';
import { Input } from './input.js';
import { SoundFX } from './audio.js';
import { buildWorld, pointInRect } from './world.js';
import { Hunter } from './farmer.js';
import { Turkey } from './turkey.js';
import * as render from './render.js';
import * as hud from './hud.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.fx = new SoundFX();
    this.stages = STAGES;
    this.state = 'title'; // title | playing | caught | stageclear | gameover | win
    this.time = 0;
    this.seed = (Math.random() * 1e9) | 0;
    this.score = 0;
    this.lives = TUNING.lives;
    this.cornCount = 0;
    this.stageIndex = 0;
    this.stageTime = 0;
    this.lastStageBonus = 0;
    this.heat = 0; // how scorched the turkey is by the oven, 0..1
    this.buttons = {};
    this.best = 0;
    try {
      this.best = Number(window.localStorage.getItem('gobbleDashBest') || 0) || 0;
    } catch {
      this.best = 0;
    }
    this.shot = null;
    this.loadStage(0);
  }

  saveBest() {
    if (this.score > this.best) {
      this.best = this.score;
      try {
        window.localStorage.setItem('gobbleDashBest', String(this.best));
      } catch {
        // Private browsing or a locked-down host: the best score just lives in memory.
      }
    }
  }

  loadStage(index) {
    this.stageIndex = index;
    this.world = buildWorld(index, this.seed);
    this.turkey = new Turkey(this.world.spawn);
    this.hunters = this.world.farmerSpawns.map((def) => {
      const s = this.world.stage;
      return new Hunter(def, {
        speed: s.farmerSpeed,
        vision: s.farmerVision,
        visionAngle: s.farmerVisionAngle,
        chaseSpeed: s.farmerSpeed * 1.55,
      });
    });
    if (this.world.dogSpawn) {
      const s = this.world.stage;
      this.hunters.push(
        new Hunter(this.world.dogSpawn, {
          speed: s.farmerSpeed * 1.25,
          vision: 165,
          visionAngle: 1.35,
          chaseSpeed: s.farmerSpeed * 1.9,
          isDog: true,
        }),
      );
    }
    this.stageTime = 0;
    this.heat = 0;
  }

  startRun() {
    this.score = 0;
    this.lives = TUNING.lives;
    this.cornCount = 0;
    this.loadStage(0);
    this.state = 'playing';
    this.fx.unlock();
    this.fx.gobble();
  }

  loseLife(cause) {
    if (this.turkey.invuln > 0 || this.state !== 'playing') return;
    this.lives -= 1;
    this.fx.caught();
    this.heat = 0;
    if (this.lives <= 0) {
      this.state = 'gameover';
      this.saveBest();
      this.fx.gameOver();
    } else {
      this.state = 'caught';
    }
  }

  retryStage() {
    this.loadStage(this.stageIndex);
    this.state = 'playing';
  }

  clearStage() {
    const timeBonus = Math.max(0, 500 - Math.floor(this.stageTime) * 5);
    this.lastStageBonus = TUNING.stageClearPoints + timeBonus;
    this.score += this.lastStageBonus;
    this.fx.stageClear();
    if (this.stageIndex + 1 >= this.stages.length) {
      this.score += TUNING.winBonus;
      this.state = 'win';
      this.saveBest();
      this.fx.winFanfare();
    } else {
      this.state = 'stageclear';
    }
  }

  nextStage() {
    this.loadStage(this.stageIndex + 1);
    this.state = 'playing';
    this.fx.gobble();
  }

  anyChasing() {
    return this.hunters.some((h) => h.state === 'chase');
  }

  anySearching() {
    return this.hunters.some((h) => h.state === 'search');
  }

  // How far the turkey has come toward this stage's exit, 0..1.
  exitProgress() {
    const e = this.world.exit;
    const ex = e.x + e.w / 2;
    const ey = e.y + e.h / 2;
    const total = Math.hypot(ex - this.world.spawn.x, ey - this.world.spawn.y) || 1;
    const left = Math.hypot(ex - this.turkey.x, ey - this.turkey.y);
    return Math.max(0, Math.min(1, 1 - left / total));
  }

  buttonHovered(name) {
    const b = this.buttons[name];
    if (!b) return false;
    const { mouseX, mouseY } = this.input;
    return mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h;
  }

  buttonClicked(name) {
    const b = this.buttons[name];
    const click = this.input.takeClick();
    if (!click || !b) return false;
    return click.x >= b.x && click.x <= b.x + b.w && click.y >= b.y && click.y <= b.y + b.h;
  }

  // ---------- the kitchen hazards ----------

  updateKnife(dt) {
    const lane = this.world.knifeLane;
    if (!lane) return;
    lane.t += dt;
    if (lane.phase === 'pause' && lane.t > lane.pause) {
      lane.phase = 'warn';
      lane.t = 0;
      lane.x = lane.dir > 0 ? lane.x0 : lane.x1;
      this.fx.knifeWhoosh();
    } else if (lane.phase === 'warn' && lane.t > lane.warn) {
      lane.phase = 'sweep';
      lane.t = 0;
    } else if (lane.phase === 'sweep') {
      const span = lane.x1 - lane.x0;
      const progress = Math.min(1, lane.t / lane.sweep);
      lane.x = lane.dir > 0 ? lane.x0 + span * progress : lane.x1 - span * progress;
      if (progress >= 1) {
        lane.phase = 'pause';
        lane.t = 0;
        lane.dir *= -1;
      }
      // The blade is live while it sweeps.
      if (Math.hypot(this.turkey.x - lane.x, this.turkey.y - lane.y) < this.turkey.radius + 22) {
        this.loseLife('knife');
      }
    }
  }

  updateOven(dt) {
    const oven = this.world.oven;
    if (!oven) return;
    const open = Math.sin(this.time * 0.9) > -0.2;
    const z = oven.zone;
    const inside = pointInRect(this.turkey.x, this.turkey.y, z);
    if (open && inside) {
      this.heat += dt * 1.5;
      if (this.heat >= 1) {
        // Scorched: shove the turkey away from the oven and cost a life.
        this.turkey.y = z.y + z.h + this.turkey.radius + 4;
        this.loseLife('oven');
      }
    } else {
      this.heat = Math.max(0, this.heat - dt * 0.8);
    }
  }

  // ---------- update ----------

  update(dt) {
    this.time += dt;
    if (this.state === 'title') {
      // The farmyard idles behind the title: the farmer patrols on his own.
      for (const h of this.hunters) h.update(dt, this.turkey, this.world, null);
      if (this.input.confirmPressed || this.buttonClicked('play')) {
        this.fx.unlock();
        this.startRun();
      }
      return;
    }
    if (this.state === 'playing') {
      this.stageTime += dt;
      this.fx.unlock();
      const click = this.input.takeClick();
      if (click) this.turkey.moveTarget = { x: click.x, y: click.y };
      const gained = this.turkey.update(dt, this.input, this.world, this.fx);
      if (gained > 0) {
        this.score += gained;
        this.cornCount += 1;
      }
      for (const h of this.hunters) {
        h.update(dt, this.turkey, this.world, () => this.fx.alert());
        if (this.state !== 'playing') break;
        if (
          this.turkey.invuln <= 0 &&
          Math.hypot(h.x - this.turkey.x, h.y - this.turkey.y) < h.radius + this.turkey.radius - 4
        ) {
          this.loseLife('farmer');
          break;
        }
      }
      if (this.state !== 'playing') return;
      this.updateKnife(dt);
      if (this.state !== 'playing') return;
      this.updateOven(dt);
      if (this.state !== 'playing') return;
      if (this.turkey.isAtExit(this.world)) this.clearStage();
      return;
    }
    if (this.state === 'caught') {
      if (this.input.confirmPressed || this.buttonClicked('retry')) this.retryStage();
      return;
    }
    if (this.state === 'stageclear') {
      if (this.input.confirmPressed || this.buttonClicked('next')) this.nextStage();
      return;
    }
    if (this.state === 'gameover' || this.state === 'win') {
      if (this.input.confirmPressed || this.buttonClicked('again')) this.startRun();
    }
  }

  // ---------- render ----------

  render() {
    const ctx = this.ctx;
    const t = this.time;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    render.drawFloor(ctx, this.world, t);
    render.drawExit(ctx, this.world, t);
    for (const corn of this.world.corns) render.drawCorn(ctx, corn, t);
    for (const h of this.world.hides) render.drawHide(ctx, h, t);
    for (const s of this.world.solids) render.drawObstacle(ctx, s, t);
    for (const d of this.world.decor) render.drawDecor(ctx, d, t);
    if (this.world.oven) render.drawOven(ctx, this.world.oven, t);
    if (this.world.knifeLane) render.drawKnifeLane(ctx, this.world.knifeLane, t);
    for (const hunter of this.hunters) render.drawVisionCone(ctx, hunter);
    for (const hunter of this.hunters) {
      if (hunter.isDog) render.drawDog(ctx, hunter, t);
      else render.drawFarmer(ctx, hunter, t);
    }
    render.drawTurkey(ctx, this.turkey, t);
    // When hidden, the hay closes over the turkey.
    if (this.turkey.hidden) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      const spot = this.world.hides.find(
        (h) => Math.hypot(h.x - this.turkey.x, h.y - this.turkey.y) < h.r,
      );
      if (spot) render.drawHide(ctx, spot, t);
      ctx.restore();
    }
    if (this.state === 'playing' || this.state === 'caught') hud.drawHud(ctx, this, t);
    if (this.state === 'title') hud.drawTitle(ctx, this, t);
    else if (this.state === 'stageclear') hud.drawStageClear(ctx, this);
    else if (this.state === 'caught') hud.drawCaught(ctx, this);
    else if (this.state === 'gameover') hud.drawGameOver(ctx, this);
    else if (this.state === 'win') hud.drawWin(ctx, this);
  }

  frame(dt) {
    this.update(dt);
    this.render();
    this.input.endFrame();
  }

  // ---------- deterministic screenshot scenes ----------

  setupShot(shot, seed) {
    this.shot = shot;
    this.seed = seed;
    this.fx.enabled = false;
    if (shot === 'title') {
      this.loadStage(0);
      this.state = 'title';
    } else if (shot === 'chase') {
      this.loadStage(0);
      this.state = 'playing';
      this.score = 350;
      this.cornCount = 4;
      // The turkey flees across the yard; the farmer is right on its tail.
      this.turkey.x = 470;
      this.turkey.y = 320;
      this.turkey.distance = 87;
      this.turkey.moveTarget = { x: 840, y: 120 };
      const farmer = this.hunters[0];
      farmer.x = 400;
      farmer.y = 380;
      farmer.dir = Math.atan2(this.turkey.y - farmer.y, this.turkey.x - farmer.x);
      farmer.state = 'chase';
      farmer.detection = 1;
      farmer.lastSeen = { x: this.turkey.x, y: this.turkey.y };
      this.world.corns[0].taken = true;
      this.world.corns[1].taken = true;
    } else if (shot === 'kitchen') {
      this.loadStage(2);
      this.state = 'playing';
      this.score = 1250;
      this.cornCount = 11;
      this.turkey.x = 500;
      this.turkey.y = 430;
      this.turkey.distance = 210;
      this.turkey.moveTarget = { x: 120, y: 520 };
      const farmer = this.hunters[0];
      farmer.x = 640;
      farmer.y = 300;
      farmer.dir = Math.atan2(this.turkey.y - farmer.y, this.turkey.x - farmer.x);
      farmer.state = 'search';
      farmer.lastSeen = { x: 480, y: 420 };
      // The knife is mid-sweep so the danger reads in the shot.
      const lane = this.world.knifeLane;
      lane.phase = 'sweep';
      lane.t = lane.sweep * 0.45;
      lane.dir = 1;
      lane.x = lane.x0 + (lane.x1 - lane.x0) * 0.45;
      this.world.corns[0].taken = true;
      this.world.corns[2].taken = true;
    } else if (shot === 'escaped') {
      this.loadStage(2);
      this.state = 'win';
      this.score = 2480;
      this.best = 2480;
      this.cornCount = 16;
      this.turkey.x = this.world.exit.x + 50;
      this.turkey.y = this.world.exit.y + 17;
      this.turkey.distance = 342;
      const farmer = this.hunters[0];
      farmer.x = 700;
      farmer.y = 200;
      farmer.state = 'search';
      farmer.lastSeen = { x: 500, y: 400 };
    }
  }
}

export function boot(canvas) {
  const game = new Game(canvas);
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || 7);
  if (shot) {
    game.setupShot(shot, seed);
  } else {
    game.seed = seed;
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    game.frame(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__game = game;
  window.__ready = true;
  return game;
}

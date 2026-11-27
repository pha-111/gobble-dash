// Gobble Dash — the turkey: the player.
// One job: the turkey's body — running, sprinting on stamina, hopping over
// trouble, hiding in the hay, and collecting corn.

import { TUNING } from './config.js';
import { moveCircle, hidingSpotAt, pointInRect } from './world.js';

export class Turkey {
  constructor(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.dir = -Math.PI / 2; // facing up, toward the gate
    this.radius = TUNING.turkeyRadius;
    this.stamina = TUNING.staminaMax;
    this.exhausted = false;
    this.hopTimer = 0;
    this.hopCooldown = 0;
    this.hopDir = { x: 0, y: -1 };
    this.invuln = 0;
    this.hidden = false;
    this.moving = false;
    this.stepTimer = 0;
    this.distance = 0; // metres waddled, for the HUD and the score
    this.moveTarget = null; // mouse click-to-move destination
  }

  reset(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.dir = -Math.PI / 2;
    this.stamina = TUNING.staminaMax;
    this.exhausted = false;
    this.hopTimer = 0;
    this.hopCooldown = 0;
    this.invuln = 2;
    this.hidden = false;
    this.moveTarget = null;
  }

  update(dt, input, world, fx) {
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hopCooldown > 0) this.hopCooldown -= dt;

    const steer = input.steerVector();
    let mx = steer.x;
    let my = steer.y;

    // Mouse click-to-move: walk toward the clicked point until keys take over.
    if (!steer.active && this.moveTarget) {
      const dx = this.moveTarget.x - this.x;
      const dy = this.moveTarget.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 10) {
        this.moveTarget = null;
      } else {
        mx = dx / dist;
        my = dy / dist;
      }
    }
    if (steer.active) this.moveTarget = null;

    const wantSprint = input.sprinting && !this.exhausted && this.stamina > 0;
    if (this.stamina <= 0) this.exhausted = true;
    if (this.exhausted && this.stamina > TUNING.staminaExhaustedUntil) this.exhausted = false;

    let speed = TUNING.turkeyWalk;
    if (wantSprint && (mx !== 0 || my !== 0)) {
      speed = TUNING.turkeySprint;
      this.stamina = Math.max(0, this.stamina - TUNING.staminaDrain * dt);
    } else {
      this.stamina = Math.min(TUNING.staminaMax, this.stamina + TUNING.staminaRegen * dt);
    }

    // The hop: a wing-flap burst that hops clean over low trouble. With no
    // steering held it hops in the direction the turkey already faces.
    if (input.hopPressed && this.hopCooldown <= 0) {
      const hx = mx !== 0 || my !== 0 ? mx : Math.cos(this.dir);
      const hy = mx !== 0 || my !== 0 ? my : Math.sin(this.dir);
      this.hopTimer = TUNING.hopTime;
      this.hopCooldown = TUNING.hopCooldown;
      this.hopDir = { x: hx, y: hy };
      if (fx) fx.hop();
    }

    this.moving = mx !== 0 || my !== 0;
    if (this.moving) this.dir = Math.atan2(my, mx);

    if (this.hopTimer > 0) {
      this.hopTimer -= dt;
      // During a hop the turkey sails over obstacles — no collision.
      const step = TUNING.hopSpeed * dt;
      this.x += this.hopDir.x * step;
      this.y += this.hopDir.y * step;
      this.x = Math.max(24 + this.radius, Math.min(960 - 24 - this.radius, this.x));
      this.y = Math.max(24 + this.radius, Math.min(600 - 24 - this.radius, this.y));
      this.vx = this.hopDir.x * TUNING.hopSpeed;
      this.vy = this.hopDir.y * TUNING.hopSpeed;
    } else {
      const step = speed * dt;
      const moved = moveCircle(world, this.x, this.y, this.radius, mx * step, my * step);
      this.vx = ((moved.x - this.x) / Math.max(dt, 0.0001)) * (this.moving ? 1 : 0);
      this.vy = ((moved.y - this.y) / Math.max(dt, 0.0001)) * (this.moving ? 1 : 0);
      this.distance += Math.hypot(moved.x - this.x, moved.y - this.y) / 50;
      this.x = moved.x;
      this.y = moved.y;
    }

    if (this.moving) {
      this.stepTimer += dt;
      if (this.stepTimer > 0.32) {
        this.stepTimer = 0;
        if (fx) fx.step && fx.step();
      }
    }

    // Hiding: still inside a haystack, bush or plant, the farmer cannot see you.
    const spot = hidingSpotAt(world, this.x, this.y);
    this.hidden = !!spot && !this.moving;

    // Corn: waddle over it to gobble it up.
    for (const corn of world.corns) {
      if (!corn.taken && Math.hypot(corn.x - this.x, corn.y - this.y) < this.radius + 14) {
        corn.taken = true;
        if (fx) {
          if (corn.golden) fx.goldenPickup();
          else fx.pickup();
        }
        return corn.golden ? TUNING.goldenCornPoints : TUNING.cornPoints;
      }
    }
    return 0;
  }

  get atExit() {
    return false; // the game checks the exit rectangle itself
  }

  isAtExit(world) {
    return pointInRect(this.x, this.y, world.exit);
  }
}

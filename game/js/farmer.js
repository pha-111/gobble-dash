// Gobble Dash — the farmer (and the barn dog): patrol, chase, search, corner.
// One job: the hunter's brain. It sees through a cone, loses the turkey,
// hunts the last place it saw it, and goes back to its rounds.

import { TUNING } from './config.js';
import { lineBlocked, moveCircle } from './world.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export class Hunter {
  constructor(def, opts) {
    this.x = def.x;
    this.y = def.y;
    this.waypoints = def.waypoints;
    this.wpIndex = 0;
    this.dir = 0;
    this.state = 'patrol'; // patrol | chase | search
    this.speed = opts.speed;
    this.vision = opts.vision;
    this.visionAngle = opts.visionAngle;
    this.chaseSpeed = opts.chaseSpeed;
    this.isDog = !!opts.isDog;
    this.radius = this.isDog ? 13 : 17;
    this.detection = 0; // 0..1, fills while the turkey is in the cone
    this.loseTimer = 0;
    this.searchTimer = 0;
    this.lastSeen = { x: this.x, y: this.y };
    this.searchTarget = null;
    this.wobble = Math.random() * Math.PI * 2;
    this.stuckTimer = 0;
  }

  // Can this hunter see the turkey right now?
  canSee(turkey, world) {
    if (turkey.hidden) return false;
    if (turkey.invuln > 0) return false;
    const dx = turkey.x - this.x;
    const dy = turkey.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.vision) return false;
    const angleTo = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(angleTo, this.dir)) > this.visionAngle) return false;
    if (lineBlocked(this.x, this.y, turkey.x, turkey.y, world.solids)) return false;
    return true;
  }

  update(dt, turkey, world, onSpotted) {
    const sees = this.canSee(turkey, world);

    if (this.state === 'patrol') {
      if (sees) {
        this.detection += dt / TUNING.detectionTime;
        if (this.detection >= 1) {
          this.state = 'chase';
          this.loseTimer = 0;
          this.lastSeen = { x: turkey.x, y: turkey.y };
          if (onSpotted) onSpotted(this);
        }
      } else {
        this.detection = Math.max(0, this.detection - dt * 2);
      }
      if (this.state === 'patrol') this.patrolStep(dt, world);
    } else if (this.state === 'chase') {
      if (sees) {
        this.loseTimer = 0;
        this.lastSeen = { x: turkey.x, y: turkey.y };
      } else {
        this.loseTimer += dt;
        if (this.loseTimer > TUNING.loseSightTime) {
          this.state = 'search';
          this.searchTimer = 0;
          this.searchTarget = { x: this.lastSeen.x, y: this.lastSeen.y };
        }
      }
      if (this.state === 'chase') this.chaseStep(dt, turkey, world);
    } else if (this.state === 'search') {
      this.searchTimer += dt;
      if (sees) {
        this.detection = 1;
        this.state = 'chase';
        this.loseTimer = 0;
        this.lastSeen = { x: turkey.x, y: turkey.y };
        if (onSpotted) onSpotted(this);
      } else if (this.searchTimer > TUNING.searchTime) {
        this.state = 'patrol';
        this.detection = 0;
      } else {
        this.searchStep(dt, world);
      }
    }
  }

  // Walk the patrol loop, turning at each waypoint.
  patrolStep(dt, world) {
    const target = this.waypoints[this.wpIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
      this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
      return;
    }
    const want = Math.atan2(dy, dx);
    this.dir = this.turnToward(this.dir, want, dt * 4);
    const step = this.speed * dt;
    const moved = moveCircle(world, this.x, this.y, this.radius, Math.cos(this.dir) * step, Math.sin(this.dir) * step);
    if (Math.hypot(moved.x - this.x, moved.y - this.y) < step * 0.2) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 0.6) {
        this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
        this.stuckTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
    }
    this.x = moved.x;
    this.y = moved.y;
  }

  // Run straight at the turkey, cutting the corner when close.
  chaseStep(dt, turkey, world) {
    const dx = turkey.x - this.x;
    const dy = turkey.y - this.y;
    const dist = Math.hypot(dx, dy);
    const want = Math.atan2(dy, dx);
    this.dir = this.turnToward(this.dir, want, dt * 7);
    // A little prediction: aim slightly ahead of a fleeing turkey.
    const lead = Math.min(0.25, dist / 400);
    const aimX = turkey.x + turkey.vx * lead;
    const aimY = turkey.y + turkey.vy * lead;
    const ax = aimX - this.x;
    const ay = aimY - this.y;
    const alen = Math.hypot(ax, ay) || 1;
    const step = this.chaseSpeed * dt;
    const moved = moveCircle(world, this.x, this.y, this.radius, (ax / alen) * step, (ay / alen) * step);
    this.x = moved.x;
    this.y = moved.y;
  }

  // Wander around the last seen spot, sniffing, then give up.
  searchStep(dt, world) {
    if (!this.searchTarget) return;
    const dx = this.searchTarget.x - this.x;
    const dy = this.searchTarget.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 14) {
      // Sniff around: pick a nearby point to check.
      this.wobble += dt * 2.2;
      const px = this.searchTarget.x + Math.cos(this.wobble) * 55;
      const py = this.searchTarget.y + Math.sin(this.wobble) * 55;
      const want = Math.atan2(py - this.y, px - this.x);
      this.dir = this.turnToward(this.dir, want, dt * 5);
      const step = this.speed * 0.55 * dt;
      const moved = moveCircle(world, this.x, this.y, this.radius, Math.cos(this.dir) * step, Math.sin(this.dir) * step);
      this.x = moved.x;
      this.y = moved.y;
      return;
    }
    const want = Math.atan2(dy, dx);
    this.dir = this.turnToward(this.dir, want, dt * 5);
    const step = this.speed * 0.8 * dt;
    const moved = moveCircle(world, this.x, this.y, this.radius, Math.cos(this.dir) * step, Math.sin(this.dir) * step);
    this.x = moved.x;
    this.y = moved.y;
  }

  turnToward(current, want, maxStep) {
    const d = angleDiff(want, current);
    if (Math.abs(d) <= maxStep) return want;
    return current + Math.sign(d) * maxStep;
  }
}

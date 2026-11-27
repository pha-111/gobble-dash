// Gobble Dash — the HUD and the menus: title, stage clear, caught, game over, win.
// One job: everything drawn on top of the world — scores, hearts, stamina,
// buttons — and the buttons the mouse can press.

import { VIEW_W, VIEW_H, PALETTE, TUNING } from './config.js';

export function drawHeart(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = filled ? '#d63a2a' : 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-9, -3, -6, -10, 0, -4);
  ctx.bezierCurveTo(6, -10, 9, -3, 0, 5);
  ctx.fill();
  ctx.restore();
}

// The in-play HUD: score, stage, lives, corn, stamina and the escape progress.
export function drawHud(ctx, game, time) {
  const { score, lives, cornCount, turkey, stageIndex, stages } = game;
  ctx.save();
  // Top bar.
  ctx.fillStyle = 'rgba(46,33,24,0.82)';
  ctx.fillRect(0, 0, VIEW_W, 46);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`SCORE  ${score}`, 16, 24);
  ctx.fillText(`🌽 ${cornCount}`, 200, 24);
  ctx.textAlign = 'center';
  ctx.fillText(stages[stageIndex].name, VIEW_W / 2, 24);
  ctx.textAlign = 'right';
  ctx.fillText(`BEST  ${game.best}`, VIEW_W - 16, 24);
  // Hearts.
  for (let i = 0; i < TUNING.lives; i++) {
    drawHeart(ctx, VIEW_W - 150 - i * 26, 24, i < lives);
  }
  ctx.textBaseline = 'alphabetic';

  // Bottom bar: stamina and the escape progress toward the exit.
  ctx.fillStyle = 'rgba(46,33,24,0.82)';
  ctx.fillRect(0, VIEW_H - 40, VIEW_W, 40);
  // Stamina.
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SPRINT', 16, VIEW_H - 16);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(80, VIEW_H - 26, 150, 12);
  const staminaColor = turkey.exhausted ? '#d63a2a' : turkey.stamina < 30 ? '#e8862e' : '#7cc24f';
  ctx.fillStyle = staminaColor;
  ctx.fillRect(80, VIEW_H - 26, 150 * (turkey.stamina / TUNING.staminaMax), 12);
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText(turkey.exhausted ? 'WINDED!' : 'SHIFT to sprint · SPACE to hop', 244, VIEW_H - 16);

  // Progress to the exit: distance already covered toward it.
  const progress = game.exitProgress();
  ctx.textAlign = 'right';
  ctx.fillText(`ESCAPE ${Math.round(progress * 100)}%`, VIEW_W - 16, VIEW_H - 16);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(VIEW_W - 260, VIEW_H - 26, 120, 12);
  ctx.fillStyle = '#ffd94a';
  ctx.fillRect(VIEW_W - 260, VIEW_H - 26, 120 * progress, 12);

  // Distance waddled, on a dark pill so it reads over any floor.
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px sans-serif';
  const distText = `DISTANCE  ${Math.floor(turkey.distance)} m`;
  const distW = ctx.measureText(distText).width + 16;
  ctx.fillStyle = 'rgba(46,33,24,0.7)';
  ctx.beginPath();
  ctx.roundRect(10, 54, distW, 22, 11);
  ctx.fill();
  ctx.fillStyle = 'rgba(247,234,208,0.95)';
  ctx.fillText(distText, 18, 70);

  // Status banners.
  if (turkey.hidden) {
    banner(ctx, 'HIDDEN IN THE HAY — the farmer cannot see you', '#5d9c40');
  } else if (game.anyChasing()) {
    banner(ctx, 'SPOTTED! RUN!', '#d63a2a');
  } else if (game.anySearching()) {
    banner(ctx, 'The farmer is hunting for you… stay hidden', '#e8862e');
  }
  ctx.restore();
}

function banner(ctx, text, color) {
  ctx.save();
  ctx.font = 'bold 16px sans-serif';
  const w = ctx.measureText(text).width + 36;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect((VIEW_W - w) / 2, 56, w, 32, 16);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, VIEW_W / 2, 73);
  ctx.restore();
}

// A big centred button; returns its rectangle for click tests.
export function drawButton(ctx, x, y, w, h, label, hovered) {
  ctx.save();
  ctx.fillStyle = hovered ? '#f2a541' : PALETTE.orange;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#7e4a12';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  ctx.restore();
  return { x, y, w, h };
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(30,20,12,0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(247,234,208,0.96)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function titleText(ctx, text, y, size, color) {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW_W / 2, y);
}

export function drawTitle(ctx, game, time) {
  dim(ctx);
  panel(ctx, 130, 70, VIEW_W - 260, 460);
  // A little turkey mascot on the panel.
  ctx.save();
  ctx.translate(VIEW_W / 2, 150);
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.rotate(i * 0.4 - Math.PI / 2);
    ctx.fillStyle = i % 2 === 0 ? '#a3652f' : '#7e4a22';
    ctx.beginPath();
    ctx.ellipse(-26, 0, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = PALETTE.turkeyBrown;
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c98a4b';
  ctx.beginPath();
  ctx.arc(0, -24, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.orange;
  ctx.beginPath();
  ctx.moveTo(10, -26);
  ctx.lineTo(24, -22);
  ctx.lineTo(10, -18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d63a2a';
  ctx.beginPath();
  ctx.ellipse(8, -14, 4, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1410';
  ctx.beginPath();
  ctx.arc(4, -28, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  titleText(ctx, 'GOBBLE DASH', 240, 54, PALETTE.barnRed);
  titleText(ctx, "A Turkey's Great Thanksgiving Escape", 272, 20, PALETTE.ink);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Thanksgiving is coming — and you are the main course.', VIEW_W / 2, 312);
  ctx.fillText('Dodge the farmer, hide in the hay, gobble the corn,', VIEW_W / 2, 336);
  ctx.fillText('and slip out the gate before the oven gets you.', VIEW_W / 2, 360);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('WASD / Arrows — waddle    SHIFT — sprint    SPACE — hop', VIEW_W / 2, 396);
  ctx.fillText('Click anywhere to walk there · Hide in haystacks to vanish', VIEW_W / 2, 418);
  if (game.best > 0) {
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = PALETTE.barnRed;
    ctx.fillText(`BEST SCORE  ${game.best}`, VIEW_W / 2, 448);
  }
  const hovered = game.buttonHovered('play');
  game.buttons.play = drawButton(ctx, VIEW_W / 2 - 130, 462, 260, 52, '▶  START THE ESCAPE', hovered);
}

export function drawStageClear(ctx, game) {
  dim(ctx);
  panel(ctx, 210, 150, VIEW_W - 420, 300);
  titleText(ctx, 'ESCAPED THE ' + game.stages[game.stageIndex].name + '!', 220, 30, PALETTE.leaf);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Stage bonus  +${game.lastStageBonus}      Score  ${game.score}`, VIEW_W / 2, 268);
  ctx.fillText(game.stageIndex + 1 < game.stages.length ? 'Next stop: ' + game.stages[game.stageIndex + 1].name : '', VIEW_W / 2, 300);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Press ENTER or click to keep running', VIEW_W / 2, 340);
  const hovered = game.buttonHovered('next');
  game.buttons.next = drawButton(ctx, VIEW_W / 2 - 110, 368, 220, 50, 'KEEP RUNNING →', hovered);
}

export function drawCaught(ctx, game) {
  dim(ctx);
  panel(ctx, 210, 150, VIEW_W - 420, 300);
  titleText(ctx, 'CAUGHT!', 225, 44, PALETTE.danger);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('The farmer has you by the drumstick…', VIEW_W / 2, 275);
  ctx.fillText(`but you wriggle free!  Lives left: ${game.lives}`, VIEW_W / 2, 305);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Press ENTER or click to try again', VIEW_W / 2, 345);
  const hovered = game.buttonHovered('retry');
  game.buttons.retry = drawButton(ctx, VIEW_W / 2 - 110, 372, 220, 50, 'TRY AGAIN', hovered);
}

export function drawGameOver(ctx, game) {
  dim(ctx);
  panel(ctx, 170, 120, VIEW_W - 340, 360);
  titleText(ctx, 'DINNNER IS SERVED', 195, 40, PALETTE.danger);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('The turkey did not escape this Thanksgiving.', VIEW_W / 2, 245);
  ctx.fillText(`Final score  ${game.score}      Distance  ${Math.floor(game.turkey.distance)} m`, VIEW_W / 2, 278);
  ctx.fillText(`Best score  ${game.best}`, VIEW_W / 2, 306);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Press ENTER or click to run again', VIEW_W / 2, 348);
  const hovered = game.buttonHovered('again');
  game.buttons.again = drawButton(ctx, VIEW_W / 2 - 110, 380, 220, 50, '↻  RUN AGAIN', hovered);
}

export function drawWin(ctx, game) {
  dim(ctx);
  panel(ctx, 150, 90, VIEW_W - 300, 420);
  titleText(ctx, 'YOU ESCAPED!', 165, 46, PALETTE.leaf);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '19px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Past the farmyard, through the barn, out of the kitchen —', VIEW_W / 2, 215);
  ctx.fillText('and into the wild woods, just in time for Thanksgiving.', VIEW_W / 2, 242);
  ctx.fillText('This year, the farmer eats salad.', VIEW_W / 2, 269);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = PALETTE.barnRed;
  ctx.fillText(`FINAL SCORE  ${game.score}`, VIEW_W / 2, 315);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText(`Distance waddled  ${Math.floor(game.turkey.distance)} m      Corn gobbled  ${game.cornCount}`, VIEW_W / 2, 348);
  ctx.fillText(`Best score  ${game.best}`, VIEW_W / 2, 374);
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Press ENTER or click to escape again', VIEW_W / 2, 414);
  const hovered = game.buttonHovered('again');
  game.buttons.again = drawButton(ctx, VIEW_W / 2 - 110, 436, 220, 50, '↻  ESCAPE AGAIN', hovered);
}

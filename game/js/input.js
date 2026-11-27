// Gobble Dash — keyboard and mouse input.
// One job: turn raw browser events into the game's questions:
// which way is the turkey being steered, and what was just pressed or clicked?

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // edge-triggered keys, cleared once a frame
    this.mouseX = 0;
    this.mouseY = 0;
    this.clickX = null; // last click position, canvas coordinates
    this.clickY = null;
    this.clicked = false;
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.key.toLowerCase());
      this.keys.add(event.key.toLowerCase());
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key.toLowerCase());
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });

    canvas.addEventListener('mousemove', (event) => {
      const p = this.toCanvas(event.clientX, event.clientY);
      this.mouseX = p.x;
      this.mouseY = p.y;
    });
    canvas.addEventListener('mousedown', (event) => {
      const p = this.toCanvas(event.clientX, event.clientY);
      this.mouseX = p.x;
      this.mouseY = p.y;
      this.clickX = p.x;
      this.clickY = p.y;
      this.clicked = true;
    });
  }

  toCanvas(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((clientY - rect.top) / rect.height) * this.canvas.height,
    };
  }

  down(key) {
    return this.keys.has(key.toLowerCase());
  }

  wasPressed(key) {
    return this.pressed.has(key.toLowerCase());
  }

  // Steering: WASD or arrow keys, normalised so diagonals are not faster.
  steerVector() {
    let x = 0;
    let y = 0;
    if (this.down('a') || this.down('arrowleft')) x -= 1;
    if (this.down('d') || this.down('arrowright')) x += 1;
    if (this.down('w') || this.down('arrowup')) y -= 1;
    if (this.down('s') || this.down('arrowdown')) y += 1;
    const len = Math.hypot(x, y);
    if (len > 0) {
      x /= len;
      y /= len;
    }
    return { x, y, active: len > 0 };
  }

  get sprinting() {
    return this.down('shift');
  }

  get hopPressed() {
    return this.wasPressed(' ');
  }

  get confirmPressed() {
    return this.wasPressed('enter') || this.wasPressed(' ');
  }

  takeClick() {
    if (!this.clicked) return null;
    this.clicked = false;
    const point = { x: this.clickX, y: this.clickY };
    this.clickX = null;
    this.clickY = null;
    return point;
  }

  endFrame() {
    this.pressed.clear();
  }
}

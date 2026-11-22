// Keyboard + mouse input: one job only. Tracks held keys, edge-triggered
// presses, and the last mouse click in world coordinates.
export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let click = null;
  let mouse = { x: 0, y: 0 };

  function code(e) {
    return e.code;
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!e.repeat) pressed.add(e.code);
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse = { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  });
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    click = { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  });

  return {
    down(...codes) {
      return codes.some((c) => keys.has(c));
    },
    wasPressed(...codes) {
      return codes.some((c) => pressed.has(c));
    },
    takeClick() {
      const c = click;
      click = null;
      return c;
    },
    mouse() {
      return mouse;
    },
    endFrame() {
      pressed.clear();
    },
  };
}

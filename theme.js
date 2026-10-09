'use strict';

// Load after game.js and sound.js.
// Button appearance adapted from Uiverse.io by Yaseen549.

(() => {
  if (window.HopperTheme || typeof drawGame !== 'function') return;

  const root = document.documentElement;
  const key = 'delivery-hopper-theme-v1';

  let night = false;

  try {
    night = localStorage.getItem(key) === 'dark';
  } catch {
    // Use daylight when storage is unavailable.
  }

  // Apply the red button design to all existing and future buttons.
  const style = document.createElement('style');

  style.textContent = `
    body button {
      position: relative;
      isolation: isolate;
      color: #fff !important;
      background:
        linear-gradient(to top, #0003, transparent),
        #ef4444 !important;
      border: 1px solid #ff7777 !important;
      border-radius: 16px !important;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .5px;
      box-shadow:
        0 8px 0 #b91c1c,
        0 15px 25px -10px #ef4444cc !important;
      margin-bottom: 8px;
      transition: transform .1s, box-shadow .1s, filter .1s;
    }

    body button::before {
      content: '';
      position: absolute;
      top: 7px;
      left: 12px;
      width: 24px;
      height: 10px;
      background: #ffffff66;
      border-radius: 50%;
      filter: blur(2px);
      pointer-events: none;
    }

    body button:hover:not(:disabled) {
      filter: brightness(1.09);
    }

    body button:active:not(:disabled) {
      transform: translateY(8px);
      box-shadow:
        0 0 0 #b91c1c,
        0 5px 12px #ef444455 !important;
    }

    body button:focus-visible {
      outline: 3px solid #ff9595;
      outline-offset: 5px;
    }

    body button:disabled {
      opacity: .5;
      filter: saturate(.4);
      box-shadow: 0 5px 0 #953333 !important;
    }

    body button.selected {
      outline: 3px solid var(--ink);
      outline-offset: 3px;
    }

    body button.selected:focus-visible {
      outline: 3px solid #ff9595;
      outline-offset: 7px;
    }

    body button small {
      color: #fff !important;
      opacity: .9;
    }

    .menu-links {
      flex-wrap: wrap;
      gap: 12px;
    }

    .menu-links button {
      padding: 12px 14px;
      margin-right: 0;
    }

    .choices {
      gap: 14px;
    }

    .controls button {
      background: #ef4444 !important;
    }

    .controls > div {
      gap: 10px;
    }

    .controls > button {
      margin-bottom: 13px;
    }

    .mixer-previews {
      gap: 14px;
    }

    .mixer-actions {
      gap: 12px;
    }

    .site-header {
      flex-wrap: wrap;
    }

    #theme-toggle {
      font-size: 12px;
      padding: 9px 12px;
      white-space: nowrap;
    }

    html[data-theme="dark"] {
      color-scheme: dark;
      --ink: #e6edf8;
      --muted: #aebed1;
      --paper: #101827;
      --green: #203a3d;
      --yellow: #ffd36b;
      --line: #34445c;
    }

    html[data-theme="dark"] .wallet,
    html[data-theme="dark"] .mission,
    html[data-theme="dark"] .upgrade-card,
    html[data-theme="dark"] .help-grid article {
      background: #1e2c40;
    }

    html[data-theme="dark"] .menu-art {
      background: #182b38;
      border-color: #34445c;
    }

    html[data-theme="dark"] .art-label {
      color: #d7e5f9;
    }

    html[data-theme="dark"] .art-note,
    html[data-theme="dark"] .controls {
      background: #152237f5;
    }

    html[data-theme="dark"] .overlay {
      background: #101827f2;
    }

    html[data-theme="dark"] .canvas-wrap {
      background: #182d35;
    }

    html[data-theme="dark"] .brand-icon {
      background: #263951;
    }

    html[data-theme="dark"] .hopper-mixer {
      background: #152237;
      color: var(--ink);
      border-color: var(--line);
    }

    html[data-theme="dark"] .hopper-mixer p {
      color: var(--muted);
    }

    html[data-theme="dark"] .hopper-volume input {
      accent-color: #ff7070;
    }

    html[data-theme="dark"] .warning {
      background: #49361b;
      color: #ffe2a3;
    }

    @media (prefers-reduced-motion: reduce) {
      body button {
        transition: none;
      }
    }
  `;

  document.head.append(style);

  const toggleButton = document.createElement('button');
  toggleButton.id = 'theme-toggle';
  toggleButton.type = 'button';

  document.querySelector('.site-header').append(toggleButton);

  // Midnight colors for scenery and vehicles.
  const palette = {
    '#b4ce8a': '#182d35',
    '#b9d590': '#1c333c',
    '#afcc82': '#182d35',
    '#dce8bb': '#182b38',
    '#dce9b3': '#20363f',
    '#c4d29c': '#344a57',
    '#62716b': '#1b283b',
    '#53665e': '#101c2d',
    '#bcc3ab': '#69778a',
    '#6b7a6b': '#1b283b',
    '#c6d2a7': '#344b58',
    '#d5dac1': '#8390a4',
    '#8fac6d': '#36514b',
    '#f1eac1': '#75816c',
    '#c0d39f': '#36504b',
    '#d8d6bd': '#344455',
    '#efebd4': '#536174',
    '#bdbfaa': '#233344',
    '#bfc5a1': '#283d47',
    '#8d9381': '#283443',
    '#665f50': '#171f2d',
    '#d7ddd2': '#8190a2',
    '#f3e7bf': '#39495b',
    '#c9d8bd': '#314852',
    '#9fc5bc': '#ffda88',
    '#aed3d5': '#e8c681',
    '#a5c7bd': '#7596b7',
    '#365853': '#152737',
    '#406b5b': '#223547',
    '#7e887a': '#5b6d80',
    '#40544e': '#8c9cad',
    '#f0bd52': '#b58b46',
    '#e48673': '#bd685b',
    '#79b5c4': '#528697',
    '#f4f1de': '#a3a9b9',
    '#eab754': '#b58b46',
    '#ea917b': '#bd685b',
    '#467d9b': '#31536f',
    '#e9bd4f': '#aa8441',
    '#f1df98': '#665939',
    '#8d9f6a': '#53634b',
    '#f8f6efee': '#17263fee'
  };

  const originalRect = rect;

  rect = function(c, x, y, w, h, color, radius = 0) {
    originalRect(
      c, x, y, w, h,
      night ? palette[color] || color : color,
      radius
    );
  };

  // Queue lights so later scenery cannot paint over them.
  let lights = null;

  function addLight(c, paint) {
    if (!night) return;

    if (lights) {
      lights.push({
        c,
        transform: c.getTransform(),
        paint
      });
    } else {
      c.save();
      paint(c);
      c.restore();
    }
  }

  function flushLights(c) {
    if (!lights) return;

    const pending = lights.filter(light => light.c === c);
    lights = lights.filter(light => light.c !== c);

    for (const light of pending) {
      c.save();
      c.setTransform(light.transform);
      light.paint(c);
      c.restore();
    }
  }

  // Soft circular or oval glow.
  function glow(
    c, x, y, rx, ry,
    color = '255,218,135',
    strength = .5
  ) {
    c.save();
    c.globalCompositeOperation = 'screen';
    c.translate(x, y);
    c.scale(rx, ry);

    const gradient = c.createRadialGradient(0, 0, 0, 0, 0, 1);

    gradient.addColorStop(0, `rgba(${color},${strength})`);
    gradient.addColorStop(.35, `rgba(${color},${strength * .35})`);
    gradient.addColorStop(1, `rgba(${color},0)`);

    c.fillStyle = gradient;
    c.beginPath();
    c.arc(0, 0, 1, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // Directional headlight beam.
  function beam(c, x, y, direction, length = 115) {
    c.save();
    c.globalCompositeOperation = 'screen';

    const gradient = c.createLinearGradient(
      x, y,
      x + direction * length, y
    );

    gradient.addColorStop(0, '#fff3b875');
    gradient.addColorStop(1, '#fff3b800');

    c.fillStyle = gradient;
    c.beginPath();
    c.moveTo(x, y - 3);
    c.lineTo(x + direction * length, y - 25);
    c.lineTo(x + direction * length, y + 25);
    c.lineTo(x, y + 3);
    c.closePath();
    c.fill();

    glow(c, x, y, 19, 14, '255,244,190', .8);
    c.restore();
  }

  function vehicleLights(c, front, rear, y, direction, length) {
    addLight(c, c => {
      for (const offset of [21, 43]) {
        beam(c, front, y + offset, direction, length);

        originalRect(
          c, front - 2, y + offset - 3,
          4, 6, '#fff9d7', 2
        );

        glow(c, rear, y + offset, 14, 12, '255,65,72', .65);

        originalRect(
          c, rear - 2, y + offset - 3,
          4, 6, '#ff525b', 2
        );
      }
    });
  }

  // Car headlights and rear lights.
  const originalCar = carArt;

  carArt = function(c, car, y, direction) {
    originalCar(c, car, y, direction);

    if (
      car.x > c.canvas.width + 180 ||
      car.x + car.width < -180
    ) {
      return;
    }

    vehicleLights(
      c,
      direction === 1 ? car.x + car.width - 2 : car.x + 2,
      direction === 1 ? car.x + 2 : car.x + car.width - 2,
      y,
      direction,
      115
    );
  };

  // Streetlight bulb and illuminated sidewalk.
  const originalLamp = streetlight;

  streetlight = function(c, x, y) {
    originalLamp(c, x, y);

    addLight(c, c => {
      glow(c, x + 14, y - 13, 34, 34, '255,222,145', .8);
      glow(c, x + 14, y + 24, 52, 24, '255,220,145', .5);

      originalRect(
        c, x + 10, y - 15,
        9, 4, '#fff7d6', 2
      );
    });
  };

  // House windows and porch light.
  const originalHouse = house;

  house = function(c, x, y, active, delivered) {
    originalHouse(c, x, y, active, delivered);

    if (!night) return;

    c.save();
    c.fillStyle = active ? '#704e53' : '#344663';
    c.beginPath();
    c.moveTo(x - 30, y - 15);
    c.lineTo(x, y - 37);
    c.lineTo(x + 30, y - 15);
    c.closePath();
    c.fill();
    c.restore();

    addLight(c, c => {
      for (const offset of [-15, 16]) {
        glow(c, x + offset, y - 1, 22, 22, '255,204,112', .6);

        originalRect(
          c, x + offset - 5, y - 7,
          10, 12, '#ffe7a4', 2
        );

        originalRect(
          c, x + offset - .5, y - 7,
          1, 12, '#a78554'
        );

        originalRect(
          c, x + offset - 5, y - 1,
          10, 1, '#a78554'
        );
      }

      glow(c, x, y + 7, 15, 15, '255,219,145', .6);
      glow(c, x, y + 28, 34, 13, '255,210,125', .4);

      originalRect(c, x - 2, y - 1, 4, 4, '#fff2bd', 2);
    });
  };

  // Railway signals, train headlights, and carriage windows.
  const originalRail = railwayArt;

  railwayArt = function(c, row, y) {
    originalRail(c, row, y);

    if (!night) return;

    const train = row.train;
    const danger = train.phase !== 'cooldown';
    const color = danger ? '255,70,75' : '120,255,169';

    const strength =
      danger && Math.floor(run.elapsed * 6) % 2 ? .2 : .7;

    addLight(c, c => {
      for (const x of [17, c.canvas.width - 17]) {
        glow(c, x, y + 8, 22, 22, color, strength);
        glow(c, x, y + 56, 22, 22, color, strength);
      }
    });

    if (train.phase !== 'passing') return;

    vehicleLights(
      c,
      train.direction === 1
        ? train.x + train.width - 4
        : train.x + 4,
      train.direction === 1
        ? train.x + 4
        : train.x + train.width - 4,
      y,
      train.direction,
      180
    );

    for (let i = 0; i < SETTINGS.trainCars; i++) {
      const x = train.x + i * (SETTINGS.trainCarLength + 8);

      if (
        x > c.canvas.width ||
        x + SETTINGS.trainCarLength < 0
      ) {
        continue;
      }

      addLight(c, c => {
        for (
          let w = x + 14;
          w < x + SETTINGS.trainCarLength - 16;
          w += 26
        ) {
          glow(c, w + 9, y + 31, 19, 22, '255,212,130', .35);
        }
      });
    }
  };

  // Darker tree foliage.
  const originalTree = tree;

  tree = function(c, x, y, scale = 1) {
    if (!night) return originalTree(c, x, y, scale);

    c.save();
    c.translate(x, y);
    c.scale(scale, scale);

    originalRect(c, -4, 0, 8, 25, '#5f5a50', 2);

    const foliage = [
      [0, -14, 24, '#29494a'],
      [-13, -5, 18, '#29494a'],
      [13, -5, 20, '#203c40'],
      [-8, -20, 15, '#345a55']
    ];

    for (const [tx, ty, radius, color] of foliage) {
      c.fillStyle = color;
      c.beginPath();
      c.arc(tx, ty, radius, 0, Math.PI * 2);
      c.fill();
    }

    c.restore();
  };

  // Draw lights beneath the bulldog and delivery message.
  const originalCourier = courier;

  courier = function(c, ...args) {
    flushLights(c);
    originalCourier(c, ...args);
  };

  function render(original, c, args) {
    const previous = lights;
    lights = night ? [] : null;

    try {
      original(...args);
      flushLights(c);
    } finally {
      lights = previous;
    }
  }

  const originalGame = drawGame;

  drawGame = function(...args) {
    render(originalGame, ctx, args);

    if (night && run && run.toast > 0) {
      ctx.save();
      ctx.fillStyle = '#f5e6c0';
      ctx.textAlign = 'center';
      ctx.font = 'bold 16px Arial';

      ctx.fillText(
        `DELIVERED! +${SETTINGS.deliveryCoins} COINS`,
        288, 53
      );

      ctx.restore();
    }
  };

  const originalMenu = drawMenu;

  drawMenu = function(...args) {
    const c = document.getElementById('scene').getContext('2d');
    render(originalMenu, c, args);
  };

  const originalPreview = drawPreview;

  drawPreview = function(...args) {
    const c = document.getElementById('preview').getContext('2d');

    if (!night) return originalPreview(...args);

    c.save();
    c.clearRect(0, 0, 300, 300);

    originalRect(c, 0, 0, 300, 300, '#20363f');

    c.strokeStyle = '#344a57';
    c.lineWidth = 1;

    for (let i = 0; i < 300; i += 50) {
      c.beginPath();
      c.moveTo(i, 0);
      c.lineTo(i, 300);
      c.moveTo(0, i);
      c.lineTo(300, i);
      c.stroke();
    }

    courier(c, 150, 175, 3, wardrobe);
    c.restore();
  };

  // Keep railway warnings readable in both themes.
  const originalRailStatus = updateRailStatus;

  updateRailStatus = function(...args) {
    originalRailStatus(...args);

    if (night) {
      const status = document.getElementById('rail-status');

      status.style.color = status.textContent.includes('RED')
        ? '#ff9494'
        : '#9edbb5';
    }
  };

  function setTheme(theme, save = true) {
    night = theme === 'dark';
    root.dataset.theme = night ? 'dark' : 'light';

    toggleButton.textContent = night ? '☀ Day mode' : '☾ Dark mode';
    toggleButton.setAttribute('aria-label', 'Dark mode');
    toggleButton.setAttribute('aria-pressed', String(night));

    const meta = document.querySelector('meta[name="theme-color"]');

    if (meta) {
      meta.content = night ? '#101827' : '#172e2a';
    }

    if (save) {
      try {
        localStorage.setItem(key, root.dataset.theme);
      } catch {
        // The theme still works for this session.
      }
    }

    drawMenu();

    if (typeof wardrobe !== 'undefined' && wardrobe) {
      drawPreview();
    }

    if (typeof run !== 'undefined' && run) {
      updateRailStatus();
      drawGame();
    }
  }

  function toggle() {
    setTheme(night ? 'light' : 'dark');
  }

  toggleButton.addEventListener('click', toggle);

  window.HopperTheme = {
    setTheme,
    toggle,
    status: () => ({
      theme: night ? 'dark' : 'light',
      night
    })
  };

  setTheme(night ? 'dark' : 'light', false);
})();
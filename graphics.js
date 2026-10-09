'use strict';

// Original neighborhood artwork. No image downloads required.
(() => {
  const TAU = Math.PI * 2;

  function box(c, x, y, w, h, color, radius = 0) {
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(x, y, w, h, radius);
    c.fill();
  }

  function oval(c, x, y, rx, ry, color) {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, TAU);
    c.fill();
  }

  function poly(c, points, color) {
    c.fillStyle = color;
    c.beginPath();

    points.forEach(([x, y], i) => {
      if (i) c.lineTo(x, y);
      else c.moveTo(x, y);
    });

    c.closePath();
    c.fill();
  }

  function gradient(c, x, y, radius, light, dark) {
    const g = c.createRadialGradient(
      x - radius * .35,
      y - radius * .4,
      1,
      x, y, radius
    );

    g.addColorStop(0, light);
    g.addColorStop(1, dark);
    return g;
  }

  function glow(c, x, y, rx, ry, strength = .5) {
    c.save();
    c.translate(x, y);
    c.scale(rx, ry);
    c.globalCompositeOperation = 'screen';

    const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);

    g.addColorStop(0, `rgba(255,214,130,${strength})`);
    g.addColorStop(.4, `rgba(255,204,105,${strength * .3})`);
    g.addColorStop(1, 'rgba(255,204,105,0)');

    oval(c, 0, 0, 1, 1, g);
    c.restore();
  }

  function planter(c, x, y, night) {
    box(c, x - 5, y - 4, 10, 7, night ? '#885e4b' : '#c98768', 2);
    box(c, x - 6, y - 5, 12, 3, night ? '#b17c5b' : '#dea780', 1);

    for (const [dx, dy, size] of [
      [-3, -8, 3],
      [2, -10, 4],
      [5, -7, 2]
    ]) {
      oval(
        c, x + dx, y + dy,
        size, size + 1,
        night ? '#446f5e' : '#6b986c'
      );
    }

    for (const dx of [-3, 2, 5]) {
      oval(c, x + dx, y - 10, 1.3, 1.3, '#ecc580');
    }
  }

  function house(c, x, y, active, delivered, night = false) {
    c.save();
    c.translate(x, y);

    oval(c, 4, 26, 33, 8, night ? '#0000004a' : '#58433225');
    box(c, -27, 22, 55, 5, night ? '#56606a' : '#b5aa98', 2);

    poly(
      c,
      [[21, -20], [28, -25], [28, 21], [21, 26]],
      night ? '#536064' : '#c6b59d'
    );

    const wall = c.createLinearGradient(-25, -18, 23, 25);
    wall.addColorStop(0, night ? '#78817b' : '#fff0ca');
    wall.addColorStop(
      1,
      night ? '#495760' : delivered ? '#c6d4b7' : '#dfc6a1'
    );

    box(c, -25, -19, 47, 44, wall, 2);

    c.strokeStyle = night ? '#bdc6bb19' : '#99714d20';
    c.lineWidth = .6;

    for (let v = -12; v < 23; v += 7) {
      c.beginPath();
      c.moveTo(-24, v);
      c.lineTo(21, v);
      c.stroke();
    }

    // Chimney and roof.
    box(c, 11, -43, 7, 20, night ? '#665651' : '#b77a5c', 1);
    box(c, 9, -45, 11, 4, night ? '#897369' : '#dba486', 1);

    poly(
      c,
      [
        [-29, -18], [-2, -42], [4, -42],
        [28, -18], [28, -14], [-29, -14]
      ],
      night ? '#392e35' : '#815947'
    );

    const roof = c.createLinearGradient(-17, -40, 15, -15);
    roof.addColorStop(
      0,
      night ? '#a47668' : active ? '#e29b75' : '#be9b76'
    );
    roof.addColorStop(
      1,
      night ? '#684752' : active ? '#b66a4f' : '#8c725b'
    );

    poly(c, [[-29, -18], [1, -43], [29, -18]], roof);

    c.save();
    c.beginPath();
    c.moveTo(-29, -18);
    c.lineTo(1, -43);
    c.lineTo(29, -18);
    c.clip();

    c.strokeStyle = night ? '#ffcfab35' : '#ffddbc88';
    c.lineWidth = .8;

    for (let v = -37; v <= -18; v += 5) {
      c.beginPath();
      c.moveTo(-30, v);
      c.lineTo(30, v);
      c.stroke();

      for (let h = -26 + (v % 2) * 4; h < 30; h += 9) {
        c.beginPath();
        c.moveTo(h, v);
        c.lineTo(h + 1, v + 4);
        c.stroke();
      }
    }

    c.restore();

    box(c, -29, -19, 58, 4, night ? '#ba9478' : '#f2c895', 1);

    // Windows and shutters.
    for (const wx of [-17, 15]) {
      box(c, wx - 7, -9, 14, 16, night ? '#534936' : '#9e8468', 2);
      box(c, wx - 5, -7, 10, 12, night ? '#ffdf97' : '#a8c9cd', 1);
      box(c, wx - .5, -7, 1, 12, '#f1dab0');
      box(c, wx - 5, -2, 10, 1, '#f1dab0');

      for (const side of [-1, 1]) {
        box(
          c, wx + side * 8 - 2, -8,
          4, 14, night ? '#50706b' : '#6c9d87', 1
        );

        for (let sy = -5; sy < 5; sy += 3) {
          box(c, wx + side * 8 - 1.5, sy, 3, .7, '#ffffff33');
        }
      }

      box(c, wx - 8, 7, 16, 2, night ? '#b39776' : '#efdab4', 1);

      if (night) glow(c, wx, -1, 18, 19, .45);
    }

    // Door, porch step and lamp.
    box(c, -7, 0, 14, 26, night ? '#302b30' : '#a18262', [7, 7, 0, 0]);
    box(c, -5, 2, 10, 23, night ? '#345954' : '#4f8472', [5, 5, 0, 0]);
    box(c, -3, 5, 6, 8, night ? '#ebc884' : '#b8d2c6', 2);
    box(c, -3, 17, 6, 6, '#ffffff15', 1);
    oval(c, 3, 16, 1, 1, '#e9bc68');

    box(c, -9, 24, 18, 3, night ? '#929080' : '#ddd1b8', 1);
    box(c, -3, -5, 6, 4, '#413d36', 1);
    box(c, -2, -4, 4, 2, '#ffe8a4', 1);

    if (night) {
      glow(c, 0, -2, 14, 14, .55);
      glow(c, 0, 27, 29, 12, .3);
    }

    planter(c, -18, 22, night);
    planter(c, 18, 22, night);

    // Delivery marker.
    if (active) {
      oval(c, 1, -53, 13, 13, '#493b2f25');

      oval(
        c, 0, -55, 12, 12,
        gradient(c, 0, -55, 13, '#fff2af', '#ecae45')
      );

      poly(c, [[-5, -44], [0, -37], [5, -44]], '#edb34c');
      box(c, -5, -59, 10, 8, '#aa703c', 1);
      box(c, -1, -59, 2, 8, '#ffe7a1');

      if (night) glow(c, 0, -55, 22, 22, .35);
    }

    c.restore();
  }

  function tree(c, x, y, scale = 1, night = false) {
    c.save();
    c.translate(x, y);
    c.scale(scale, scale);

    oval(c, 5, 24, 27, 8, night ? '#00000045' : '#54604423');

    const bark = c.createLinearGradient(-5, 0, 6, 0);
    bark.addColorStop(0, night ? '#927766' : '#b79370');
    bark.addColorStop(1, night ? '#534e49' : '#77684f');

    poly(
      c,
      [[-5, 24], [-4, -4], [3, -4], [5, 24], [10, 26], [-10, 26]],
      bark
    );

    c.strokeStyle = '#e3c39d66';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-2, 21);
    c.lineTo(-1, 0);
    c.stroke();

    const crowns = [
      [0, -14, 24], [-14, -7, 18], [14, -8, 19],
      [-7, -25, 16], [8, -22, 17], [0, -5, 21]
    ];

    for (const [tx, ty, radius] of crowns) {
      oval(
        c, tx, ty, radius, radius * .83,
        gradient(
          c, tx, ty, radius,
          night ? '#60877b' : '#c1cf91',
          night ? '#233f43' : '#628762'
        )
      );
    }

    for (let i = 0; i < 15; i++) {
      const tx = Math.sin(i * 2.4) * (10 + i % 8);
      const ty = -28 + (i * 7 % 28);

      oval(c, tx, ty, 2.5, 1.4, night ? '#bdd3a916' : '#f1f0bd40');
    }

    oval(c, -8, -26, 7, 3, night ? '#a4c5a218' : '#f6f2c02d');
    c.restore();
  }

  function streetlight(c, x, y, night = false) {
    c.save();
    c.translate(x, y);

    oval(c, 5, 26, 18, 5, night ? '#00000040' : '#53463426');
    box(c, -8, 22, 16, 6, night ? '#3c5157' : '#697e76', 3);
    box(c, -5, 18, 10, 7, night ? '#496166' : '#7a8e81', 2);

    const metal = c.createLinearGradient(-3, 0, 4, 0);
    metal.addColorStop(0, '#92a697');
    metal.addColorStop(.35, '#53746d');
    metal.addColorStop(1, '#294f50');

    box(c, -3, -15, 6, 38, metal, 2);

    c.strokeStyle = night ? '#6a8a86' : '#4c7165';
    c.lineWidth = 4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, -12);
    c.bezierCurveTo(0, -27, 14, -27, 14, -15);
    c.stroke();

    poly(
      c,
      [[7, -16], [21, -16], [18, -9], [10, -9]],
      night ? '#ffe9ac' : '#e2c98b'
    );

    box(c, 7, -18, 14, 3, night ? '#719086' : '#638979', 2);
    box(c, 10, -9, 8, 2, '#638173', 1);

    if (night) {
      glow(c, 14, -13, 31, 31, .7);
      glow(c, 14, 25, 43, 20, .45);
    } else {
      oval(c, 12, -13, 2, 2.5, '#fff4ce');
    }

    c.restore();
  }

  window.HopperProps = { house, tree, streetlight };
})();

// Cars and trains.
(() => {
  function box(c, x, y, w, h, color, r = 2) {
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fill();
  }

  function oval(c, x, y, rx, ry, color) {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  }

  function shape(c, points, color) {
    c.fillStyle = color;
    c.beginPath();

    points.forEach(([x, y], i) => {
      if (i) c.lineTo(x, y);
      else c.moveTo(x, y);
    });

    c.closePath();
    c.fill();
  }

  function shade(hex, factor) {
    let full = hex.replace('#', '');

    if (full.length === 3) {
      full = [...full].map(n => n + n).join('');
    }

    const rgb = full.match(/../g).map(n => parseInt(n, 16));

    return `rgb(${rgb.map(n =>
      Math.min(255, Math.round(n * factor))
    ).join(',')})`;
  }

  function gradient(c, y, h, top, bottom) {
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    return g;
  }

  function glow(c, x, y, radius, color, alpha) {
    c.save();
    c.globalCompositeOperation = 'screen';

    const g = c.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(${color},${alpha})`);
    g.addColorStop(1, `rgba(${color},0)`);

    oval(c, x, y, radius, radius, g);
    c.restore();
  }

  function headlight(c, x, y, direction, length = 100) {
    c.save();
    c.globalCompositeOperation = 'screen';

    const g = c.createLinearGradient(
      x, y, x + direction * length, y
    );

    g.addColorStop(0, '#fff2be65');
    g.addColorStop(1, '#fff2be00');

    shape(
      c,
      [
        [x, y - 2],
        [x + direction * length, y - 22],
        [x + direction * length, y + 22],
        [x, y + 2]
      ],
      g
    );

    glow(c, x, y, 20, '255,225,163', .8);
    c.restore();
  }

  function wheel(c, x, y, r = 8) {
    oval(c, x + 1, y + 1, r + 1, r, '#00000035');
    oval(c, x, y, r, r, '#303437');
    oval(c, x, y, r - 2, r - 2, '#171d24');
    oval(c, x, y, r - 3.5, r - 3.5, '#aab1ac');
    oval(c, x, y, 1.8, 1.8, '#555f65');

    c.strokeStyle = '#d5d9ce';
    c.lineWidth = .7;

    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;

      c.beginPath();
      c.moveTo(x + Math.cos(a) * 2, y + Math.sin(a) * 2);
      c.lineTo(
        x + Math.cos(a) * (r - 4),
        y + Math.sin(a) * (r - 4)
      );
      c.stroke();
    }
  }

  function car(c, vehicle, y, direction, night = false) {
    const w = vehicle.width;
    const x = vehicle.x;

    if (x > c.canvas.width + 120 || x + w < -120) return;

    c.save();
    c.translate(x, y);

    if (direction < 0) {
      c.translate(w, 0);
      c.scale(-1, 1);
    }

    const color = vehicle.color || '#efbd5c';
    const base = shade(color, night ? .7 : 1);

    oval(c, w * .51, 51, w * .51, 8, night ? '#00000070' : '#302c292d');

    if (night) {
      headlight(c, w - 1, 35, 1);
      glow(c, 2, 35, 13, '255,83,71', .55);
    }

    shape(
      c,
      [
        [w * .17, 28], [w * .26, 9],
        [w * .61, 9], [w * .76, 28]
      ],
      gradient(c, 9, 20, shade(color, night ? .95 : 1.18), base)
    );

    shape(
      c,
      [
        [w * .27, 12], [w * .44, 12],
        [w * .44, 26], [w * .20, 26]
      ],
      gradient(c, 12, 15, night ? '#748a98' : '#c6dbd8', '#6e939b')
    );

    shape(
      c,
      [
        [w * .47, 12], [w * .60, 12],
        [w * .70, 26], [w * .47, 26]
      ],
      gradient(c, 12, 15, night ? '#748a98' : '#c6dbd8', '#6e939b')
    );

    shape(
      c,
      [
        [w * .57, 13], [w * .60, 13],
        [w * .68, 24], [w * .64, 24]
      ],
      '#edf5e765'
    );

    c.fillStyle = gradient(
      c, 27, 21,
      shade(color, night ? .9 : 1.13),
      shade(color, night ? .55 : .82)
    );

    c.beginPath();
    c.moveTo(4, 27);
    c.lineTo(w - 14, 27);
    c.quadraticCurveTo(w - 1, 28, w - 1, 36);
    c.lineTo(w - 2, 46);
    c.quadraticCurveTo(w * .5, 49, 3, 46);
    c.quadraticCurveTo(0, 38, 4, 27);
    c.fill();

    box(c, 5, 28, w - 13, 2, '#ffffff42');
    box(c, 7, 44, w - 14, 3, '#66574744');

    c.strokeStyle = shade(color, night ? .44 : .69);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(w * .46, 28);
    c.lineTo(w * .46, 44);
    c.moveTo(w * .72, 29);
    c.lineTo(w * .70, 44);
    c.stroke();

    box(c, w * .51, 31, 7, 2, '#d4d2b9');
    box(c, w * .70, 25, 7, 4, shade(color, .7));
    box(c, 1, 32, 3, 8, night ? '#ff6d52' : '#a85649');
    box(c, w - 5, 31, 4, 9, night ? '#fff4c0' : '#f2e7c8');
    box(c, w - 4, 41, 5, 4, '#c9cbc0');
    box(c, -1, 42, 6, 3, '#c9cbc0');

    wheel(c, w * .21, 47, 8);
    wheel(c, w * .79, 47, 8);

    c.restore();
  }

  function train(c, row, y, night = false) {
    const t = row.train;

    if (!t || t.phase !== 'passing') return;

    const count = SETTINGS.trainCars;
    const width = SETTINGS.trainCarLength;

    c.save();
    c.translate(0, y);

    const front = t.direction > 0 ? t.x + t.width - 2 : t.x + 2;
    const rear = t.direction > 0 ? t.x + 2 : t.x + t.width - 2;

    if (night) {
      headlight(c, front, 33, t.direction, 160);
      glow(c, rear, 35, 16, '255,76,71', .6);
    }

    for (let i = 0; i < count; i++) {
      const x = t.x + i * (width + 8);

      if (x > c.canvas.width + 30 || x + width < -30) continue;

      const engine = t.direction > 0 ? i === count - 1 : i === 0;

      const body = engine
        ? night ? '#ac874a' : '#edbe60'
        : night ? '#315b6d' : '#6f9ea6';

      oval(c, x + width / 2, 52, width / 2 + 3, 8, '#00000035');

      if (i < count - 1) {
        box(c, x + width - 1, 36, 10, 6, '#343b3c');
      }

      box(
        c, x + 3, 11, width - 6, 35,
        gradient(c, 11, 36, body, engine ? '#9d7643' : '#335c68'),
        6
      );

      shape(
        c,
        [
          [x + 3, 16], [x + 10, 6],
          [x + width - 11, 6], [x + width - 3, 16]
        ],
        gradient(c, 6, 10, night ? '#87919a' : '#dde0d5', '#8dabae')
      );

      box(c, x + 4, 37, width - 8, 5, engine ? '#f7dda1' : '#c9d5c8');

      for (let j = 0; j < 4; j++) {
        const wx = x + 12 + j * 26;

        box(c, wx - 1, 19, 20, 17, '#304d58', 3);

        box(
          c, wx, 20, 18, 14,
          gradient(
            c, 20, 14,
            night ? '#ffe4a5' : '#d3e1dd',
            night ? '#c8924f' : '#85aeb7'
          ),
          2
        );

        shape(
          c,
          [[wx + 3, 21], [wx + 8, 21], [wx + 15, 32], [wx + 10, 32]],
          '#ffffff40'
        );

        if (night) glow(c, wx + 9, 27, 19, '255,210,135', .18);
      }

      box(c, x + 8, 43, width - 16, 5, '#28363d');

      wheel(c, x + 20, 49, 6);
      wheel(c, x + 33, 49, 6);
      wheel(c, x + width - 33, 49, 6);
      wheel(c, x + width - 20, 49, 6);

      if (engine) {
        const hx = t.direction > 0 ? x + width - 5 : x + 1;

        box(c, hx, 24, 4, 6, night ? '#fff7d0' : '#f3e7c7');
        box(c, hx, 35, 4, 5, night ? '#fff7d0' : '#f3e7c7');
      }
    }

    box(c, rear - 2, 35, 4, 5, night ? '#ff6255' : '#a44e42');
    c.restore();
  }

  window.HopperVehicles = { car, train };
})();

// High-resolution neighborhood rendering.
(() => {
  if (
    window.HopperVisuals ||
    !window.HopperProps ||
    !window.HopperVehicles
  ) {
    return;
  }

  const props = window.HopperProps;
  const vehicles = window.HopperVehicles;

  const textures = new Map();
  const sprites = new Map();
  const patterns = new WeakMap();
  const layers = new Map();
  const mascot = courier;

  let pixelRatio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));

  const isNight = () => document.documentElement.dataset.theme === 'dark';

  const style = document.createElement('style');

  style.textContent = `
    .cozy-detail {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: auto;
      pointer-events: none;
    }

    .canvas-wrap .overlay {
      z-index: 2;
    }

    .menu-art .art-note {
      z-index: 2;
    }

    .menu-art {
      background: #bdc9a7;
    }

    .preview-card {
      position: relative;
    }

    @media (max-width: 600px) {
      .art-label {
        background: #f8f6efdb;
        padding: 9px 12px;
        border-radius: 8px;
      }

      html[data-theme="dark"] .art-label {
        background: #17263fdb;
      }
    }
  `;

  document.head.append(style);

  function box(c, x, y, w, h, color, r = 0) {
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fill();
  }

  function oval(c, x, y, rx, ry, color) {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  }

  function surface(id) {
    const original = document.getElementById(id);
    let item = layers.get(id);

    if (!item) {
      const canvas = document.createElement('canvas');
      canvas.id = `${id}-detail`;
      canvas.className = 'cozy-detail';
      canvas.setAttribute('aria-hidden', 'true');

      original.parentElement.style.position = 'relative';
      original.after(canvas);

      item = {
        original,
        canvas,
        c: canvas.getContext('2d')
      };

      layers.set(id, item);
    }

    pixelRatio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));

    const w = Math.round(original.width * pixelRatio);
    const h = Math.round(original.height * pixelRatio);

    if (item.canvas.width !== w || item.canvas.height !== h) {
      item.canvas.width = w;
      item.canvas.height = h;
    }

    item.c.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    item.c.clearRect(0, 0, original.width, original.height);

    return item;
  }

  function present(item) {
    // Preserve the original logical canvas dimensions used by gameplay.
    const c = item.original.getContext('2d');

    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, item.original.width, item.original.height);

    c.drawImage(
      item.canvas,
      0, 0,
      item.original.width,
      item.original.height
    );

    c.restore();
  }

  function random(seed) {
    let value = seed >>> 0;

    return () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function material(c, type, night) {
    const key = `${type}-${night}`;

    if (!textures.has(key)) {
      const tile = document.createElement('canvas');
      tile.width = tile.height = 128;

      const t = tile.getContext('2d');
      const rand = random(type.length * 73 + (night ? 97 : 1));

      t.fillStyle = type === 'road'
        ? night ? '#293447' : '#9d8e80'
        : type === 'paving'
          ? night ? '#44515b' : '#d6c5a9'
          : night ? '#263e42' : '#b6c69b';

      t.fillRect(0, 0, 128, 128);

      for (let i = 0; i < 850; i++) {
        const x = rand() * 128;
        const y = rand() * 128;
        const size = rand() * 1.6 + .3;

        t.fillStyle = i % 2 ? '#ffffff18' : '#10212616';
        t.fillRect(x, y, size, size * .7);
      }

      if (type === 'grass') {
        for (let i = 0; i < 32; i++) {
          const x = rand() * 128;
          const y = rand() * 128;

          t.strokeStyle = night ? '#a4b89416' : '#5b845029';
          t.beginPath();
          t.moveTo(x, y);
          t.lineTo(x - 1, y - 3);
          t.moveTo(x, y);
          t.lineTo(x + 2, y - 4);
          t.stroke();
        }
      }

      textures.set(key, tile);
    }

    let cache = patterns.get(c);

    if (!cache) {
      cache = new Map();
      patterns.set(c, cache);
    }

    if (!cache.has(key)) {
      cache.set(key, c.createPattern(textures.get(key), 'repeat'));
    }

    return cache.get(key);
  }

  function fill(c, x, y, w, h, type, night) {
    box(c, x, y, w, h, material(c, type, night));
  }

  function sidewalk(c, x, y, w, h, night) {
    fill(c, x, y, w, h, 'paving', night);

    c.strokeStyle = night ? '#b7c8cf20' : '#f8ecd578';
    c.lineWidth = 1;

    for (let v = y + 1; v < y + h; v += 23) {
      c.beginPath();
      c.moveTo(x, v);
      c.lineTo(x + w, v);
      c.stroke();

      const offset = Math.floor((v - y) / 23) % 2 * 23;

      for (let u = x + offset; u < x + w; u += 46) {
        c.beginPath();
        c.moveTo(u, v);
        c.lineTo(u, Math.min(v + 23, y + h));
        c.stroke();
      }
    }

    box(c, x, y, w, 3, night ? '#65747b' : '#eee1c7');
    box(c, x, y + h - 4, w, 4, night ? '#243640' : '#aa9981');
  }

  function road(c, y, w, night) {
    fill(c, 0, y, w, 64, 'road', night);

    box(c, 0, y, w, 3, night ? '#182331' : '#7c7168');
    box(c, 0, y + 60, w, 4, night ? '#64717a' : '#c1b39d');

    for (let x = 16; x < w; x += 70) {
      if (x < 240 || x > 315) {
        box(c, x, y + 31, 29, 2, night ? '#99a4ab' : '#e7dbbf', 1);
      }
    }

    for (let dy = 8; dy < 59; dy += 11) {
      box(c, 260, y + dy, 52, 5, night ? '#aab0af' : '#e8dfca', 1);
    }

    box(c, 44, y + 53, 23, 6, night ? '#16222f' : '#5b5b54', 2);

    for (let x = 47; x < 64; x += 4) {
      box(c, x, y + 54, 1, 4, night ? '#87919b' : '#a89c89');
    }
  }

  function rail(c, row, y, night) {
    fill(c, 0, y, 576, 64, 'road', night);

    for (let x = 5; x < 576; x += 24) {
      box(c, x, y + 10, 12, 45, night ? '#1c2934' : '#796b59', 2);
    }

    for (const v of [19, 44]) {
      box(c, 0, y + v, 576, 5, night ? '#92a2ad' : '#bac2bd');
      box(c, 0, y + v, 576, 1, '#f4ecda88');
    }

    const danger = row.train.phase !== 'cooldown';

    for (const x of [14, 562]) {
      for (const v of [7, 57]) {
        box(c, x - 9, y + v - 5, 18, 10, night ? '#172830' : '#4c5d58', 4);

        const color = danger
          ? Math.floor(run.elapsed * 6) % 2 ? '#b25b50' : '#ff8872'
          : '#a8e8a7';

        oval(c, x, y + v, 4, 3, color);
      }
    }

    if (danger) {
      for (let x = 35; x < 545; x += 28) {
        box(c, x, y + 2, 14, 2, '#e7bb70');
      }
    }
  }

  function dog(c, x, y, scale, look, shield = false, hop = 0) {
    const key = `${look.shirt}-${look.hat}-${shield}`;

    if (!sprites.has(key)) {
      const canvas = document.createElement('canvas');
      canvas.width = 576;
      canvas.height = 672;

      const s = canvas.getContext('2d');
      s.scale(6, 6);
      mascot(s, 48, 75, 1, look, shield);

      s.globalCompositeOperation = 'source-atop';

      const sheen = s.createLinearGradient(15, 15, 80, 100);
      sheen.addColorStop(0, '#fff4ce38');
      sheen.addColorStop(.4, '#ffffff00');
      sheen.addColorStop(1, '#34251d30');

      s.fillStyle = sheen;
      s.fillRect(0, 0, 96, 112);

      if (sprites.size >= 16) {
        sprites.delete(sprites.keys().next().value);
      }

      sprites.set(key, canvas);
    }

    c.save();
    c.translate(x, y);
    c.scale(
      scale * (1 + hop * .025),
      scale * (1 - hop * .04)
    );

    c.drawImage(sprites.get(key), -48, -75, 96, 112);
    c.restore();
  }

  function atmosphere(c, w, h, night) {
    const vignette = c.createRadialGradient(
      w * .48, h * .46, w * .16,
      w * .5, h * .5, w * .85
    );

    vignette.addColorStop(0, '#00000000');
    vignette.addColorStop(1, night ? '#050d2548' : '#80634422');

    box(c, 0, 0, w, h, vignette);
  }

  drawGame = function() {
    if (!run) return;

    const item = surface('game');
    const c = item.c;
    const night = isNight();

    fill(c, 0, 0, 576, 640, 'grass', night);

    const objects = [];
    const visible = [];
    const sy = y => 640 - T - (y * T - run.camera);

    // Paint all ground before scenery.
    for (const row of run.rows.values()) {
      const y = sy(row.y);

      if (y < -120 || y > 704) continue;

      visible.push({ row, y });

      if (row.road) {
        road(c, y, 576, night);
      } else if (row.rail) {
        rail(c, row, y, night);
      } else if (row.sidewalk || row.checkpoint) {
        sidewalk(c, 0, y + 4, 576, 56, night);
      }

      if (row.checkpoint && row.y === run.target) {
        box(
          c,
          row.houseX * T + 5,
          y + 5,
          T - 10,
          T - 10,
          night ? '#efc86c32' : '#fff0b56b',
          10
        );
      }
    }

    for (const { row, y } of visible) {
      if (row.road) {
        for (const car of row.cars) {
          if (car.x > 736 || car.x + car.width < -160) continue;

          objects.push({
            depth: y + 49,
            paint: () => vehicles.car(c, car, y, row.direction, night)
          });
        }
      }

      if (row.rail) {
        objects.push({
          depth: y + 49,
          paint: () => vehicles.train(c, row, y, night)
        });
      }

      for (const obstacle of row.obstacles || []) {
        const x = (obstacle.x + .5) * T;

        objects.push({
          depth: y + 49,
          paint: () => obstacle.type === 'tree'
            ? props.tree(c, x, y + 27, .8, night)
            : props.streetlight(c, x, y + 24, night)
        });
      }

      if (row.checkpoint) {
        objects.push({
          depth: y + 51,
          paint: () => props.house(
            c,
            (row.houseX + .5) * T,
            y + 32,
            row.y === run.target,
            row.y < run.target,
            night
          )
        });
      }
    }

    const p = playerPosition();
    const groundY = 640 - T - (p.y - run.camera) + 32;

    oval(c, p.x + 3, groundY + 20, 21, 6, night ? '#00000055' : '#50453725');

    if (
      run.invincible <= 0 ||
      Math.floor(run.invincible * 12) % 2 === 0
    ) {
      objects.push({
        depth: groundY + 22,
        paint: () => dog(
          c, p.x, groundY - p.lift,
          1, run.look,
          run.shieldReady || run.invincible > 0,
          p.lift / 13
        )
      });
    }

    objects.sort((a, b) => a.depth - b.depth);

    for (const object of objects) object.paint();

    atmosphere(c, 576, 640, night);

    if (run.toast > 0) {
      box(c, 138, 24, 300, 46, night ? '#182b43ee' : '#fff4dfee', 12);

      c.fillStyle = night ? '#ffe2a1' : '#6d5139';
      c.textAlign = 'center';
      c.font = 'bold 16px Arial';

      c.fillText(
        `DELIVERED! +${SETTINGS.deliveryCoins} COINS`,
        288, 53
      );
    }

    present(item);
  };

  drawMenu = function() {
    const item = surface('scene');
    const c = item.c;
    const night = isNight();

    fill(c, 0, 0, 640, 680, 'grass', night);
    sidewalk(c, 0, 260, 640, 95, night);
    road(c, 355, 640, night);
    road(c, 419, 640, night);
    sidewalk(c, 0, 483, 640, 95, night);

    const shops = [
      [115, '#6f9d9c', 'COFFEE'],
      [310, '#cc9575', 'PARCELS'],
      [500, '#92aa82', 'FLOWERS']
    ];

    for (const [x, color, label] of shops) {
      c.save();
      c.translate(x, 204);
      c.scale(2.5, 2.5);

      props.house(c, 0, 0, false, false, night);
      box(c, -25, 1, 50, 8, night ? '#365263' : color, 1);

      for (let stripe = -25; stripe < 25; stripe += 10) {
        box(
          c, stripe, 1, 5, 8,
          night ? '#a4b5b56b' : '#fff2d3b0',
          1
        );
      }

      box(c, -18, -14, 36, 10, night ? '#203c45' : '#fff0c8', 2);

      c.fillStyle = night ? '#ffe5b0' : '#695841';
      c.font = 'bold 4px Arial';
      c.textAlign = 'center';
      c.fillText(label, 0, -7);

      c.restore();
    }

    props.tree(c, 35, 299, 1.3, night);
    props.streetlight(c, 596, 302, night);

    vehicles.car(c, { x: 83, width: 142, color: '#edc46b' }, 351, 1, night);
    vehicles.car(c, { x: 434, width: 115, color: '#bbcdaf' }, 416, -1, night);

    // Bench.
    oval(c, 131, 552, 43, 8, night ? '#00000033' : '#62574020');
    box(c, 101, 527, 5, 25, night ? '#465b60' : '#667a70', 2);
    box(c, 155, 527, 5, 25, night ? '#465b60' : '#667a70', 2);

    for (let i = 0; i < 3; i++) {
      box(c, 95, 515 + i * 5, 72, 4, night ? '#92715b' : '#b99067', 2);
    }

    box(c, 94, 532, 74, 7, night ? '#a58161' : '#d3aa78', 2);
    box(c, 104, 539, 4, 14, '#4d635e', 1);
    box(c, 153, 539, 4, 14, '#4d635e', 1);

    // Parcel box.
    oval(c, 424, 556, 20, 5, night ? '#00000033' : '#62574020');
    box(c, 421, 535, 6, 22, night ? '#5d6975' : '#657d81', 2);
    box(c, 408, 512, 33, 28, night ? '#38576a' : '#739ca5', 7);
    box(c, 413, 518, 23, 3, night ? '#101d2b' : '#395d6a', 1);
    box(c, 418, 527, 14, 7, night ? '#ffe5ac' : '#f3e3ba', 2);

    props.tree(c, 53, 583, 1.7, night);
    props.tree(c, 578, 604, 1.65, night);
    props.streetlight(c, 489, 545, night);

    oval(c, 315, 564, 54, 15, night ? '#00000044' : '#6f644222');

    dog(
      c, 315, 523, 2.2,
      { shirt: saved.shirt, hat: saved.hat },
      saved.shieldEquipped
    );

    for (let i = 0; i < 3; i++) {
      oval(c, 315, 603 + i * 17, 4, 2, night ? '#95a992' : '#788567');
    }

    atmosphere(c, 640, 680, night);
    present(item);
  };

  drawPreview = function() {
    const item = surface('preview');
    const c = item.c;
    const night = isNight();

    fill(c, 0, 0, 300, 300, 'grass', night);
    sidewalk(c, 18, 206, 264, 60, night);
    oval(c, 150, 222, 67, 15, night ? '#00000050' : '#5f57332a');

    dog(
      c, 150, 177, 3,
      wardrobe || { shirt: saved.shirt, hat: saved.hat },
      saved.shieldEquipped
    );

    atmosphere(c, 300, 300, night);
    present(item);
  };

  function redraw() {
    drawMenu();

    if (typeof wardrobe !== 'undefined' && wardrobe) {
      drawPreview();
    }

    if (run) drawGame();
  }

  window.HopperVisuals = {
    redraw,
    status: () => ({
      style: 'cozy',
      pixelRatio,
      cacheEntries: textures.size + sprites.size
    })
  };

  window.addEventListener('resize', redraw);
  redraw();
})();
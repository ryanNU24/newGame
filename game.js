'use strict';

// ============================================================
// SETTINGS
// Speeds are pixels per second. Times are seconds.
// ============================================================

const SETTINGS = Object.freeze({
  columns: 9,
  tile: 64,
  missionRows: 15,
  deliveryCoins: 10,
  hatPrice: 20,
  shieldPrice: 30,
  hopSeconds: 0.13,

  trafficSpeed: 85,
  speedPerDelivery: 8,
  maximumSpeed: 165,

  shieldSeconds: 1.8,
  rowsBehind: 12,
  rowsAhead: 18,

  // Railway settings.
  trainEvery: 12,
  trainOffset: 6,
  trainWarningSeconds: 2.2,
  trainSpeed: 340,
  trainMaximumSpeed: 480,
  trainSpeedPerDelivery: 12,
  trainCooldown: 5,
  trainCars: 4,
  trainCarLength: 128
});

const SHIRTS = {
  Tangerine: '#ee8250',
  Blueberry: '#0755ad',
  Mint: '#73ac83',
  Rose: '#d9859a'
};

const HATS = ['none', 'cap', 'helmet', 'beanie'];
const SAVE_KEY = 'delivery-hopper-v1';

const $ = id => document.getElementById(id);
const gameCanvas = $('game');
const ctx = gameCanvas.getContext('2d');
const T = SETTINGS.tile;

// Prevent the route panel from stretching the canvas container.
gameCanvas.parentElement.style.alignSelf = 'start';

let storageAvailable = true;
let screen = 'menu';
let run = null;
let wardrobe = null;
let lastFrame = 0;

// Add railway status without requiring changes to index.html.
const railStatus = document.createElement('div');
railStatus.id = 'rail-status';
railStatus.className = 'shield';
railStatus.setAttribute('role', 'status');
$('shield-status').after(railStatus);

// ============================================================
// SAVED PROGRESS
// ============================================================

function defaultSave() {
  return {
    coins: 0,
    best: 0,
    hats: [],
    hat: 'none',
    shirt: 'Blueberry',
    shieldOwned: false,
    shieldEquipped: false
  };
}

function validNumber(value) {
  return Number.isSafeInteger(value) && value >= 0
    ? value
    : 0;
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const s = raw ? JSON.parse(raw) : {};

    if (!s || typeof s !== 'object' || Array.isArray(s)) {
      return defaultSave();
    }

    const hats = Array.isArray(s.hats)
      ? [
          ...new Set(
            s.hats.filter(h => {
              return HATS.includes(h) && h !== 'none';
            })
          )
        ]
      : [];

    return {
      coins: validNumber(s.coins),
      best: validNumber(s.best),
      hats,
      hat: hats.includes(s.hat) ? s.hat : 'none',
      shirt: Object.hasOwn(SHIRTS, s.shirt)
        ? s.shirt
        : 'Blueberry',
      shieldOwned: s.shieldOwned === true,
      shieldEquipped:
        s.shieldOwned === true &&
        s.shieldEquipped === true
    };
  } catch (error) {
    // Malformed JSON is recoverable.
    // Blocked browser storage needs a warning.
    if (!(error instanceof SyntaxError)) {
      storageAvailable = false;
    }

    return defaultSave();
  }
}

let saved = loadSave();

function persist() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(saved)
    );
  } catch {
    storageAvailable = false;
  }

  $('storage-warning').hidden = storageAvailable;
  $('wallet').textContent = saved.coins;
  $('menu-best').textContent = saved.best;
}

persist();

// ============================================================
// SCREEN NAVIGATION
// ============================================================

function showScreen(name) {
  screen = name;

  const names = {
    menu: 'menu',
    game: 'play-screen',
    custom: 'custom-screen',
    upgrade: 'upgrade-screen',
    help: 'help-screen'
  };

  Object.values(names).forEach(id => {
    $(id).hidden = id !== names[name];
  });

  if (name === 'custom') renderCloset();
  if (name === 'upgrade') renderUpgrade();
}

function mainMenu() {
  run = null;
  showScreen('menu');
  persist();
}

// ============================================================
// ROW GENERATION
// ============================================================

// Delivery checkpoints always override railway placement.
function isRailRow(y) {
  return (
    y > 0 &&
    y % SETTINGS.missionRows !== 0 &&
    y % SETTINGS.trainEvery === SETTINGS.trainOffset
  );
}

function makeRow(y) {
  const checkpoint =
    y > 0 && y % SETTINGS.missionRows === 0;

  const rail = isRailRow(y);

  // Keep both approaches to a railway safe.
  const besideRail =
    isRailRow(y - 1) || isRailRow(y + 1);

  const road = (
    y > 0 &&
    y % 3 !== 0 &&
    !checkpoint &&
    !rail &&
    !besideRail
  );

  const row = {
    y,
    road,
    rail,
    checkpoint,
    sidewalk:
      y > 0 && !road && !rail && !checkpoint,
    houseX:
      1 + ((y / SETTINGS.missionRows * 5) % 7 | 0),
    cars: [],
    obstacles: []
  };

  if (road) {
    row.direction = y % 2 ? 1 : -1;
    row.speedFactor = 0.8 + Math.random() * 0.35;
    row.spacing = 290 + Math.random() * 60;
    row.length = row.spacing * 4;

    const phase = Math.random() * row.spacing;

    const colors = [
      '#f0bd52',
      '#e48673',
      '#79b5c4',
      '#f4f1de'
    ];

    for (let i = 0; i < 4; i++) {
      row.cars.push({
        x: phase + i * row.spacing - 250,
        width: 77 + Math.random() * 20,
        color: colors[i]
      });
    }
  }

  // Obstacles appear only on sidewalks.
  // Column 4 stays clear so there is always a route through.
  if (row.sidewalk) {
    const candidates = [0, 1, 2, 3, 5, 6, 7, 8];
    const count = 2 + (y % 2);

    for (let i = 0; i < count; i++) {
      const index = Math.floor(
        Math.random() * candidates.length
      );

      row.obstacles.push({
        x: candidates.splice(index, 1)[0],
        type: i % 2 ? 'lamp' : 'tree'
      });
    }
  }

  if (rail) {
    const width =
      SETTINGS.trainCars * SETTINGS.trainCarLength +
      (SETTINGS.trainCars - 1) * 8;

    const direction =
      y % 24 === SETTINGS.trainOffset ? 1 : -1;

    row.train = {
      phase: 'cooldown',
      remaining:
        SETTINGS.trainCooldown + Math.random() * 3,
      direction,
      width,
      x: direction === 1
        ? -width - 40
        : gameCanvas.width + 40,
      speed: SETTINGS.trainSpeed
    };
  }

  return row;
}

// Retain only nearby rows for bounded memory use.
function maintainRows() {
  const low = Math.max(
    0,
    run.player.y - SETTINGS.rowsBehind
  );

  const high =
    run.player.y + SETTINGS.rowsAhead;

  for (let y = low; y <= high; y++) {
    if (!run.rows.has(y)) {
      run.rows.set(y, makeRow(y));
    }
  }

  for (const y of run.rows.keys()) {
    if (y < low || y > high) {
      run.rows.delete(y);
    }
  }
}

// ============================================================
// TRAINS
// Cooldown → flashing warning → passing → cooldown.
// All phases use game time and freeze when paused.
// ============================================================

function updateTrain(row, dt) {
  const train = row.train;
  let remainingTime = dt;

  // Consume leftover time at phase changes to keep timing
  // consistent at different frame rates.
  while (remainingTime > 0) {
    if (train.phase === 'passing') {
      const distance = train.direction === 1
        ? gameCanvas.width + 40 - train.x
        : train.x + train.width + 40;

      const step = Math.min(
        remainingTime,
        Math.max(0, distance / train.speed)
      );

      train.x +=
        train.direction * train.speed * step;

      remainingTime -= step;

      if (step < distance / train.speed) {
        return;
      }

      // The entire train has left the crossing.
      train.phase = 'cooldown';

      train.remaining = Math.max(
        3.5,
        SETTINGS.trainCooldown -
          run.deliveries * 0.08
      );

      train.x = train.direction === 1
        ? -train.width - 40
        : gameCanvas.width + 40;
    } else {
      const step = Math.min(
        remainingTime,
        Math.max(0, train.remaining)
      );

      train.remaining -= step;
      remainingTime -= step;

      if (train.remaining > 0.000001) {
        return;
      }

      if (train.phase === 'cooldown') {
        train.phase = 'warning';
        train.remaining =
          SETTINGS.trainWarningSeconds;

        if (
          Math.abs(row.y - run.player.y) <= 4
        ) {
          $('route-message').textContent =
            'Train coming! Wait on the sidewalk ' +
            'until the lights turn green.';
        }
      } else {
        train.phase = 'passing';

        train.speed = Math.min(
          SETTINGS.trainMaximumSpeed,
          SETTINGS.trainSpeed +
            run.deliveries *
              SETTINGS.trainSpeedPerDelivery
        );

        train.x = train.direction === 1
          ? -train.width - 40
          : gameCanvas.width + 40;
      }
    }
  }
}

function updateRailStatus() {
  let nearest = null;

  for (const row of run.rows.values()) {
    if (
      row.rail &&
      row.y >= run.player.y - 1 &&
      (!nearest || row.y < nearest.y)
    ) {
      nearest = row;
    }
  }

  if (!nearest) {
    railStatus.textContent =
      'Railway · clear route ahead';

    railStatus.style.color = '#356547';
    return;
  }

  const train = nearest.train;

  const distance = Math.max(
    0,
    nearest.y - run.player.y
  );

  const label = train.phase === 'cooldown'
    ? 'Green · safe to cross'
    : train.phase === 'warning'
      ? 'RED · train approaching!'
      : 'RED · train passing!';

  const text =
    `Railway ${distance} rows ahead · ${label}`;

  if (railStatus.textContent !== text) {
    railStatus.textContent = text;
  }

  railStatus.style.color =
    train.phase === 'cooldown'
      ? '#356547'
      : '#a63e36';
}

// ============================================================
// RUN STATE AND HUD
// ============================================================

function startRun() {
  run = {
    player: { x: 4, y: 0 },
    hop: null,
    furthest: 0,
    deliveries: 0,
    earned: 0,
    target: SETTINGS.missionRows,
    rows: new Map(),
    camera: -T * 2.5,
    paused: false,
    over: false,
    shieldReady:
      saved.shieldOwned && saved.shieldEquipped,
    invincible: 0,
    elapsed: 0,
    look: {
      shirt: saved.shirt,
      hat: saved.hat
    },
    toast: 0
  };

  maintainRows();
  showScreen('game');

  $('game-overlay').hidden = true;
  $('pause').disabled = false;
  $('pause').textContent = 'Pause';

  $('route-message').textContent =
    'Your parcel is ready! Dodge traffic, go around ' +
    'obstacles, and watch train signals.';

  updateHUD();

  gameCanvas.focus({
    preventScroll: true
  });
}

function updateHUD() {
  $('distance').innerHTML =
    `${run.furthest} <small>rows</small>`;

  $('deliveries').textContent =
    run.deliveries;

  $('mission-title').textContent =
    `Delivery #${run.deliveries + 1}`;

  const remaining = Math.max(
    0,
    run.target - run.player.y
  );

  $('mission-distance').textContent = remaining
    ? `${remaining} rows to go`
    : 'Find the marked house on this row';

  $('mission-progress').max =
    SETTINGS.missionRows;

  $('mission-progress').value = Math.max(
    0,
    SETTINGS.missionRows - remaining
  );

  $('shield-status').textContent =
    run.shieldReady
      ? '◇ Shield ready · 1 hit covered'
      : run.shieldUsed
        ? '◇ Shield used this route'
        : '◇ Shield not equipped';

  $('wallet').textContent = saved.coins;
  updateRailStatus();
}

// ============================================================
// MOVEMENT AND DELIVERIES
// ============================================================

function move(direction) {
  if (
    screen !== 'game' ||
    !run ||
    run.paused ||
    run.over ||
    run.hop
  ) {
    return;
  }

  const offsets = {
    up: [0, 1],
    down: [0, -1],
    left: [-1, 0],
    right: [1, 0]
  };

  const [dx, dy] = offsets[direction];

  const x = run.player.x + dx;
  const y = run.player.y + dy;

  // Keep backward movement within the visible area.
  const minimumY = Math.max(
    0,
    run.furthest - 2
  );

  if (
    x < 0 ||
    x >= SETTINGS.columns ||
    y < minimumY
  ) {
    return;
  }

  if (y > run.target) {
    $('route-message').textContent =
      'Deliver this package first! ' +
      'Hop onto the marked house.';
    return;
  }

  const destination = run.rows.get(y);

  const obstacle = destination &&
    destination.obstacles.find(item => {
      return item.x === x;
    });

  if (obstacle) {
    $('route-message').textContent =
      obstacle.type === 'tree'
        ? 'A tree blocks that tile. Hop around it!'
        : 'A streetlight blocks that tile. Try another way!';
    return;
  }

  run.hop = {
    fromX: run.player.x,
    fromY: run.player.y,
    toX: x,
    toY: y,
    elapsed: 0
  };
}

function finishHop() {
  const hop = run.hop;

  run.player = {
    x: hop.toX,
    y: hop.toY
  };

  run.hop = null;

  if (run.player.y > run.furthest) {
    run.furthest = run.player.y;

    if (run.furthest > saved.best) {
      saved.best = run.furthest;
      persist();
    }
  }

  maintainRows();

  const row = run.rows.get(run.player.y);

  if (
    run.player.y === run.target &&
    run.player.x === row.houseX
  ) {
    run.deliveries++;
    run.earned += SETTINGS.deliveryCoins;
    saved.coins += SETTINGS.deliveryCoins;

    // Immediately assign the next parcel.
    // This also prevents paying twice for one delivery.
    run.target += SETTINGS.missionRows;
    run.toast = 2;

    $('route-message').textContent =
      `Delivered! +${SETTINGS.deliveryCoins} coins. ` +
      'Your next package is ready.';

    persist();
  }

  updateHUD();
}

function playerPosition() {
  if (!run.hop) {
    return {
      x: (run.player.x + 0.5) * T,
      y: run.player.y * T,
      lift: 0
    };
  }

  const h = run.hop;

  const p = Math.min(
    1,
    h.elapsed / SETTINGS.hopSeconds
  );

  return {
    x: (
      h.fromX +
      (h.toX - h.fromX) * p +
      0.5
    ) * T,

    y: (
      h.fromY +
      (h.toY - h.fromY) * p
    ) * T,

    lift: Math.sin(p * Math.PI) * 13
  };
}

// ============================================================
// COLLISIONS
// Cars and trains use the same shield rules.
// ============================================================

function takeHit() {
  if (run.shieldReady) {
    run.shieldReady = false;
    run.shieldUsed = true;
    run.invincible = SETTINGS.shieldSeconds;

    $('route-message').textContent =
      'Shield saved your parcel! ' +
      'Get to a safe tile while it glows.';

    updateHUD();
  } else {
    gameOver();
  }
}

function collide() {
  if (run.invincible > 0) return;

  const p = playerPosition();

  for (const row of run.rows.values()) {
    if (
      Math.abs(p.y - row.y * T) >= 27
    ) {
      continue;
    }

    const vehicles = row.road
      ? row.cars
      : row.rail &&
        row.train.phase === 'passing'
        ? [row.train]
        : [];

    for (const vehicle of vehicles) {
      if (
        p.x + 13 > vehicle.x &&
        p.x - 13 < vehicle.x + vehicle.width
      ) {
        takeHit();
        return;
      }
    }
  }
}

// ============================================================
// SIMULATION
// ============================================================

function update(dt) {
  if (
    !run ||
    run.paused ||
    run.over ||
    screen !== 'game'
  ) {
    return;
  }

  run.elapsed += dt;

  run.invincible = Math.max(
    0,
    run.invincible - dt
  );

  run.toast = Math.max(
    0,
    run.toast - dt
  );

  const speed = Math.min(
    SETTINGS.maximumSpeed,
    SETTINGS.trafficSpeed +
      run.deliveries * SETTINGS.speedPerDelivery
  );

  for (const row of run.rows.values()) {
    if (!row.road) continue;

    const laneSpeed = Math.min(
      SETTINGS.maximumSpeed,
      speed * row.speedFactor
    );

    for (const car of row.cars) {
      car.x += row.direction * laneSpeed * dt;

      if (
        car.x > gameCanvas.width + row.spacing
      ) {
        car.x -= row.length;
      }

      if (
        car.x + car.width < -row.spacing
      ) {
        car.x += row.length;
      }
    }
  }

  if (run.hop) {
    run.hop.elapsed += dt;

    if (
      run.hop.elapsed >= SETTINGS.hopSeconds
    ) {
      finishHop();
    }
  }

  for (const row of run.rows.values()) {
    if (row.rail) {
      updateTrain(row, dt);
    }
  }

  updateRailStatus();

  const desired =
    (run.furthest - 2.5) * T;

  run.camera +=
    (desired - run.camera) *
    (1 - Math.exp(-dt * 9));

  collide();
}

// ============================================================
// PAUSE AND GAME OVER
// ============================================================

function setPaused(paused) {
  if (
    !run ||
    run.over ||
    screen !== 'game'
  ) {
    return;
  }

  run.paused = paused;

  $('game-overlay').hidden = !paused;
  $('overlay-label').textContent = 'TAKE A BREATHER';
  $('overlay-title').textContent = 'Route paused';

  $('overlay-text').textContent =
    'Your parcels can wait a moment.';

  $('results').hidden = true;
  $('resume').hidden = false;
  $('restart').hidden = true;

  $('pause').textContent = paused
    ? 'Resume'
    : 'Pause';

  if (!paused) {
    gameCanvas.focus({
      preventScroll: true
    });
  }
}

function gameOver() {
  run.over = true;
  persist();

  $('game-overlay').hidden = false;

  $('overlay-label').textContent =
    'EVERY ROUTE IS AN ADVENTURE';

  $('overlay-title').textContent =
    'End of the road';

  $('overlay-text').textContent =
    'A bump in the route. Your earned coins are safe.';

  $('results').hidden = false;

  $('results').innerHTML = `
    <div>
      <strong>${run.furthest}</strong>
      <span>Distance</span>
    </div>
    <div>
      <strong>${run.deliveries}</strong>
      <span>Deliveries</span>
    </div>
    <div>
      <strong>${run.earned}</strong>
      <span>Coins earned</span>
    </div>
    <div>
      <strong>${saved.best}</strong>
      <span>Best distance</span>
    </div>
  `;

  $('resume').hidden = true;
  $('restart').hidden = false;
  $('pause').disabled = true;
}

// ============================================================
// CUSTOMIZATION
// ============================================================

function renderCloset() {
  if (!wardrobe) {
    wardrobe = {
      hat: saved.hat,
      shirt: saved.shirt
    };
  }

  $('shirts').replaceChildren();

  for (
    const [name, color]
    of Object.entries(SHIRTS)
  ) {
    const button =
      document.createElement('button');

    button.innerHTML = `
      <span
        class="swatch"
        style="background:${color}">
      </span>
      ${name}
    `;

    button.classList.toggle(
      'selected',
      wardrobe.shirt === name
    );

    button.setAttribute(
      'aria-pressed',
      wardrobe.shirt === name
    );

    button.onclick = () => {
      wardrobe.shirt = name;
      renderCloset();
    };

    $('shirts').append(button);
  }

  $('hats').replaceChildren();

  for (const hat of HATS) {
    const owned =
      hat === 'none' ||
      saved.hats.includes(hat);

    const button =
      document.createElement('button');

    const label = hat === 'none'
      ? 'No hat'
      : hat[0].toUpperCase() + hat.slice(1);

    const status = wardrobe.hat === hat
      ? 'Equipped'
      : owned
        ? 'Unlocked · equip'
        : `Locked · ${SETTINGS.hatPrice} coins`;

    button.innerHTML =
      `${label}<small>${status}</small>`;

    button.classList.toggle(
      'selected',
      wardrobe.hat === hat
    );

    button.setAttribute(
      'aria-pressed',
      wardrobe.hat === hat
    );

    button.onclick = () => {
      if (!owned) {
        if (
          saved.coins < SETTINGS.hatPrice
        ) {
          $('shop-message').textContent =
            `You need ${SETTINGS.hatPrice} coins. ` +
            'Complete more deliveries!';
          return;
        }

        saved.coins -= SETTINGS.hatPrice;
        saved.hats.push(hat);
        persist();

        $('shop-message').textContent =
          `${label} unlocked! It’s yours to keep.`;
      } else {
        $('shop-message').textContent = '';
      }

      wardrobe.hat = hat;
      renderCloset();
    };

    $('hats').append(button);
  }

  drawPreview();
}

function renderUpgrade() {
  $('shield-buy').textContent =
    !saved.shieldOwned
      ? `Unlock · ${SETTINGS.shieldPrice} coins`
      : saved.shieldEquipped
        ? 'Equipped · click to unequip'
        : 'Unlocked · equip shield';

  $('shield-buy').setAttribute(
    'aria-pressed',
    saved.shieldEquipped
  );
}

function toggleShield() {
  if (!saved.shieldOwned) {
    if (
      saved.coins < SETTINGS.shieldPrice
    ) {
      $('upgrade-message').textContent =
        `You need ${SETTINGS.shieldPrice} coins. ` +
        'Complete more deliveries!';
      return;
    }

    saved.coins -= SETTINGS.shieldPrice;
    saved.shieldOwned = true;
    saved.shieldEquipped = true;

    $('upgrade-message').textContent =
      'Shield unlocked permanently. Ready for your next run.';
  } else {
    saved.shieldEquipped =
      !saved.shieldEquipped;

    $('upgrade-message').textContent =
      saved.shieldEquipped
        ? 'Shield equipped for your next run.'
        : 'Shield unequipped.';
  }

  persist();
  renderUpgrade();
}

// ============================================================
// DRAWING HELPERS
// ============================================================

function rect(c, x, y, w, h, color, radius = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fill();
}

// ============================================================
// BULLDOG CHARACTER
// ============================================================

function courier(c, x, y, scale, look, shield = false) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);

  const gold = '#ffd21b';
  const cream = '#fff0a0';
  const ink = '#172735';

  const shirt = look.shirt === 'Blueberry'
    ? '#0755ad'
    : SHIRTS[look.shirt];

  function shape(px, py, w, h, color, radius = 4) {
    c.fillStyle = color;
    c.strokeStyle = ink;
    c.lineWidth = 1.2;
    c.beginPath();
    c.roundRect(px, py, w, h, radius);
    c.fill();
    c.stroke();
  }

  function oval(px, py, rx, ry, color, outline = true) {
    c.fillStyle = color;
    c.strokeStyle = ink;
    c.lineWidth = 1.2;
    c.beginPath();
    c.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
    c.fill();

    if (outline) c.stroke();
  }

  function triangle(ax, ay, bx, by, cx, cy, color) {
    c.fillStyle = color;
    c.strokeStyle = ink;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(ax, ay);
    c.lineTo(bx, by);
    c.lineTo(cx, cy);
    c.closePath();
    c.fill();
    c.stroke();
  }

  // Shadow.
  oval(0, 20, 21, 6, '#183c3229', false);

  if (shield) {
    c.fillStyle = '#9ceae82d';
    c.strokeStyle = '#bdf8f4';
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(0, -9, 31, 37, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  }

  // Paws, sleeves, and shirt.
  shape(-13, 11, 11, 11, gold);
  shape(3, 11, 11, 11, gold);
  shape(-22, -10, 11, 16, shirt);
  shape(11, -10, 11, 16, shirt);
  shape(-17, -12, 34, 29, shirt, 6);
  shape(-23, 2, 9, 10, gold);
  shape(15, 2, 9, 10, gold);
  rect(c, -7, -12, 14, 4, '#073568', 2);

  // School shirt print.
  c.fillStyle = gold;
  c.textAlign = 'center';
  c.font = 'bold 4.2px Arial';
  c.fillText('NATIONAL', 0, -4);

  oval(-4, 1, 5, 3.2, gold, false);
  triangle(-9, -1, -8, -4, -5, -1, gold);
  rect(c, -4, 0, 4, 2, cream, 1);
  oval(-1, 0, 1, 0.8, ink, false);

  c.font = 'bold 3px Arial';
  c.fillStyle = gold;
  c.fillText('NU', 8, 0);
  c.fillText('1900', 8, 3);

  c.font = 'bold 2.5px Arial';
  c.fillText('UNIVERSITY', 0, 7);

  c.font = 'bold 4px Arial';
  c.fillText('BULLDOG', 0, 12);

  // Collar and studs.
  shape(-14, -16, 28, 5, '#123c75', 2);

  for (const stud of [-9, 0, 9]) {
    oval(stud, -13.5, 1.2, 1.2, '#e9edf0', false);
  }

  // Ears, head, and cheeks.
  triangle(-18, -25, -20, -40, -7, -33, gold);
  triangle(7, -33, 20, -40, 18, -25, gold);
  oval(0, -27, 19, 15, gold);
  oval(-16, -23, 6, 11, '#e9b915');
  oval(16, -23, 6, 11, '#e9b915');

  // Eyes and brows.
  oval(-8, -29, 4.2, 3.1, '#fffdf0');
  oval(8, -29, 4.2, 3.1, '#fffdf0');
  oval(-6.5, -28.7, 1.5, 2, ink, false);
  oval(6.5, -28.7, 1.5, 2, ink, false);

  c.strokeStyle = ink;
  c.lineWidth = 2.5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-13, -34);
  c.lineTo(-4, -31);
  c.moveTo(13, -34);
  c.lineTo(4, -31);
  c.stroke();

  // Mouth, tongue, fangs, and muzzle.
  oval(0, -17, 10, 7, ink);
  oval(0, -14, 5, 3, '#d64b54', false);
  triangle(-8, -20, -5, -20, -6, -16, '#fffdf0');
  triangle(5, -20, 8, -20, 6, -16, '#fffdf0');
  oval(-6, -23, 8, 5.5, cream);
  oval(6, -23, 8, 5.5, cream);
  oval(0, -25, 5, 3.5, ink);
  oval(-1.3, -26, 1.4, 0.7, '#ffffffaa', false);

  // Hats.
  if (look.hat === 'cap') {
    shape(-16, -43, 32, 10, '#123c75');
    shape(5, -35, 18, 4, gold, 2);
  }

  if (look.hat === 'helmet') {
    shape(-18, -45, 36, 13, '#f7ca58', 8);
    rect(c, -2, -44, 4, 10, '#cf9228', 2);
  }

  if (look.hat === 'beanie') {
    shape(-16, -45, 32, 12, '#c87789', 7);
    shape(-18, -36, 36, 5, '#ad6274', 2);
    oval(0, -48, 5, 4, '#c87789');
  }

  // Parcel.
  shape(17, 4, 11, 13, '#dcb16d', 2);
  rect(c, 21, 4, 3, 13, '#f9db9c');

  c.restore();
}

// ============================================================
// SCENERY AND VEHICLES
// ============================================================

function tree(c, x, y, scale = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);

  rect(c, -4, 0, 8, 25, '#8a7c53', 2);

  c.fillStyle = '#183c3219';
  c.beginPath();
  c.ellipse(6, 20, 25, 9, 0, 0, Math.PI * 2);
  c.fill();

  const leaves = [
    [0, -14, 24, '#729b68'],
    [-13, -5, 18, '#729b68'],
    [13, -5, 20, '#5e8d60'],
    [-8, -20, 15, '#8bb277']
  ];

  for (const [tx, ty, radius, color] of leaves) {
    c.fillStyle = color;
    c.beginPath();
    c.arc(tx, ty, radius, 0, Math.PI * 2);
    c.fill();
  }

  c.restore();
}

function streetlight(c, x, y) {
  rect(c, x - 9, y + 20, 18, 8, '#7e887a', 4);
  rect(c, x - 3, y - 17, 6, 43, '#40544e', 3);
  rect(c, x - 3, y - 20, 19, 5, '#40544e', 2);
  rect(c, x + 8, y - 17, 13, 8, '#e0b84f', 3);
  rect(c, x + 10, y - 15, 9, 4, '#fff3b0', 2);
}

function house(c, x, y, active, delivered) {
  rect(
    c,
    x - 25,
    y - 17,
    50,
    42,
    delivered ? '#c9d8bd' : '#f3e7bf',
    3
  );

  c.fillStyle = active ? '#cb7357' : '#73978c';
  c.beginPath();
  c.moveTo(x - 30, y - 15);
  c.lineTo(x, y - 37);
  c.lineTo(x + 30, y - 15);
  c.closePath();
  c.fill();

  rect(c, x - 7, y + 2, 14, 23, '#406b5b', 2);
  rect(c, x - 20, y - 7, 10, 12, '#9fc5bc', 2);
  rect(c, x + 11, y - 7, 10, 12, '#9fc5bc', 2);

  if (active) {
    c.fillStyle = '#f7cd58';
    c.beginPath();
    c.arc(x, y - 53, 13, 0, Math.PI * 2);
    c.fill();

    c.beginPath();
    c.moveTo(x - 6, y - 44);
    c.lineTo(x, y - 34);
    c.lineTo(x + 6, y - 44);
    c.fill();

    c.fillStyle = '#183c32';
    c.font = 'bold 14px Arial';
    c.textAlign = 'center';
    c.fillText('↓', x, y - 48);
  }
}

function carArt(c, car, y, direction) {
  rect(c, car.x + 4, y + 19, car.width, 35, '#00000020', 8);

  rect(c, car.x + 10, y + 9, 15, 7, '#293b36', 2);
  rect(c, car.x + 10, y + 47, 15, 7, '#293b36', 2);

  rect(
    c,
    car.x + car.width - 24,
    y + 9,
    15,
    7,
    '#293b36',
    2
  );

  rect(
    c,
    car.x + car.width - 24,
    y + 47,
    15,
    7,
    '#293b36',
    2
  );

  rect(c, car.x, y + 12, car.width, 40, car.color, 8);

  rect(
    c,
    car.x + car.width * 0.3,
    y + 17,
    car.width * 0.38,
    30,
    '#365853',
    5
  );

  rect(
    c,
    car.x + car.width * 0.32,
    y + 20,
    car.width * 0.12,
    24,
    '#a5c7bd',
    2
  );

  rect(
    c,
    car.x + car.width * 0.52,
    y + 20,
    car.width * 0.12,
    24,
    '#a5c7bd',
    2
  );

  const front = direction === 1
    ? car.x + car.width - 5
    : car.x;

  rect(c, front, y + 17, 5, 8, '#fff0bb', 2);
  rect(c, front, y + 39, 5, 8, '#fff0bb', 2);
}

function railwayArt(c, row, y) {
  rect(
    c, 0, y, gameCanvas.width, T, '#8d9381'
  );

  // Wooden sleepers.
  for (
    let x = 8;
    x < gameCanvas.width;
    x += 27
  ) {
    rect(c, x, y + 10, 10, 44, '#665f50', 1);
  }

  // Steel rails.
  rect(
    c, 0, y + 18, gameCanvas.width, 5, '#d7ddd2'
  );

  rect(
    c, 0, y + 42, gameCanvas.width, 5, '#d7ddd2'
  );

  const train = row.train;
  const danger = train.phase !== 'cooldown';
  const flash =
    Math.floor(run.elapsed * 6) % 2 === 0;

  // Signals at both ends of the crossing.
  for (
    const x of [17, gameCanvas.width - 17]
  ) {
    rect(c, x - 10, y + 2, 20, 13, '#273f3a', 4);
    rect(c, x - 10, y + 51, 20, 11, '#273f3a', 3);

    const color = danger
      ? flash ? '#f7574d' : '#8e3632'
      : '#9fe39e';

    rect(c, x - 6, y + 5, 12, 7, color, 3);
    rect(c, x - 6, y + 53, 12, 7, color, 3);
  }

  if (danger) {
    for (
      let x = 35;
      x < gameCanvas.width - 35;
      x += 28
    ) {
      rect(c, x, y + 1, 14, 3, '#f4cb63');
      rect(c, x, y + 60, 14, 3, '#f4cb63');
    }
  }

  if (train.phase !== 'passing') {
    return;
  }

  // Draw the engine and connected carriages.
  for (
    let i = 0;
    i < SETTINGS.trainCars;
    i++
  ) {
    const x =
      train.x +
      i * (SETTINGS.trainCarLength + 8);

    const width = SETTINGS.trainCarLength;

    const engine = train.direction === 1
      ? i === SETTINGS.trainCars - 1
      : i === 0;

    rect(c, x + 4, y + 18, width, 39, '#183c3235', 5);
    rect(c, x + 6, y + 9, width - 12, 45, '#233f53', 4);

    rect(
      c,
      x,
      y + 12,
      width,
      40,
      engine ? '#e9bd4f' : '#467d9b',
      7
    );

    rect(
      c, x + 7, y + 17, width - 14, 29, '#214e6b', 4
    );

    for (
      let windowX = x + 14;
      windowX < x + width - 16;
      windowX += 26
    ) {
      rect(
        c, windowX, y + 21, 18, 20, '#aed3d5', 2
      );
    }

    if (i < SETTINGS.trainCars - 1) {
      rect(c, x + width, y + 28, 8, 8, '#283c36');
    }

    if (engine) {
      const front = train.direction === 1
        ? x + width - 7
        : x + 2;

      rect(c, front, y + 17, 5, 7, '#fff7b8', 2);
      rect(c, front, y + 40, 5, 7, '#fff7b8', 2);
    }
  }
}

// ============================================================
// GAME DRAWING
// ============================================================

function drawGame() {
  if (!run) return;

  ctx.clearRect(
    0,
    0,
    gameCanvas.width,
    gameCanvas.height
  );

  rect(ctx, 0, 0, 576, 640, '#b4ce8a');

  const screenY = y => {
    return (
      gameCanvas.height -
      T -
      (y * T - run.camera)
    );
  };

  for (const row of run.rows.values()) {
    const y = screenY(row.y);

    if (y < -T * 2 || y > 640 + T) {
      continue;
    }

    if (row.rail) {
      railwayArt(ctx, row, y);
    } else if (row.road) {
      rect(ctx, 0, y, 576, T, '#62716b');
      rect(ctx, 0, y, 576, 3, '#53665e');

      for (let x = 15; x < 576; x += 65) {
        rect(ctx, x, y + 31, 28, 2, '#bcc3ab');
      }

      for (const car of row.cars) {
        carArt(ctx, car, y, row.direction);
      }
    } else {
      rect(
        ctx,
        0,
        y,
        576,
        T,
        row.y % 2 ? '#b9d590' : '#afcc82'
      );

      // Decorative grass and flowers.
      for (let x = 0; x < 9; x++) {
        if ((row.y * 7 + x * 3) % 5 === 0) {
          rect(
            ctx, x * T + 14, y + 39, 3, 5, '#8fac6d'
          );

          rect(
            ctx, x * T + 19, y + 35, 3, 6, '#8fac6d'
          );
        }

        if ((row.y + x) % 7 === 0) {
          rect(
            ctx, x * T + 44, y + 18, 4, 4, '#f1eac1', 2
          );
        }
      }

      if (row.sidewalk) {
        // Paved sidewalks with grassy curbs.
        rect(
          ctx,
          0,
          y + 5,
          gameCanvas.width,
          T - 10,
          '#d8d6bd'
        );

        rect(
          ctx,
          0,
          y + 5,
          gameCanvas.width,
          3,
          '#efebd4'
        );

        for (
          let x = 0;
          x <= SETTINGS.columns;
          x++
        ) {
          rect(
            ctx,
            x * T,
            y + 8,
            1,
            T - 16,
            '#bdbfaa'
          );
        }

        for (const item of row.obstacles) {
          rect(
            ctx,
            item.x * T + 5,
            y + 10,
            T - 10,
            T - 20,
            '#bfc5a1',
            8
          );

          const x = (item.x + 0.5) * T;

          if (item.type === 'tree') {
            tree(ctx, x, y + 27, 0.8);
          } else {
            streetlight(ctx, x, y + 24);
          }
        }
      }

      if (row.checkpoint) {
        const active = row.y === run.target;

        if (active) {
          rect(
            ctx,
            row.houseX * T + 3,
            y + 3,
            T - 6,
            T - 6,
            '#f6d77699',
            8
          );
        }

        house(
          ctx,
          (row.houseX + 0.5) * T,
          y + 32,
          active,
          row.y < run.target
        );
      }
    }
  }

  const player = playerPosition();

  const playerY =
    gameCanvas.height -
    T -
    (player.y - run.camera) +
    32 -
    player.lift;

  // Flash during shield invulnerability.
  const visible =
    run.invincible <= 0 ||
    Math.floor(run.invincible * 12) % 2 === 0;

  if (visible) {
    courier(
      ctx,
      player.x,
      playerY,
      1,
      run.look,
      run.shieldReady || run.invincible > 0
    );
  }

  if (run.toast > 0) {
    rect(
      ctx,
      138,
      24,
      300,
      46,
      '#f8f6efee',
      10
    );

    ctx.fillStyle = '#183c32';
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Arial';

    ctx.fillText(
      `DELIVERED! +${SETTINGS.deliveryCoins} COINS`,
      288,
      53
    );
  }
}

// ============================================================
// CHARACTER PREVIEW AND MENU ART
// ============================================================

function drawPreview() {
  const c = $('preview').getContext('2d');

  c.clearRect(0, 0, 300, 300);
  rect(c, 0, 0, 300, 300, '#dce9b3');

  c.strokeStyle = '#c4d29c';
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
}

function drawMenu() {
  const c = $('scene').getContext('2d');

  rect(c, 0, 0, 640, 680, '#dce8bb');

  c.save();
  c.translate(320, 320);
  c.rotate(-0.20);
  c.translate(-320, -320);

  rect(c, -60, 270, 780, 155, '#6b7a6b');
  rect(c, -60, 265, 780, 6, '#c6d2a7');
  rect(c, -60, 425, 780, 6, '#c6d2a7');

  for (let x = -30; x < 700; x += 95) {
    rect(c, x, 345, 44, 4, '#d5dac1');
  }

  for (let y = 0; y < 680; y += 65) {
    for (let x = 0; x < 640; x += 65) {
      if (y < 240 || y > 440) {
        rect(c, x + 20, y + 25, 3, 7, '#c0d39f');
        rect(c, x + 26, y + 21, 3, 8, '#c0d39f');
      }
    }
  }

  carArt(
    c,
    { x: 80, width: 120, color: '#eab754' },
    278,
    1
  );

  carArt(
    c,
    { x: 390, width: 105, color: '#ea917b' },
    353,
    -1
  );

  c.save();
  c.translate(485, 176);
  c.scale(1.8, 1.8);
  house(c, 0, 0, true, false);
  c.restore();

  tree(c, 120, 160, 1.6);
  tree(c, 49, 485, 1.2);
  tree(c, 543, 500, 1.7);
  tree(c, 270, 94, 0.9);

  rect(c, 269, 445, 72, 65, '#f1df98', 8);

  courier(
    c,
    307,
    468,
    1.8,
    {
      shirt: saved.shirt,
      hat: saved.hat
    }
  );

  for (let i = 0; i < 3; i++) {
    rect(
      c,
      295,
      540 + i * 22,
      9,
      9,
      '#8d9f6a',
      3
    );
  }

  c.restore();
}

// Update the existing instructions without changing HTML.
const helpParagraphs = document.querySelectorAll(
  '#help-screen .help-grid article p'
);

if (helpParagraphs[0]) {
  helpParagraphs[0].textContent +=
    ' Trees and streetlights block sidewalk tiles. ' +
    'Hop around them; the middle tile stays clear.';
}

if (helpParagraphs[3]) {
  helpParagraphs[3].textContent +=
    ' Railway signals flash red before a train passes. ' +
    'Wait on the sidewalk and cross when the signals turn green.';
}

// ============================================================
// BUTTONS AND INPUT
// Bind once. Restarting only replaces run state.
// ============================================================

$('play').onclick = startRun;

$('customize').onclick = () => {
  wardrobe = {
    hat: saved.hat,
    shirt: saved.shirt
  };

  $('shop-message').textContent = '';
  showScreen('custom');
};

$('upgrades').onclick = () => {
  $('upgrade-message').textContent = '';
  showScreen('upgrade');
};

$('how').onclick = () => showScreen('help');

$('home-link').onclick = event => {
  event.preventDefault();
  mainMenu();
};

document
  .querySelectorAll('[data-menu]')
  .forEach(button => {
    button.onclick = mainMenu;
  });

$('game-menu').onclick = mainMenu;

$('pause').onclick = () => {
  setPaused(!run.paused);
};

$('resume').onclick = () => {
  setPaused(false);
};

$('restart').onclick = startRun;

$('save-custom').onclick = () => {
  saved.hat = wardrobe.hat;
  saved.shirt = wardrobe.shirt;

  persist();

  $('shop-message').textContent =
    'Look saved. Ready for your next route!';

  drawMenu();
};

$('shield-buy').onclick = toggleShield;

document
  .querySelectorAll('[data-move]')
  .forEach(button => {
    button.addEventListener(
      'pointerdown',
      event => {
        event.preventDefault();
        move(button.dataset.move);
      }
    );
  });

const KEYS = {
  ArrowUp: 'up',
  w: 'up',
  ArrowDown: 'down',
  s: 'down',
  ArrowLeft: 'left',
  a: 'left',
  ArrowRight: 'right',
  d: 'right'
};

document.addEventListener('keydown', event => {
  const key = event.key.length === 1
    ? event.key.toLowerCase()
    : event.key;

  if (screen !== 'game') return;

  if (KEYS[key]) {
    event.preventDefault();

    if (!event.repeat) {
      move(KEYS[key]);
    }
  }

  if (
    (key === 'Escape' || key === 'p') &&
    !event.repeat
  ) {
    event.preventDefault();
    setPaused(!run.paused);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && run && !run.over) {
    setPaused(true);
  }
});

window.addEventListener('blur', () => {
  if (run && !run.over) {
    setPaused(true);
  }
});

// ============================================================
// SINGLE ANIMATION LOOP
// ============================================================

function frame(time) {
  const dt = lastFrame
    ? Math.min((time - lastFrame) / 1000, 0.1)
    : 0;

  lastFrame = time;

  // Small steps provide reliable car and train collision checks.
  let remaining = dt;

  while (remaining > 0) {
    const step = Math.min(remaining, 1 / 120);
    update(step);
    remaining -= step;
  }

  if (screen === 'game') {
    drawGame();
  }

  requestAnimationFrame(frame);
}

drawMenu();
requestAnimationFrame(frame);
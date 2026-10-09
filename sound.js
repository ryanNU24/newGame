'use strict';

// Load this file AFTER game.js.
// Sounds are generated with Web Audio; no audio downloads are needed.

(() => {
  const AUDIO = {
    tempo: 132,
    menuTempo: 100,
    melodyVolume: 0.15,
    bassVolume: 0.13,
    barkVolume: 0.45,
    carHornVolume: 0.22,
    trainHornVolume: 0.25,
    trainVolume: 0.22,
    carHornCooldown: 1.8,
    trainHornCooldown: 3.5
  };

  const STORAGE_KEY = 'delivery-hopper-audio-v1';

  const DEFAULT_VOLUMES = Object.freeze({
    master: 80,
    music: 70,
    horns: 85,
    bark: 85,
    train: 65
  });

  const volumes = { ...DEFAULT_VOLUMES };
  const channels = {};

  let compressor = null;
  let preferenceSaved = true;
  let resumeRun = null;

  const menu = document.getElementById('menu');
  const playScreen = document.getElementById('play-screen');
  const overlay = document.getElementById('game-overlay');
  const deliveryCounter = document.getElementById('deliveries');
  const header = document.querySelector('.site-header');

  if (!menu || !playScreen || !overlay || !deliveryCounter || !header) {
    return;
  }

  function validVolume(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.max(0, Math.min(100, Math.round(value)))
      : fallback;
  }

  let enabled = true;

  try {
    const preference = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (preference && typeof preference.enabled === 'boolean') {
      enabled = preference.enabled;
    }

    if (
      preference &&
      preference.volumes &&
      typeof preference.volumes === 'object'
    ) {
      for (const name of Object.keys(volumes)) {
        volumes[name] = validVolume(
          preference.volumes[name],
          DEFAULT_VOLUMES[name]
        );
      }
    }
  } catch {
    // Audio still works without saved preferences.
  }

  let available = Boolean(window.AudioContext || window.webkitAudioContext);
  let context = null;
  let master = null;
  let noise = null;
  let timer = null;
  let musicPlaying = false;
  let musicMode = null;

  let carHornCount = 0;
  let trainHornCount = 0;
  let trainPassCount = 0;

  let lastRun = null;
  let carHornTimes = new WeakMap();
  let trainHornTimes = new WeakMap();
  let nextCarHorn = 0;

  const trainLoops = new Map();

  let nextNote = 0;
  let melodyStep = 0;
  let noteCount = 0;
  let barkCount = 0;

  let previousDeliveries = Number(deliveryCounter.textContent) || 0;

  const sources = new Set();

  // Sound toggle button.
  const button = document.createElement('button');
  button.id = 'sound-toggle';
  button.type = 'button';
  button.style.cssText =
    'font-size:12px;padding:9px 12px;white-space:nowrap';

  header.style.flexWrap = 'wrap';
  header.append(button);

  // Audio mixer button.
  const mixerButton = document.createElement('button');
  mixerButton.id = 'mixer-open';
  mixerButton.type = 'button';
  mixerButton.textContent = 'Audio Mixer';
  mixerButton.setAttribute('aria-haspopup', 'dialog');
  mixerButton.setAttribute('aria-controls', 'audio-mixer');
  mixerButton.style.cssText = button.style.cssText;
  header.append(mixerButton);

  // Mixer panel.
  const mixer = document.createElement('dialog');
  mixer.id = 'audio-mixer';
  mixer.className = 'hopper-mixer';
  mixer.setAttribute('aria-labelledby', 'mixer-title');

  mixer.innerHTML = `
    <h2 id="mixer-title">Audio mixer</h2>
    <p>Adjust each sound. Your choices save automatically.</p>

    <div id="mixer-sliders"></div>

    <p class="mixer-note" id="mixer-note" role="status"></p>

    <div class="mixer-previews">
      <button type="button" id="test-music">Test music</button>
      <button type="button" id="test-horns">Test horns</button>
      <button type="button" id="test-bark">Test bark</button>
      <button type="button" id="test-train">Test train</button>
    </div>

    <div class="mixer-actions">
      <button type="button" id="mixer-mute">Mute all</button>
      <button type="button" id="mixer-reset">Reset</button>
      <button type="button" class="primary" id="mixer-close">
        Done
      </button>
    </div>
  `;

  document.body.append(mixer);

  // Mixer styling is included here.
  const mixerStyle = document.createElement('style');

  mixerStyle.textContent = `
    .hopper-mixer {
      width: min(440px, 92vw);
      max-height: 88dvh;
      overflow: auto;
      margin: auto;
      border: 1px solid #d8ddcf;
      border-radius: 18px;
      padding: 24px;
      background: #f8f6ef;
      color: #183c32;
      box-shadow: 0 16px 70px #183c3255;
    }

    .hopper-mixer::backdrop {
      background: #183c3266;
    }

    .hopper-mixer h2 {
      font-size: 28px;
      margin: 0 0 8px;
      letter-spacing: -.6px;
    }

    .hopper-mixer p {
      font-size: 13px;
      line-height: 1.6;
      color: #68776a;
    }

    .hopper-volume {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      margin: 18px 0;
      font-size: 14px;
    }

    .hopper-volume output {
      font-weight: bold;
      font-variant-numeric: tabular-nums;
    }

    .hopper-volume input {
      grid-column: 1 / -1;
      width: 100%;
      margin: 0;
      accent-color: #183c32;
      cursor: pointer;
    }

    .hopper-volume input:focus-visible {
      outline: 3px solid #d58b2d;
      outline-offset: 4px;
    }

    .mixer-previews {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 20px 0;
    }

    .mixer-previews button,
    .mixer-actions button {
      font-size: 12px;
      padding: 11px 10px;
    }

    .mixer-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    .hopper-mixer .mixer-note {
      min-height: 20px;
      font-size: 12px;
    }
  `;

  document.head.append(mixerStyle);

  const labels = {
    master: 'Master volume',
    music: 'Background music',
    horns: 'Car & train horns',
    bark: 'Dog bark',
    train: 'Passing trains'
  };

  // Create separate volume sliders.
  for (const [name, label] of Object.entries(labels)) {
    const row = document.createElement('div');
    row.className = 'hopper-volume';

    row.innerHTML = `
      <label for="volume-${name}">${label}</label>

      <output id="value-${name}" for="volume-${name}">
        ${volumes[name]}%
      </output>

      <input
        id="volume-${name}"
        type="range"
        min="0"
        max="100"
        step="1"
        value="${volumes[name]}"
      >
    `;

    mixer.querySelector('#mixer-sliders').append(row);

    row.querySelector('input').addEventListener('input', event => {
      volumes[name] = validVolume(
        Number(event.target.value),
        DEFAULT_VOLUMES[name]
      );

      updateVolumes();
      savePreference();
    });
  }

  function volumeGain(name) {
    // Boost output above the previous quiet level.
    // A compressor controls loud peaks.
    return volumes[name] / 100 * (name === 'master' ? 2 : 1.25);
  }

  function updateVolumes() {
    for (const name of Object.keys(volumes)) {
      const input = mixer.querySelector(`#volume-${name}`);

      input.value = volumes[name];
      input.setAttribute('aria-valuetext', `${volumes[name]} percent`);

      mixer.querySelector(`#value-${name}`).textContent =
        `${volumes[name]}%`;

      const gain = name === 'master' ? master : channels[name];

      if (gain) {
        // Brief ramps avoid clicks. Zero becomes complete silence.
        const now = context.currentTime;
        const current = gain.gain.value;

        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(current, now);
        gain.gain.linearRampToValueAtTime(
          volumeGain(name),
          now + 0.025
        );
      }
    }
  }

  function mixerNotice() {
    mixer.querySelector('#mixer-note').textContent = !available
      ? 'Audio is unavailable in this browser. Volume settings can still be saved.'
      : !preferenceSaved
        ? 'Volume changes apply now, but this browser cannot save them.'
        : '';
  }

  function savePreference() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ enabled, volumes })
      );

      preferenceSaved = true;
    } catch {
      preferenceSaved = false;
    }

    mixerNotice();
  }

  // Pause a running game while adjusting volume.
  mixerButton.addEventListener('click', () => {
    resumeRun =
      typeof run !== 'undefined' && run && !run.paused && !run.over
        ? run
        : null;

    if (resumeRun && typeof setPaused === 'function') {
      setPaused(true);
    }

    stopAll();
    mixer.showModal();
    updateVolumes();
    mixerNotice();
  });

  // Arrow keys adjust sliders without moving the bulldog.
  mixer.addEventListener('keydown', event => {
    event.stopPropagation();
  });

  mixer.querySelector('#mixer-close').onclick = () => {
    mixer.close();
  };

  mixer.addEventListener('close', () => {
    stopAll();

    if (
      resumeRun &&
      typeof run !== 'undefined' &&
      run === resumeRun &&
      !run.over &&
      !document.hidden
    ) {
      setPaused(false);
    }

    resumeRun = null;
    sync();
  });

  mixer.querySelector('#mixer-mute').onclick = toggle;

  mixer.querySelector('#mixer-reset').onclick = () => {
    Object.assign(volumes, DEFAULT_VOLUMES);
    updateVolumes();
    savePreference();
  };

  for (const name of ['music', 'horns', 'bark', 'train']) {
    mixer.querySelector(`#test-${name}`).onclick = () => {
      preview(name);
    };
  }

async function preview(name) {
  const request = ++recordedBarkRequest;

  if (!enabled || !available || document.hidden || !mixer.open) {
    return;
  }

  unlock();
  if (!context) return;

  try {
    if (context.state !== 'running') {
      await context.resume();
    }

    if (name === 'bark') {
      await loadRecordedBark();
    }

    if (
      request !== recordedBarkRequest ||
      !enabled ||
      !available ||
      document.hidden ||
      !mixer.open ||
      context.state !== 'running'
    ) {
      return;
    }

    stopAll();
    const now = context.currentTime + 0.015;

    if (name === 'music') {
      [72, 76, 79, 84].forEach((note, i) => {
        tone(note, now + i * 0.2, 0.18, AUDIO.melodyVolume);
      });

    } else if (name === 'horns') {
      horn(false);

    } else if (name === 'bark') {
      bark();

    } else {
      const rush = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const envelope = context.createGain();

      rush.buffer = noise;
      rush.loop = true;

      filter.type = 'lowpass';
      filter.frequency.value = 700;

      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(
        AUDIO.trainVolume,
        now + 0.04
      );
      envelope.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 1
      );

      rush.connect(filter);
      filter.connect(envelope);
      envelope.connect(channels.train);

      connectSource(rush, [filter, envelope], now, now + 1.02);

      for (let i = 0; i < 5; i++) {
        tone(
          43,
          now + i * 0.16,
          0.04,
          0.11,
          'triangle',
          'train'
        );
      }
    }
  } catch {
    failAudio();
  }
}

  function updateButton() {
    button.textContent = available
      ? `Sound: ${enabled ? 'On' : 'Off'}`
      : 'Sound unavailable';

    button.setAttribute(
      'aria-pressed',
      String(enabled && available)
    );

    button.disabled = !available;

    mixer.querySelector('#mixer-mute').textContent =
      enabled ? 'Mute all' : 'Unmute all';

    mixer.querySelector('#mixer-mute').disabled = !available;

    mixer.querySelectorAll('.mixer-previews button').forEach(item => {
      item.disabled = !available || !enabled;
    });

    mixerNotice();

    button.title = available
      ? 'Toggle music, barks, traffic horns, and train sounds'
      : 'This browser cannot play Web Audio. The game still works.';
  }

  function desiredMode() {
    if (document.hidden || mixer.open) return null;
    if (!menu.hidden) return 'menu';
    if (!playScreen.hidden && overlay.hidden) return 'game';

    return null;
  }

  // Track sources so pause and mute stop all active sounds.
  function connectSource(source, nodes, start, end) {
    sources.add(source);

    source.onended = () => {
      sources.delete(source);
      source.disconnect();

      nodes.forEach(node => {
        node.disconnect();
      });
    };

    source.start(start);

    if (end !== null) {
      source.stop(end);
    }
  }

  function stopAll() {
    musicPlaying = false;
    musicMode = null;

    clearInterval(timer);
    timer = null;

    for (const source of sources) {
      try {
        source.stop();
      } catch {
        // Source already finished.
      }
    }

    sources.clear();

    for (const loop of trainLoops.values()) {
      loop.mix.disconnect();
    }

    trainLoops.clear();
  }

  function failAudio() {
    available = false;
    stopAll();
    updateButton();
  }

  // Browsers require a click, tap, or key press to start audio.
  function unlock() {
    if (!available || !enabled) return;

    try {
      if (!context) {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext;

        context = new AudioContextClass();

        master = context.createGain();
        master.gain.value = volumeGain('master');

        compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -10;
        compressor.knee.value = 16;
        compressor.ratio.value = 6;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.2;

        master.connect(compressor);
        compressor.connect(context.destination);

        for (const name of ['music', 'horns', 'bark', 'train']) {
          channels[name] = context.createGain();
          channels[name].gain.value = volumeGain(name);
          channels[name].connect(master);
        }

        noise = context.createBuffer(
          1,
          context.sampleRate,
          context.sampleRate
        );

        const samples = noise.getChannelData(0);

        for (let i = 0; i < samples.length; i++) {
          samples[i] = Math.random() * 2 - 1;
        }
      }

      if (
        context.state === 'suspended' ||
        context.state === 'interrupted'
      ) {
        context.resume().then(() => {
          if (!mixer.open) sync();
        }).catch(() => {
          // Retry on the next user gesture.
          stopAll();
        });
      } else if (!mixer.open) {
        sync();
      }
    } catch {
      failAudio();
    }
  }

  function frequency(midiNote) {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  function tone(
    midiNote,
    time,
    duration,
    volume,
    type = 'triangle',
    channel = 'music'
  ) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency(midiNote);

    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(volume, time + 0.012);
    envelope.gain.exponentialRampToValueAtTime(
      0.0001,
      time + duration
    );

    oscillator.connect(envelope);
    envelope.connect(channels[channel]);

    connectSource(
      oscillator,
      [envelope],
      time,
      time + duration + 0.02
    );

    noteCount++;
  }

  // Original melody. Null entries are rests.
  const melody = [
    72, 76, 79, 76, 74, 76, 79, null,
    77, 81, 79, 77, 76, 74, 72, null,
    76, 79, 84, 79, 81, 79, 76, null,
    74, 77, 79, 77, 76, 74, 72, null
  ];

  const bass = [48, 53, 48, 55];

  const menuMelody = [
    72, null, 76, 79, 76, null, 74, null,
    77, null, 81, 79, 77, null, 76, null,
    76, null, 79, 84, 79, null, 76, null,
    74, null, 77, 79, 76, 74, 72, null
  ];

  function scheduleMusic() {
    if (!musicPlaying || context.state !== 'running') return;

    const tempo =
      musicMode === 'menu' ? AUDIO.menuTempo : AUDIO.tempo;

    const tune = musicMode === 'menu' ? menuMelody : melody;
    const eighthNote = 60 / tempo / 2;

    // Skip stale notes after a device stall.
    if (nextNote < context.currentTime) {
      nextNote = context.currentTime + 0.02;
    }

    while (nextNote < context.currentTime + 0.12) {
      const note = tune[melodyStep % tune.length];

      if (note !== null) {
        tone(
          note,
          nextNote,
          eighthNote * 0.8,
          AUDIO.melodyVolume
        );
      }

      if (melodyStep % 4 === 0) {
        tone(
          bass[Math.floor(melodyStep / 8) % bass.length],
          nextNote,
          eighthNote * 2.8,
          AUDIO.bassVolume,
          'sine'
        );
      }

      melodyStep++;
      nextNote += eighthNote;
    }
  }

  function startMusic(mode) {
    if (musicPlaying && musicMode === mode) return;

    stopAll();

    musicPlaying = true;
    musicMode = mode;
    melodyStep = 0;
    nextNote = context.currentTime + 0.025;

    scheduleMusic();

    timer = setInterval(tick, 25);
  }

  function woof(time) {
    // Falling pitch and filtered breath create a cartoon bark.
    const voice = context.createOscillator();
    const voiceEnvelope = context.createGain();
    const throat = context.createBiquadFilter();

    voice.type = 'sawtooth';

    voice.frequency.setValueAtTime(190, time);
    voice.frequency.exponentialRampToValueAtTime(85, time + 0.16);

    throat.type = 'lowpass';
    throat.frequency.setValueAtTime(1200, time);
    throat.frequency.exponentialRampToValueAtTime(420, time + 0.18);
    throat.Q.value = 1.5;

    voiceEnvelope.gain.setValueAtTime(0, time);
    voiceEnvelope.gain.linearRampToValueAtTime(
      AUDIO.barkVolume,
      time + 0.015
    );
    voiceEnvelope.gain.exponentialRampToValueAtTime(
      0.0001,
      time + 0.18
    );

    voice.connect(throat);
    throat.connect(voiceEnvelope);
    voiceEnvelope.connect(channels.bark);

    connectSource(
      voice,
      [throat, voiceEnvelope],
      time,
      time + 0.2
    );

    const breath = context.createBufferSource();
    const breathEnvelope = context.createGain();
    const filter = context.createBiquadFilter();

    breath.buffer = noise;

    filter.type = 'bandpass';
    filter.frequency.value = 850;
    filter.Q.value = 0.8;

    breathEnvelope.gain.setValueAtTime(0, time);
    breathEnvelope.gain.linearRampToValueAtTime(
      AUDIO.barkVolume * 0.6,
      time + 0.01
    );
    breathEnvelope.gain.exponentialRampToValueAtTime(
      0.0001,
      time + 0.14
    );

    breath.connect(filter);
    filter.connect(breathEnvelope);
    breathEnvelope.connect(channels.bark);

    connectSource(
      breath,
      [filter, breathEnvelope],
      time,
      time + 0.16
    );
  }

  let recordedBarkBuffer = null;
let recordedBarkLoad = null;
let recordedBarkRequest = 0;

// Cancel pending previews when audio is stopped.
const stopBeforeRecordedBark = stopAll;

stopAll = function () {
  recordedBarkRequest++;
  return stopBeforeRecordedBark();
};

function loadRecordedBark() {
  if (!context) return Promise.resolve(null);

  if (!recordedBarkLoad) {
    const decodingContext = context;

    recordedBarkLoad = (async () => {
      const response = await fetch('dog-bark.mp3');

      if (!response.ok) {
        throw new Error('Bark recording unavailable');
      }

      const bytes = await response.arrayBuffer();
      const buffer = await decodingContext.decodeAudioData(bytes);

      if (!(buffer.duration > 0)) {
        throw new Error('Empty bark recording');
      }

      recordedBarkBuffer = buffer;
      return buffer;
    })().catch(() => null);
  }

  return recordedBarkLoad;
}

// Prepare the recording after the first user interaction.
function warmRecordedBark() {
  setTimeout(() => {
    if (enabled && available && context) {
      loadRecordedBark();
    }
  }, 0);
}

document.addEventListener('pointerdown', warmRecordedBark, true);
document.addEventListener('keydown', warmRecordedBark, true);

function bark() {
  recordedBarkRequest++;

  if (
    !enabled ||
    !available ||
    !context ||
    context.state !== 'running' ||
    document.hidden
  ) {
    return;
  }

  const now = context.currentTime + 0.01;

  if (recordedBarkBuffer) {
    const source = context.createBufferSource();
    const envelope = context.createGain();
    const duration = recordedBarkBuffer.duration;
    const attack = Math.min(0.01, duration / 4);
    const release = Math.min(0.03, duration / 4);

    source.buffer = recordedBarkBuffer;

    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(1, now + attack);
    envelope.gain.setValueAtTime(1, now + duration - release);
    envelope.gain.linearRampToValueAtTime(0, now + duration);

    source.connect(envelope);

    // Uses the existing Dog bark and Master sliders.
    envelope.connect(channels.bark);

    // Existing pause, mute and cleanup controls stop this source.
    connectSource(
      source,
      [envelope],
      now,
      now + duration + 0.02
    );
  } else {
    // Immediate fallback while loading, or if the file fails.
    loadRecordedBark();
    woof(now);
    woof(now + 0.23);
  }

  barkCount++;
}

  function horn(isTrain) {
    const now = context.currentTime + 0.01;
    const pitches = isTrain ? [49, 54, 58] : [76, 79];
    const duration = isTrain ? 0.65 : 0.18;

    const volume = (
      isTrain ? AUDIO.trainHornVolume : AUDIO.carHornVolume
    ) / pitches.length;

    for (const note of pitches) {
      tone(note, now, duration, volume, 'sawtooth', 'horns');

      if (!isTrain) {
        tone(
          note,
          now + 0.24,
          duration,
          volume,
          'sawtooth',
          'horns'
        );
      }
    }

    if (isTrain) {
      trainHornCount++;
    } else {
      carHornCount++;
    }
  }

  function stopTrain(train) {
    const loop = trainLoops.get(train);

    if (!loop) return;

    for (const source of loop.voices) {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }

      sources.delete(source);
    }

    loop.mix.disconnect();
    trainLoops.delete(train);
  }

  function startTrain(train) {
    if (trainLoops.has(train)) return;

    const mix = context.createGain();
    mix.gain.value = AUDIO.trainVolume;
    mix.connect(channels.train);

    // Rushing air.
    const rush = context.createBufferSource();
    rush.buffer = noise;
    rush.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;

    rush.connect(filter);
    filter.connect(mix);

    connectSource(rush, [filter], context.currentTime, null);

    // Low engine rumble.
    const engine = context.createOscillator();
    engine.type = 'triangle';
    engine.frequency.value = 48;

    const engineGain = context.createGain();
    engineGain.gain.value = 0.22;

    engine.connect(engineGain);
    engineGain.connect(mix);

    connectSource(
      engine,
      [engineGain],
      context.currentTime,
      null
    );

    trainLoops.set(train, {
      mix,
      voices: [rush, engine],
      nextClack: context.currentTime
    });

    trainPassCount++;
  }

  function vehicleSounds() {
    if (
      typeof run === 'undefined' ||
      !run ||
      run.paused ||
      run.over ||
      typeof playerPosition !== 'function'
    ) {
      return;
    }

    if (run !== lastRun) {
      lastRun = run;
      carHornTimes = new WeakMap();
      trainHornTimes = new WeakMap();
      nextCarHorn = 0;

      for (const train of [...trainLoops.keys()]) {
        stopTrain(train);
      }
    }

    const player = playerPosition();
    const tile = SETTINGS.tile;
    const now = context.currentTime;
    const audibleTrains = new Set();

    for (const row of run.rows.values()) {
      const verticalDistance = Math.abs(player.y - row.y * tile);

      // Cars honk when the bulldog is near their front.
      if (row.road && verticalDistance <= tile * 0.6) {
        for (const car of row.cars) {
          const front =
            row.direction === 1 ? car.x + car.width : car.x;

          const gap = row.direction * (player.x - front);

          const ready =
            now - (carHornTimes.get(car) ?? -Infinity) >=
            AUDIO.carHornCooldown;

          if (
            gap >= 0 &&
            gap <= tile * 1.7 &&
            ready &&
            now >= nextCarHorn
          ) {
            horn(false);
            carHornTimes.set(car, now);
            nextCarHorn = now + 0.35;
          }
        }
      }

      if (!row.rail) continue;

      const train = row.train;

      const onScreen =
        train.x < gameCanvas.width &&
        train.x + train.width > 0;

      if (
        train.phase === 'passing' &&
        onScreen &&
        verticalDistance <= tile * 8
      ) {
        audibleTrains.add(train);
        startTrain(train);

        const loop = trainLoops.get(train);

        // Passing trains get quieter with distance.
        loop.mix.gain.setTargetAtTime(
          AUDIO.trainVolume *
            Math.max(0.15, 1 - verticalDistance / (tile * 9)),
          now,
          0.08
        );

        if (now >= loop.nextClack) {
          tone(
            43,
            now + 0.005,
            0.04,
            0.11,
            'triangle',
            'train'
          );

          loop.nextClack = now + 0.16;
        }
      }

      const front =
        train.direction === 1
          ? train.x + train.width
          : train.x;

      const gap = train.direction * (player.x - front);

      const inFront =
        verticalDistance <= tile * 0.6 &&
        gap >= 0 &&
        gap <= tile * 2;

      const atCrossing =
        verticalDistance <= tile * 1.3 &&
        (
          train.phase === 'warning' ||
          (train.phase === 'passing' && onScreen)
        );

      const ready =
        now - (trainHornTimes.get(train) ?? -Infinity) >=
        AUDIO.trainHornCooldown;

      if (
        (train.phase === 'warning' || train.phase === 'passing') &&
        (inFront || atCrossing) &&
        ready
      ) {
        horn(true);
        trainHornTimes.set(train, now);
      }
    }

    for (const train of [...trainLoops.keys()]) {
      if (!audibleTrains.has(train)) {
        stopTrain(train);
      }
    }
  }

  function sync() {
    const deliveries = Number(deliveryCounter.textContent) || 0;
    const delivered = deliveries > previousDeliveries;

    // Consume deliveries even while muted.
    previousDeliveries = deliveries;

    const mode = desiredMode();

    const canPlay =
      mode &&
      enabled &&
      available &&
      context &&
      context.state === 'running';

    if (!canPlay) {
      stopAll();
      return;
    }

    startMusic(mode);

    if (delivered && mode === 'game') {
      bark();
    }
  }

  function tick() {
    sync();

    if (!musicPlaying) return;

    scheduleMusic();

    if (musicMode === 'game') {
      vehicleSounds();
    }
  }

  function toggle() {
    enabled = !enabled;

    savePreference();
    updateButton();

    if (enabled) {
      unlock();
    } else {
      sync();
    }
  }

  button.addEventListener('click', toggle);

  document.addEventListener('pointerdown', unlock, {
    capture: true
  });

  document.addEventListener('keydown', unlock, {
    capture: true
  });

  document.addEventListener('visibilitychange', sync);

  // Observe game screens and delivery updates.
  const observer = new MutationObserver(sync);

  observer.observe(menu, {
    attributes: true,
    attributeFilter: ['hidden']
  });

  observer.observe(playScreen, {
    attributes: true,
    attributeFilter: ['hidden']
  });

  observer.observe(overlay, {
    attributes: true,
    attributeFilter: ['hidden']
  });

  observer.observe(deliveryCounter, {
    childList: true,
    characterData: true,
    subtree: true
  });

  // Status information for development checks.
  window.HopperAudio = {
    toggle,
    sync,

    status: () => ({
      enabled,
      available,
      contextState: context ? context.state : 'not-started',
      musicPlaying,
      musicMode,
      noteCount,
      barkCount,
      carHornCount,
      trainHornCount,
      trainPassCount,
      activeTrainLoops: trainLoops.size,
      activeSources: sources.size,
      mixerOpen: mixer.open,
      volumes: { ...volumes },

      gains: Object.fromEntries(
        Object.keys(volumes).map(name => [
          name,
          (name === 'master' ? master : channels[name])?.gain.value
            ?? volumeGain(name)
        ])
      )
    })
  };

  updateButton();
  updateVolumes();
  // Recorded car horn, train horn and passing train.
  (() => {
    if (window.HopperTrafficRecordings) return;

    const recordings = {
      carHorn: {
        url: 'car-horn.mp3',
        buffer: null,
        promise: null
      },
      trainHorn: {
        url: 'train-horn.mp3',
        buffer: null,
        promise: null
      },
      trainPass: {
        url: 'train-passing.mp3',
        buffer: null,
        promise: null
      }
    };

    const oldHorn = horn;
    const oldStartTrain = startTrain;
    const oldPreview = preview;
    const oldStopAll = stopAll;

    const activeHorns = new Map();
    let previewRequest = 0;

    function loadRecording(name) {
      const recording = recordings[name];

      if (!context) return Promise.resolve(null);

      if (!recording.promise) {
        const decodingContext = context;

        recording.promise = (async () => {
          const response = await fetch(recording.url);

          if (!response.ok) {
            throw new Error('Recording unavailable');
          }

          const bytes = await response.arrayBuffer();
          const buffer = await decodingContext.decodeAudioData(bytes);

          if (!(buffer.duration > 0)) {
            throw new Error('Empty recording');
          }

          recording.buffer = buffer;
          return buffer;
        })().catch(() => null);
      }

      return recording.promise;
    }

    function warmRecordings() {
      setTimeout(() => {
        if (!enabled || !available || !context) return;

        for (const name of Object.keys(recordings)) {
          loadRecording(name);
        }
      }, 0);
    }

    document.addEventListener('pointerdown', warmRecordings, true);
    document.addEventListener('keydown', warmRecordings, true);

    function canPlay() {
      return (
        enabled &&
        available &&
        context &&
        context.state === 'running' &&
        !document.hidden
      );
    }

    function playRecording(
      name,
      channel,
      limit = Infinity,
      level = 1
    ) {
      const buffer = recordings[name].buffer;
      if (!buffer || !canPlay()) return null;

      const source = context.createBufferSource();
      const envelope = context.createGain();

      const now = context.currentTime + 0.01;
      const duration = Math.min(buffer.duration, limit);
      const attack = Math.min(0.01, duration / 4);
      const release = Math.min(0.04, duration / 4);

      source.buffer = buffer;

      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(
        level,
        now + attack
      );
      envelope.gain.setValueAtTime(
        level,
        now + duration - release
      );
      envelope.gain.linearRampToValueAtTime(
        0,
        now + duration
      );

      source.connect(envelope);
      envelope.connect(channels[channel]);

      connectSource(
        source,
        [envelope],
        now,
        now + duration + 0.02
      );

      return source;
    }

    // Stop recordings and cancel pending previews.
    stopAll = function () {
      previewRequest++;
      activeHorns.clear();
      return oldStopAll();
    };

    // Existing proximity checks call this function.
    horn = function (isTrain) {
      if (!canPlay()) return;

      const name = isTrain ? 'trainHorn' : 'carHorn';

      if (!recordings[name].buffer) {
        loadRecording(name);
        return oldHorn(isTrain);
      }

      // Avoid overlapping copies of the same horn.
      const active = activeHorns.get(name);
      if (active && sources.has(active)) return;

      const source = playRecording(name, 'horns');
      if (!source) return;

      activeHorns.set(name, source);

      if (isTrain) {
        trainHornCount++;
      } else {
        carHornCount++;
      }
    };

    // Existing train detection starts and stops this loop.
    startTrain = function (train) {
      if (!canPlay() || trainLoops.has(train)) return;

      const buffer = recordings.trainPass.buffer;

      if (!buffer) {
        loadRecording('trainPass');
        return oldStartTrain(train);
      }

      const mix = context.createGain();
      const level = context.createGain();
      const source = context.createBufferSource();

      // The existing game adjusts mix by distance.
      mix.gain.value = AUDIO.trainVolume;
      mix.connect(channels.train);

      level.gain.value =
        0.8 / Math.max(AUDIO.trainVolume, 0.01);
      level.connect(mix);

      source.buffer = buffer;
      source.loop = true;
      source.connect(level);

      connectSource(
        source,
        [level],
        context.currentTime,
        null
      );

      trainLoops.set(train, {
        mix,
        voices: [source],
        nextClack: Infinity
      });

      trainPassCount++;
    };

    preview = async function (name) {
      if (
        !enabled ||
        !available ||
        document.hidden ||
        !mixer.open
      ) {
        return;
      }

      stopAll();
      const request = previewRequest;

      if (!['horns', 'train-horn', 'train'].includes(name)) {
        return oldPreview(name);
      }

      unlock();
      if (!context) return;

      try {
        if (context.state !== 'running') {
          await context.resume();
        }

        const recordingName =
          name === 'horns'
            ? 'carHorn'
            : name === 'train-horn'
              ? 'trainHorn'
              : 'trainPass';

        const buffer = await loadRecording(recordingName);

        if (
          request !== previewRequest ||
          !canPlay() ||
          !mixer.open
        ) {
          return;
        }

        stopAll();

        if (name === 'train') {
          if (buffer) {
            // Four-second preview of the passing train.
            playRecording('trainPass', 'train', 4, 0.8);
          } else {
            return oldPreview('train');
          }
        } else {
          horn(name === 'train-horn');
        }
      } catch {
        stopAll();
      }
    };

    // Separate preview buttons for both horns.
    const carTest = document.getElementById('test-horns');

    if (carTest) {
      carTest.textContent = 'Test car horn';

      if (!document.getElementById('test-train-horn')) {
        const button = document.createElement('button');

        button.id = 'test-train-horn';
        button.type = 'button';
        button.textContent = 'Test train horn';

        button.addEventListener('click', () => {
          preview('train-horn');
        });

        carTest.after(button);
      }
    }

    const trainTest = document.getElementById('test-train');

    if (trainTest) {
      trainTest.textContent = 'Test train passing';
    }

    updateButton();

    window.HopperTrafficRecordings = {
      status: () => Object.fromEntries(
        Object.entries(recordings).map(([name, recording]) => [
          name,
          {
            ready: Boolean(recording.buffer),
            duration: recording.buffer
              ? recording.buffer.duration
              : 0
          }
        ])
      )
    };

    warmRecordings();
  })();
})();
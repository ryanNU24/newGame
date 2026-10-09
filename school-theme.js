'use strict';

// Rounded NU bulldog. Load this before graphics.js.
(() => {
  if (typeof courier !== 'function' || window.HopperMascot) return;

  courier = function(c, x, y, scale, look = {}, shield = false) {
    c.save();
    c.translate(x, y);
    c.scale(scale, scale);
    c.lineCap = 'round';
    c.lineJoin = 'round';

    const shirt = SHIRTS[look.shirt] || '#0755ad';
    const gold = '#f1bd42';
    const cream = '#f8e6ba';
    const ink = '#333745';

    function shade(color, amount) {
      const rgb = color.replace('#', '').match(/../g)
        .map(n => parseInt(n, 16));

      return `rgb(${rgb.map(n =>
        Math.max(0, Math.min(255, Math.round(n * amount)))
      ).join(',')})`;
    }

    function lit(px, py, radius, light, dark) {
      const gradient = c.createRadialGradient(
        px - radius * .35,
        py - radius * .4,
        1,
        px,
        py,
        radius
      );

      gradient.addColorStop(0, light);
      gradient.addColorStop(1, dark);
      return gradient;
    }

    function oval(px, py, rx, ry, color, rotation = 0) {
      c.fillStyle = color;
      c.beginPath();
      c.ellipse(px, py, rx, ry, rotation, 0, Math.PI * 2);
      c.fill();
    }

    function box(px, py, width, height, color, radius = 3) {
      c.fillStyle = color;
      c.beginPath();
      c.roundRect(px, py, width, height, radius);
      c.fill();
    }

    function line(points, color, width = .8) {
      c.strokeStyle = color;
      c.lineWidth = width;
      c.beginPath();

      points.forEach(([px, py], i) => {
        if (i) c.lineTo(px, py);
        else c.moveTo(px, py);
      });

      c.stroke();
    }

    // Ground shadow and equipped shield.
    oval(1, 21, 20, 4, '#27394a20');

    if (shield) {
      oval(
        0, -17, 32, 42,
        lit(0, -17, 44, '#cffcff14', '#63dce32b')
      );

      c.strokeStyle = '#bafcff';
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(0, -17, 32, 42, 0, 0, Math.PI * 2);
      c.stroke();

      line(
        [[-24, -34], [-27, -26], [-28, -17]],
        '#ffffffc0',
        2
      );
    }

    // Legs and padded paws.
    box(
      -12, 8, 10, 10,
      lit(-8, 9, 13, '#ffe6a1', '#bd872e'),
      5
    );

    box(
      3, 8, 10, 10,
      lit(6, 9, 13, '#ffe6a1', '#bd872e'),
      5
    );

    for (const px of [-8, 8]) {
      oval(
        px, 18, 8, 4.5,
        lit(px, 17, 9, '#ffecc0', '#c99a49')
      );

      for (const tx of [-3, 1]) {
        line(
          [[px + tx, 19], [px + tx + .2, 21]],
          '#a983455c',
          .65
        );
      }
    }

    box(-13, 8, 26, 5, '#233d61', 2);

    // Rounded blue shirt and sleeves.
    oval(
      -15, 0, 7, 9,
      lit(-17, -2, 11, shade(shirt, 1.4), shade(shirt, .7)),
      -.2
    );

    oval(
      15, 0, 7, 9,
      lit(12, -2, 11, shade(shirt, 1.3), shade(shirt, .65)),
      .2
    );

    oval(
      0, 1, 16, 13,
      lit(-3, -3, 21, shade(shirt, 1.45), shade(shirt, .65))
    );

    box(-12, 9, 24, 3, shade(shirt, .72), 2);
    line([[-11, 3], [-10, 8]], '#ffffff20', 1);

    oval(
      -18, 8, 5, 5.5,
      lit(-19, 6, 8, '#ffeab2', '#bd8a34')
    );

    line([[-20, 10], [-19, 12]], '#a07b435c', .6);

    // NU shirt lettering.
    c.textAlign = 'center';
    c.fillStyle = '#ffe084';

    c.font = '900 3.4px Arial';
    c.fillText('NATIONAL', 0, -1);

    c.font = '900 5.4px Arial';
    c.fillText('NU', 0, 4.5);

    c.font = 'bold 2.1px Arial';
    c.fillText('UNIVERSITY', 0, 7.5);

    c.font = '900 3px Arial';
    c.fillText('BULLDOG', 0, 10.5);

    // Folded ears and oversized head.
    oval(
      -17, -40, 9, 12,
      lit(-19, -42, 14, '#ffdc80', '#b48031'),
      -.45
    );

    oval(
      17, -40, 9, 11,
      lit(15, -43, 14, '#ffdc80', '#b48031'),
      .45
    );

    oval(-19, -41, 4, 7, '#c58c51', -.4);
    oval(19, -41, 4, 6, '#c58c51', .4);

    oval(
      0, -30, 23, 21,
      lit(-4, -35, 30, '#ffe293', '#d09832')
    );

    oval(
      -19, -26, 6, 12,
      lit(-21, -29, 15, '#f6d478', '#b78b3a'),
      -.1
    );

    oval(
      19, -26, 6, 12,
      lit(17, -29, 15, '#f6d478', '#b78b3a'),
      .1
    );

    // Brow folds and expressive eyes.
    line(
      [[-12, -41], [-6, -43], [-2, -41]],
      '#bb8b3565',
      1
    );

    line(
      [[4, -41], [10, -42], [14, -39]],
      '#bb8b3565',
      1
    );

    oval(-9, -34, 5, 6, '#fff9e9', -.1);
    oval(9, -34, 5, 6, '#fff9e9', .1);

    oval(-7.7, -33.3, 2.8, 3.8, '#715038');
    oval(10, -33.3, 2.8, 3.8, '#715038');

    oval(-7.2, -33.3, 1.7, 2.8, ink);
    oval(10.5, -33.3, 1.7, 2.8, ink);

    oval(-8.3, -35, 1.1, 1.2, '#fff');
    oval(9.4, -35, 1.1, 1.2, '#fff');

    line(
      [[-14, -39], [-10, -40], [-5, -38]],
      '#997236',
      1.5
    );

    line(
      [[5, -38], [10, -40], [14, -38]],
      '#997236',
      1.5
    );

    // Cream jowls, broad nose and open smile.
    oval(1, -15, 11, 8, '#6f4a39');

    oval(
      2, -12, 5, 3,
      lit(1, -13, 6, '#f6a49b', '#c96767')
    );

    oval(
      -8, -23, 10, 9,
      lit(-11, -26, 14, '#fff1cd', '#d3b576'),
      -.2
    );

    oval(
      10, -23, 10, 9,
      lit(7, -26, 14, '#fff1cd', '#d3b576'),
      .2
    );

    oval(1, -18, 5, 3, cream);

    oval(
      1, -28, 7.5, 4.8,
      lit(-1, -30, 9, '#626570', '#292d38')
    );

    oval(-1, -30, 2.8, 1, '#ffffff38');
    line([[1, -24], [1, -21]], '#967552', 1);

    line(
      [[-10, -19], [-6, -18], [-2, -20]],
      '#a4845566',
      .8
    );

    line(
      [[4, -20], [9, -18], [14, -19]],
      '#a4845566',
      .8
    );

    for (const px of [-11, -7, 8, 12]) {
      oval(px, -24 + (px % 3), .6, .6, '#b3936255');
    }

    box(-6, -16.5, 2.8, 3, '#fff4d4', [0, 0, 2, 2]);
    box(6, -16.5, 2.8, 3, '#fff4d4', [0, 0, 2, 2]);

    // Delivery parcel.
    box(
      14, 1, 12, 13,
      lit(15, 2, 16, '#e7c397', '#ae8156'),
      2
    );

    box(18, 1, 3, 13, '#f4dbad', .5);
    line([[15, 5], [25, 5]], '#976e4655', .6);
    box(15.5, 7, 5, 3, '#ffedce', .5);

    oval(
      25, 10, 3.2, 4,
      lit(24, 8, 6, '#ffeab2', '#bc8b39')
    );

    // Purchased hats.
    if (look.hat === 'cap') {
      oval(
        0, -46, 19, 9,
        lit(-5, -50, 25, '#477bbc', '#123e7c')
      );

      oval(
        10, -43, 16, 3.5,
        lit(5, -45, 20, '#ffe18c', '#c79134'),
        .05
      );

      box(-3, -50, 6, 4, gold, 1);
      line([[0, -54], [0, -47]], '#a9c7e355', .6);

    } else if (look.hat === 'helmet') {
      oval(
        0, -47, 20, 11,
        lit(-5, -51, 25, '#ffedb3', '#ce9a3b')
      );

      box(-22, -43, 44, 3.5, '#dba849', 2);
      box(-2, -56, 4, 12, '#f9d67e', 2);

      line([[-13, -50], [-14, -45]], '#af813965', 1.3);
      line([[13, -50], [14, -45]], '#af813965', 1.3);

    } else if (look.hat === 'beanie') {
      oval(
        0, -48, 19, 10,
        lit(-5, -52, 24, '#dfabb5', '#a66d82')
      );

      box(-20, -44, 40, 5, '#b98092', 3);

      for (let px = -15; px < 19; px += 5) {
        line([[px, -43], [px, -40]], '#f5cdd04d', .7);
      }

      oval(
        0, -57, 4, 4,
        lit(-1, -58, 6, '#efc7cb', '#ad788c')
      );
    }

    c.restore();
  };

  window.HopperMascot = { version: 'rounded-bulldog' };
})();

// Blue secondary buttons, gold major buttons and school-colored text.
(() => {
  if (window.HopperSchoolPalette) return;

  const style = document.createElement('style');
  style.id = 'school-palette';

  style.textContent = `
    html:root {
      --school-blue:#0755ad;
      --school-gold:#f3c74e;
      --school-navy:#102e59;
      --ink:#102e59;
      --muted:#47617e;
      --paper:#f8faff;
      --green:#e4edfb;
      --yellow:#f3c74e;
      --line:#cbd8eb;
      --panel:#eaf0fb;
      --accent:#0755ad;
      --headline:#102e59;
      --headline-gold:#946608;
      --surface:#f8faffed;
    }

    html[data-theme="dark"]:root {
      --ink:#ecf3ff;
      --muted:#b2c5e2;
      --paper:#0b1730;
      --green:#182d50;
      --line:#34517a;
      --panel:#172a49;
      --accent:#92c7ff;
      --headline:#f9db83;
      --headline-gold:#92c7ff;
      --surface:#0b1730f2;
    }

    html body {
      font-family:'Trebuchet MS','Segoe UI',Arial,sans-serif;
    }

    html body button,
    html body .controls button {
      --button-face:#0755ad;
      --button-depth:#043675;
      --button-edge:#5796de;
      --button-glow:#0755ad66;
      --button-text:#fff;

      color:var(--button-text)!important;
      background:
        linear-gradient(to top,#0002,transparent),
        var(--button-face)!important;
      border-color:var(--button-edge)!important;
      box-shadow:
        0 8px 0 var(--button-depth),
        0 15px 25px -10px var(--button-glow)!important;
      font-family:inherit;
      text-shadow:0 1px 1px #0002;
    }

    html body button:is(
      .primary,
      #play,
      #resume,
      #restart,
      #save-custom,
      #shield-buy,
      #mixer-close
    ) {
      --button-face:#f3c74e;
      --button-depth:#ae7b14;
      --button-edge:#ffe9a0;
      --button-glow:#eab52e66;
      --button-text:#102e59;
      text-shadow:none;
    }

    html body button:active:not(:disabled) {
      transform:translateY(8px);
      box-shadow:
        0 0 0 var(--button-depth),
        0 5px 12px var(--button-glow)!important;
    }

    html body button:disabled {
      opacity:.55;
      filter:saturate(.65);
      box-shadow:0 5px 0 var(--button-depth)!important;
    }

    html body button small {
      color:var(--button-text)!important;
    }

    html body button:focus-visible {
      outline:3px solid var(--ink);
      outline-offset:5px;
    }

    html body button.selected {
      outline:3px solid var(--school-gold);
      outline-offset:3px;
    }

    html body button.selected:focus-visible {
      outline:3px solid var(--ink);
      outline-offset:7px;
    }

    html body .menu-copy h1 {
      color:var(--headline);
      font-weight:900;
      letter-spacing:-3px;
    }

    html body .menu-copy h1 em {
      color:var(--headline-gold);
    }

    html body .menu-copy h1 em::after {
      background:var(--school-gold);
      opacity:.25;
    }

    html body .site-header a {
      color:var(--headline);
      font-family:inherit;
    }

    html body .brand-icon {
      background:var(--school-blue)!important;
      color:var(--school-gold);
    }

    html body .brand-sub {
      color:var(--accent);
    }

    html body .eyebrow,
    html body .art-label,
    html body .route-tag,
    html body .record strong,
    html body .stat strong {
      color:var(--accent)!important;
    }

    html body .art-label {
      background:var(--surface);
      border-radius:8px;
      padding:6px 10px;
    }

    html body .intro,
    html body .edition,
    html body footer,
    html body .record>span,
    html body .record small,
    html body .stat>span,
    html body .control-hint,
    html body .preview-card>span {
      color:var(--muted);
    }

    html body .wallet,
    html body .mission,
    html body .upgrade-card,
    html body .help-grid article,
    html body .preview-card {
      background:var(--panel)!important;
      border-color:var(--line)!important;
    }

    html body .wallet {
      color:var(--ink);
    }

    html body .wallet:first-letter {
      color:var(--headline-gold);
    }

    html body .menu-art {
      background:var(--panel)!important;
      border-color:var(--line)!important;
      box-shadow:0 14px 30px #0755ad12;
    }

    html body .art-note,
    html body .controls {
      background:var(--surface)!important;
      color:var(--ink);
    }

    html body .art-note span {
      color:var(--headline-gold);
    }

    html body .overlay {
      background:var(--surface)!important;
      color:var(--ink);
    }

    html body .canvas-wrap {
      background:var(--panel)!important;
    }

    html body .hopper-mixer {
      background:var(--paper)!important;
      color:var(--ink)!important;
      border-color:var(--line)!important;
    }

    html body .hopper-mixer p {
      color:var(--muted)!important;
    }

    html body .hopper-volume input,
    html body progress {
      accent-color:var(--school-blue);
    }

    html body .hopper-volume input:focus-visible {
      outline-color:var(--ink);
    }

    html body .shield-art {
      color:var(--accent);
    }

    html body .warning {
      background:#fff0bf;
      color:#624714;
    }

    html[data-theme="dark"] body .warning {
      background:#3a2d16;
      color:#ffe2a3;
    }

    html[data-theme="dark"] body .hopper-volume input,
    html[data-theme="dark"] body progress {
      accent-color:var(--school-gold);
    }

    @media(max-width:600px) {
      html body .menu-copy h1 {
        letter-spacing:-2px;
      }
    }
  `;

  document.head.append(style);
  window.HopperSchoolPalette = true;
})();
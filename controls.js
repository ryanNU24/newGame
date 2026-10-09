(() => {
  const namespace = 'http://www.w3.org/2000/svg';
  const angles = {
    up: 0,
    right: 90,
    down: 180,
    left: 270
  };

  document
    .querySelectorAll('.controls button[data-move]')
    .forEach(button => {
      const angle = angles[button.dataset.move];
      if (angle === undefined) return;

      const svg = document.createElementNS(namespace, 'svg');

      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '24');
      svg.setAttribute('height', '24');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      svg.setAttribute('shape-rendering', 'crispEdges');

      svg.style.cssText = `
        display: block;
        margin: auto;
        pointer-events: none;
      `;

      const arrow = document.createElementNS(namespace, 'path');

      arrow.setAttribute(
        'd',
        'M10 2h4v2h2v2h2v2h2v2h2v2h-6v10H8V12H2v-2h2V8h2V6h2V4h2Z'
      );

      arrow.setAttribute('fill', 'currentColor');
      arrow.setAttribute('transform', `rotate(${angle} 12 12)`);

      svg.append(arrow);
      button.replaceChildren(svg);
    });
})();
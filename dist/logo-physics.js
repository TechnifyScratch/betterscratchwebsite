// A small, local physics toy. The real logo keeps its layout space and home link.
(() => {
  const logo = document.querySelector('.site-header .brand img');
  if (!logo) return;
  const home = logo.closest('a');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let toy, drag, motion, frame = 0, returnTimer = 0, ignoreClick = false;
  let x = 0, y = 0, vx = 0, vy = 0, angle = 0, radius = 18;
  const paint = () => {
    if (toy) toy.style.transform = `translate3d(${x - radius}px, ${y - radius}px, 0) rotate(${angle}deg)`;
  };
  function reset() {
    cancelAnimationFrame(frame);
    clearTimeout(returnTimer);
    toy?.remove();
    toy = undefined;
    motion = undefined;
    logo.style.opacity = '';
    logo.style.pointerEvents = '';
    drag = undefined;
  }
  function returnHome() {
    if (!toy) return;
    cancelAnimationFrame(frame);
    motion = 'return';
    const start = performance.now(), fromX = x, fromY = y, fromAngle = angle;
    function glide(now) {
      if (!toy) return;
      const rect = logo.getBoundingClientRect();
      const t = Math.min(1, (now - start) / 650);
      const ease = 1 - Math.pow(1 - t, 3);
      x = fromX + (rect.left + rect.width / 2 - fromX) * ease;
      y = fromY + (rect.top + rect.height / 2 - fromY) * ease;
      angle = fromAngle * (1 - ease);
      paint();
      if (t < 1) frame = requestAnimationFrame(glide);
      else reset();
    }
    if (reducedMotion.matches) reset();
    else frame = requestAnimationFrame(glide);
  }
  function obstacles() {
    const components = [...document.querySelectorAll('.button, button, input, select, summary, .showcase-media, .community-card, .docs-callout, .settings-list > div, .privacy-points > div, .dev-card, .stats-result, .feature-ribbon, .recruitment-banner, main img')].filter(el => !el.contains(logo));
    return components
      // Nested icons and images share their enclosing component's physical surface.
      .filter(el => !components.some(parent => parent !== el && parent.contains(el)))
      .map(el => el.getBoundingClientRect())
      .filter(r => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight);
  }
  function bounce(rect, previousX, previousY) {
    const nearestX = Math.max(rect.left, Math.min(rect.right, x));
    const nearestY = Math.max(rect.top, Math.min(rect.bottom, y));
    const dx = x - nearestX, dy = y - nearestY;
    const distance = Math.hypot(dx, dy);
    if (distance >= radius) return;
    let nx, ny, penetration;
    if (distance > .001) {
      nx = dx / distance; ny = dy / distance; penetration = radius - distance;
    } else {
      // A logo dropped inside a component exits through the nearest face.
      const sides = [
        [Math.abs(previousY - rect.top), 0, -1, y - rect.top + radius],
        [Math.abs(previousY - rect.bottom), 0, 1, rect.bottom - y + radius],
        [Math.abs(previousX - rect.left), -1, 0, x - rect.left + radius],
        [Math.abs(previousX - rect.right), 1, 0, rect.right - x + radius],
      ].sort((a, b) => a[0] - b[0]);
      [, nx, ny, penetration] = sides[0];
    }
    x += nx * penetration; y += ny * penetration;
    const speed = vx * nx + vy * ny;
    if (speed < 0) { vx -= 1.55 * speed * nx; vy -= 1.55 * speed * ny; }
    if (ny < -.5) vx *= .997;
  }
  function fall() {
    motion = 'fall';
    let last = performance.now();
    function tick(now) {
      if (!toy || motion !== 'fall') return;
      const elapsed = Math.min(.04, (now - last) / 1000);
      last = now;
      const boxes = obstacles();
      const steps = Math.max(1, Math.ceil(elapsed / .006)), dt = elapsed / steps;
      for (let i = 0; i < steps; i++) {
        const previousX = x, previousY = y;
        vy += 1500 * dt;
        x += vx * dt; y += vy * dt;
        for (const rect of boxes) bounce(rect, previousX, previousY);
        if (x < radius) { x = radius; vx = Math.abs(vx) * .55; }
        if (x > innerWidth - radius) { x = innerWidth - radius; vx = -Math.abs(vx) * .55; }
        if (y < radius) { y = radius; vy = Math.abs(vy) * .55; }
        if (y > innerHeight - radius) {
          y = innerHeight - radius;
          vy = Math.abs(vy) < 70 ? 0 : -Math.abs(vy) * .55;
          vx *= Math.exp(-1.8 * dt);
          if (Math.abs(vx) < 2) vx = 0;
        }
        angle += (vx / radius) * dt * (180 / Math.PI);
      }
      paint();
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    returnTimer = setTimeout(returnHome, 4700);
  }
  logo.draggable = false;
  home.addEventListener('dragstart', event => event.preventDefault());
  logo.title = 'Drag me!';
  function beginDrag(event) {
    if (event.button !== 0 || drag) return;
    if (event.currentTarget === logo && toy) return;
    cancelAnimationFrame(frame);
    clearTimeout(returnTimer);
    motion = 'drag';
    vx = vy = 0;
    const rect = event.currentTarget.getBoundingClientRect();
    drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY,
      lastX: event.clientX, lastY: event.clientY, time: performance.now(),
      offsetX: event.clientX - (rect.left + rect.width / 2),
      offsetY: event.clientY - (rect.top + rect.height / 2) };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (toy) ignoreClick = true;
  }
  logo.addEventListener('pointerdown', beginDrag);
  window.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!toy && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5) return;
    event.preventDefault();
    if (!toy) {
      const rect = logo.getBoundingClientRect();
      radius = rect.width / 2;
      toy = logo.cloneNode();
      toy.className = 'logo-physics-toy';
      toy.removeAttribute('title');
      toy.setAttribute('aria-hidden', 'true');
      toy.addEventListener('pointerdown', beginDrag);
      toy.style.width = `${rect.width}px`;
      toy.style.height = `${rect.height}px`;
      document.body.append(toy);
      logo.style.opacity = '0';
      logo.style.pointerEvents = 'none';
      angle = 0;
      ignoreClick = true;
    }
    const now = performance.now(), dt = Math.max(.008, (now - drag.time) / 1000);
    vx = Math.max(-1400, Math.min(1400, (event.clientX - drag.lastX) / dt));
    vy = Math.max(-1400, Math.min(1400, (event.clientY - drag.lastY) / dt));
    x = Math.max(radius, Math.min(innerWidth - radius, event.clientX - drag.offsetX));
    y = Math.max(radius, Math.min(innerHeight - radius, event.clientY - drag.offsetY));
    drag.lastX = event.clientX; drag.lastY = event.clientY; drag.time = now;
    paint();
  });
  function release(event) {
    if (!drag || event.pointerId !== drag.id) return;
    if (performance.now() - drag.time > 100) {
      vy = 0;
      vx = Math.sign(vx || 1) * Math.min(24, Math.abs(vx) || 18);
    } else if (Math.abs(vx) < 18) vx = Math.sign(vx || 1) * 18;
    drag = undefined;
    if (toy) {
      if (event.type === 'pointercancel') returnHome();
      else if (reducedMotion.matches) returnTimer = setTimeout(returnHome, 4700);
      else fall();
    }
    // Suppress only the click generated by a completed drag.
    setTimeout(() => { ignoreClick = false; }, 0);
  }
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  home.addEventListener('click', event => {
    if (ignoreClick) { event.preventDefault(); event.stopPropagation(); }
  }, true);
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toy) { drag = undefined; returnHome(); }
  });
  window.addEventListener('pagehide', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { drag = undefined; reset(); } });
})();

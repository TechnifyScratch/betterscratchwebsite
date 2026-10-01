(() => {
  const header = document.querySelector('.site-header');
  const banner = document.querySelector('.recruitment-banner');
  const appearance = document.querySelector('#your-way');
  if (!header) return;
  let scheduled = false;
  function update() {
    scheduled = false;
    const offset = banner?.getBoundingClientRect().height || 0;
    header.style.setProperty('--navigation-top', `${offset}px`);
    const hidden = !!appearance && appearance.getBoundingClientRect().top <= offset + header.offsetHeight;
    header.classList.toggle('navigation-away', hidden);
    header.inert = hidden;
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(schedule);
    if (banner) observer.observe(banner);
    observer.observe(header);
  }
  update();
})();

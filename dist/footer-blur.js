const footer = document.querySelector('footer');
if (footer && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(([entry]) => {
    document.body.classList.toggle('footer-visible', entry.isIntersecting);
  }, { threshold: 0 });
  observer.observe(footer);
} else {
  // Keep the footer readable in browsers without intersection observation.
  document.body.classList.add('footer-visible');
}

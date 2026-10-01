const counter = document.querySelector("#scratch-count");
const detail = document.querySelector("#scratch-count-detail");
const format = new Intl.NumberFormat("en-US");
async function loadCommunity() {
  try {
    const response = await fetch("/api/community", { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("Unavailable");
    const data = await response.json();
    const date = new Date(data.publishedAt);
    if (!Number.isSafeInteger(data.registeredAccounts) || data.registeredAccounts < 0 || !Number.isFinite(date.getTime())) throw new Error("Invalid data");
    detail.textContent = `Published ${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}. Total accounts, not daily users.`;
    counter.setAttribute("aria-label", format.format(data.registeredAccounts));
    const animate = () => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        counter.textContent = format.format(data.registeredAccounts);
        return;
      }
      const start = performance.now();
      function frame(now) {
        const progress = Math.min((now - start) / 1400, 1);
        counter.textContent = format.format(Math.round(data.registeredAccounts * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    };
    if (!("IntersectionObserver" in window)) return animate();
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); animate(); }
    }, { threshold: 0.3 });
    observer.observe(counter);
  } catch {
    counter.textContent = "—";
    detail.textContent = "Scratch’s published statistics are unavailable right now. Try the source link below.";
  }
}
if (counter && detail) loadCommunity();

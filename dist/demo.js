const choices = document.querySelectorAll('[data-demo]');
for (const button of choices) button.addEventListener('click', () => {
  for (const choice of choices) {
    const selected = choice === button;
    choice.setAttribute('aria-pressed', String(selected));
    document.getElementById(`demo-${choice.dataset.demo}`).hidden = !selected;
  }
});
const theme = document.getElementById('demo-theme-toggle');
theme.addEventListener('click', () => {
  const dark = document.getElementById('try-home').classList.toggle('is-dark');
  theme.setAttribute('aria-pressed', String(dark));
  theme.textContent = dark ? 'Light mode' : 'Dark mode';
});
function saveProject(saved) {
  document.getElementById('demo-save').setAttribute('aria-pressed', String(saved));
  document.getElementById('demo-save').textContent = saved ? 'Saved ✓' : 'Save to shelf';
  document.getElementById('demo-shelf-count').textContent = saved ? '1 project' : '0 projects';
  document.getElementById('demo-shelf-empty').hidden = saved;
  document.getElementById('demo-saved-project').hidden = !saved;
}
document.getElementById('demo-save').addEventListener('click', () => saveProject(document.getElementById('demo-save').getAttribute('aria-pressed') !== 'true'));
document.getElementById('demo-remove').addEventListener('click', () => { saveProject(false); document.getElementById('demo-save').focus(); });
document.getElementById('demo-expand').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const expanded = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(expanded));
  button.textContent = expanded ? 'Hide remixes' : 'Show remixes';
  document.getElementById('demo-branches').hidden = !expanded;
});
document.getElementById('demo-focus-toggle').addEventListener('click', (event) => {
  const focused = document.getElementById('try-project').classList.toggle('is-focused');
  event.currentTarget.setAttribute('aria-pressed', String(focused));
  event.currentTarget.textContent = focused ? 'Exit focus mode' : 'Enter focus mode';
});

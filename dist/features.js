const featureContent = {
  shelf: { title: 'Project shelf', symbol: '▤', description: 'Save projects on your device and pick up where you left off.', docs: 'project-tools' },
  remix: { title: 'Remix trees', symbol: '⑂', description: 'Find the original project and follow what people made from it.', docs: 'project-tools' },
  appearance: { title: 'Themes & accents', symbol: '☾', description: 'Light or dark. Orange, blue, or teal. Pick what feels right.', docs: 'appearance' },
  focus: { title: 'Focus mode', symbol: '⌗', description: 'Hide the notes and comments when you just want to play.', docs: 'project-tools' },
};
const featureButtons = document.querySelectorAll('[data-feature]');
for (const button of featureButtons) button.addEventListener('click', () => {
  const selected = button.dataset.feature;
  const feature = featureContent[selected];
  if (!feature) return;
  for (const option of featureButtons) option.setAttribute('aria-pressed', String(option === button));
  const isShelf = selected === 'shelf';
  document.getElementById('feature-preview').classList.toggle('has-feature-image', isShelf);
  document.getElementById('showcase-photo').hidden = !isShelf;
  document.getElementById('showcase-art').className = `showcase-placeholder placeholder-${selected}`;
  document.getElementById('showcase-symbol').textContent = feature.symbol;
  document.getElementById('showcase-label').textContent = feature.title;
  document.getElementById('showcase-description').textContent = feature.description;
  document.getElementById('showcase-docs').href = `docs.html#${feature.docs}`;
});

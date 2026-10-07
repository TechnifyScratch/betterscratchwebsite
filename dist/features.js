const featureContent = {
  discover: { title: 'Discover (beta)', symbol: '↓', description: 'Scroll through Scratch projects, play them in the feed, and find your next favorite.', docs: 'discovery' },
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
  const images = {
    discover: { src: 'assets/feature-discover.png', alt: 'BetterScratch Discover artwork showing a scrolling project feed, reaction buttons, and a previously featured project' },
    focus: { src: 'assets/feature-focus.png', alt: 'BetterScratch focus mode artwork featuring Orbi by -Technify-' },
    appearance: { src: 'assets/feature-appearance.png', alt: 'BetterScratch appearance artwork showing night mode, day mode, and accent colors' },
    shelf: { src: 'assets/feature-shelf.png', alt: 'BetterScratch project shelf artwork with saved project thumbnails' },
    remix: { src: 'assets/feature-remix.png', alt: 'BetterScratch remix tree artwork showing Bjorne’s original project and connected remixes' },
  };
  const image = images[selected];
  const photo = document.getElementById('showcase-photo');
  document.getElementById('feature-preview').classList.toggle('has-feature-image', Boolean(image));
  photo.hidden = !image;
  if (image) {
    photo.src = image.src;
    photo.alt = image.alt;
  }
  document.getElementById('showcase-art').className = `showcase-placeholder placeholder-${selected}`;
  document.getElementById('showcase-symbol').textContent = feature.symbol;
  document.getElementById('showcase-label').textContent = feature.title;
  document.getElementById('showcase-description').textContent = feature.description;
  document.getElementById('showcase-docs').href = `docs.html#${feature.docs}`;
});

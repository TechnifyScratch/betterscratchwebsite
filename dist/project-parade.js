(() => {
  const section = document.querySelector('#community');
  const status = document.querySelector('#parade-status');
  const tracks = [document.querySelector('#parade-top'), document.querySelector('#parade-bottom')];
  if (!section || tracks.some(track => !track)) return;
  const reasons = {'scratch-team':'Scratch Team',followers:'More than 1,000 followers',community:'Community selection'};
  function badge(name, reason) {
    if (!reasons[reason]) return;
    section.querySelectorAll('[data-parade-author]').forEach(identity => {
      if (identity.dataset.paradeAuthor !== name || identity.querySelector('.website-verified')) return;
      const mark = document.createElement('span');
      mark.className = 'website-verified'; mark.textContent = '✓';
      mark.title = `BetterScratch verified · ${reasons[reason]}. This is a BetterScratch badge, not official Scratch verification.`;
      mark.setAttribute('aria-label', mark.title); identity.append(mark);
    });
  }
  function card(project, duplicate) {
    const root = document.createElement('article'); root.className = 'parade-card';
    if (duplicate) root.setAttribute('aria-hidden','true');
    const projectLink = document.createElement('a');
    projectLink.href = `https://scratch.mit.edu/projects/${project.id}/`;
    projectLink.target = '_blank'; projectLink.rel = 'noopener noreferrer';
    projectLink.className = 'parade-project';
    const image = document.createElement('img');
    image.src = `https://cdn2.scratch.mit.edu/get_image/project/${project.id}_432x324.png`;
    image.alt = ''; image.width = 432; image.height = 324; image.decoding = 'async';
    image.addEventListener('error', () => { image.hidden = true; });
    const title = document.createElement('strong'); title.textContent = project.title; title.title = project.title;
    projectLink.append(image,title);
    const author = document.createElement('a'); author.className = 'parade-author';
    author.dataset.paradeAuthor = project.author;
    author.href = `https://scratch.mit.edu/users/${encodeURIComponent(project.author)}/`;
    author.target = '_blank'; author.rel = 'noopener noreferrer'; author.textContent = project.author;
    if (duplicate) {projectLink.tabIndex = -1; author.tabIndex = -1;}
    root.append(projectLink, author); return root;
  }
  async function verify(names) {
    const queue = [...names];
    await Promise.all(Array.from({length:2}, async () => {
      while (queue.length) {
        const name = queue.shift();
        if (['viralgoose','-technify-'].includes(name.toLowerCase())) {badge(name,'community');continue;}
        try {
          const response = await fetch(`/api/stats?kind=user&username=${encodeURIComponent(name)}`, {signal:AbortSignal.timeout(10000)});
          if (response.ok) badge(name,(await response.json()).verificationReason);
        } catch { /* An unknown verification state never earns a badge. */ }
      }
    }));
  }
  async function load() {
    try {
      const response = await fetch('/api/gallery', {signal:AbortSignal.timeout(10000)});
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      const projects = [...new Map((Array.isArray(data.projects) ? data.projects : []).filter(p => Number.isSafeInteger(p.id) && p.id > 0 && typeof p.title === 'string' && /^[\w-]{1,30}$/.test(p.author)).map(p => [p.id,p])).values()].slice(0,16);
      if (!projects.length) throw new Error('No projects');
      const midpoint = Math.ceil(projects.length / 2);
      [projects.slice(0,midpoint),projects.slice(midpoint)].forEach((row,index) => {
        if (!row.length) {tracks[index].parentElement.hidden = true;return;}
        tracks[index].replaceChildren();
        for (const duplicate of [false,true]) {
          const group = document.createElement('div'); group.className = 'parade-group';
          row.forEach(p => group.append(card(p,duplicate))); tracks[index].append(group);
        }
      });
      status.textContent = 'Hover or focus a row to pause it. BetterScratch badges are community recognition.';
      void verify(new Set(projects.map(p => p.author)));
    } catch {
      status.textContent = 'Scratch projects are unavailable right now. Explore more on the Stats page.';
      tracks.forEach(track => { track.parentElement.hidden = true; });
    }
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {observer.disconnect();void load();}
    }, {rootMargin:'300px'}); observer.observe(section);
  } else void load();
})();

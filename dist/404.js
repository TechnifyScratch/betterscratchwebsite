(() => {
  const container = document.querySelector('#project-digits');
  const status = document.querySelector('#gallery-status');
  const refresh = document.querySelector('#gallery-refresh');
  const four = ['10010','10010','10010','11111','00010','00010','00010'];
  const zero = ['01110','11011','11011','11011','11011','11011','01110'];
  const cells = [four,zero,four].flatMap((digit,d) => digit.flatMap((row,y) => [...row].flatMap((value,x) => value==='1' ? [{x:d*6+x+1,y:y+1}] : [])));
  let projects = [], featured = [], busy = false;
  let previous = new Set();
  let batch = Math.floor(Math.random() * 16);
  function shuffled(items) {
    const result = [...items];
    for(let i=result.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [result[i],result[j]]=[result[j],result[i]]; }
    return result;
  }
  function draw() {
    container.replaceChildren();
    const unique = [...new Map(projects.map(project => [project.id, project])).values()];
    const picks = [];
    for (const name of ['viralgoose','-technify-']) {
      const candidates = unique.filter(p => featured.includes(p.id) && p.author.toLowerCase() === name);
      const unseen = candidates.filter(p => !previous.has(p.id));
      if (candidates.length) picks.push(shuffled(unseen.length ? unseen : candidates)[0]);
    }
    const remaining = unique.filter(p => !['viralgoose','-technify-'].includes(p.author.toLowerCase()));
    const fresh = shuffled(remaining.filter(p => !previous.has(p.id)));
    const older = shuffled(remaining.filter(p => previous.has(p.id)));
    const choices = shuffled([...picks, ...fresh, ...older].slice(0,cells.length));
    previous = new Set(choices.map(p => p.id));
    cells.forEach((cell,i) => {
      // Keep spare cells empty rather than repeating a project when the feed is small.
      const p = choices[i] || null;
      const tile = document.createElement(p?'a':'span');
      tile.className = 'project-digit-tile';
      tile.style.gridColumn=cell.x; tile.style.gridRow=cell.y;
      if(p) {
        tile.href=`https://scratch.mit.edu/projects/${p.id}/`;
        tile.target='_blank'; tile.rel='noopener noreferrer';
        tile.setAttribute('aria-label',`${p.title} by ${p.author}`);
        tile.title=`${p.title} — ${p.author}`;
        const img=document.createElement('img');
        img.src=`https://cdn2.scratch.mit.edu/get_image/project/${p.id}_216x162.png`;
        img.alt=''; img.width=216; img.height=162; img.decoding='async';
        img.addEventListener('error',()=>{img.hidden=true;});
        const caption=document.createElement('span'); caption.textContent=p.author;
        tile.append(img,caption);
      } else tile.setAttribute('aria-hidden','true');
      container.append(tile);
    });
  }
  async function load() {
    if(busy) return;
    busy=true; refresh.disabled=true;
    status.textContent='Finding a few Scratch projects…';
    try {
      const response=await fetch(`/api/gallery?batch=${batch}`,{signal:AbortSignal.timeout(10000)});
      if(!response.ok) throw new Error('Unavailable');
      const result=await response.json();
      projects=Array.isArray(result.projects)?result.projects.filter(p=>Number.isSafeInteger(p.id)&&p.id>0&&typeof p.title==='string'&&typeof p.author==='string'):[];
      featured = Array.isArray(result.featured) ? result.featured : [];
      if(!projects.length) throw new Error('Empty feed');
      const candidates = shuffled(projects);
      const developerNames = ['viralgoose','-technify-'];
      const selected = await Promise.all([
        ...developerNames.map(name => window.selectProjectThumbnails(candidates.filter(p => p.author.toLowerCase()===name),1)),
        window.selectProjectThumbnails([
          ...candidates.filter(p => !developerNames.includes(p.author.toLowerCase()) && !previous.has(p.id)),
          ...candidates.filter(p => !developerNames.includes(p.author.toLowerCase()) && previous.has(p.id))
        ],cells.length)
      ]);
      const checked = selected.flat();
      if (checked.length < cells.length) throw new Error('Not enough inspectable thumbnails');
      projects = checked;
      draw(); status.textContent='Hover to meet the creators. Click a thumbnail to play.';
    } catch { status.textContent='Scratch is taking a break. You can still head home, or try again.'; }
    finally {busy=false;refresh.disabled=false;}
  }
  refresh.addEventListener('click',()=>{if(busy) return; batch = (batch + 1 + Math.floor(Math.random()*15)) % 16; void load();});
  draw(); void load();
})();
